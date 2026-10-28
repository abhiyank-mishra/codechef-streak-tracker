import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory cache to prevent duplicate Google Sheet logging for the same user within 30 minutes
const recentlyLogged = new Map<string, number>();

async function logToGoogleSheet(payload: {
  username: string;
  name: string;
  profileUrl: string;
  currentRating: number;
  stars: string;
  totalContests: number;
  currentContestStreak: number;
  country: string | null;
}) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return;

  const now = Date.now();
  const lowerUser = payload.username.toLowerCase();
  const lastTime = recentlyLogged.get(lowerUser);

  // If logged in the last 30 minutes, skip sending duplicate log
  if (lastTime && now - lastTime < 30 * 60 * 1000) {
    return;
  }
  recentlyLogged.set(lowerUser, now);

  // Garbage collect cache if map grows large
  if (recentlyLogged.size > 2000) {
    for (const [key, time] of recentlyLogged.entries()) {
      if (now - time > 30 * 60 * 1000) recentlyLogged.delete(key);
    }
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        ...payload,
      }),
    });
  } catch (err) {
    console.error("Google Sheet log error:", err);
  }
}

function cleanUsername(raw: string): string {
  let cleaned = raw.trim();
  // Strip URL if full profile link was provided
  if (cleaned.includes("codechef.com/users/")) {
    cleaned = cleaned.split("codechef.com/users/")[1].split("/")[0].split("?")[0];
  } else if (cleaned.includes("codechef.com/")) {
    cleaned = cleaned.split("codechef.com/")[1].split("/")[0].split("?")[0];
  }
  // Remove @ if typed like @username
  cleaned = cleaned.replace(/^@/, "");
  // Sanitize
  return cleaned.replace(/[^a-zA-Z0-9_]/g, "");
}

export interface ContestItem {
  code: string;
  name: string;
  date: string;
  rating: number;
  rank: number;
  color: string;
  delta: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("username") || searchParams.get("user");

    if (!query) {
      return NextResponse.json(
        { error: "Please enter a CodeChef username or profile link." },
        { status: 400 }
      );
    }

    const username = cleanUsername(query);
    if (!username) {
      return NextResponse.json(
        { error: "Invalid username. Please check and try again." },
        { status: 400 }
      );
    }

    const profileUrl = `https://www.codechef.com/users/${username}`;

    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 60 }, // Cache on Vercel for 60 seconds
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: `User '${username}' not found on CodeChef.` },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to connect to CodeChef (Status: ${res.status}).` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Profile details
    const name = $("h1.h2-style").text().trim() || username;
    const ratingRaw = $(".rating-number").first().text().replace(/[^0-9]/g, "");
    let currentRating = ratingRaw ? parseInt(ratingRaw, 10) : null;
    const stars = $(".rating-star").text().trim() || "1★";

    // Global & Country rank
    let globalRank: string | null = null;
    let countryRank: string | null = null;
    const rankEl = $(".rating-ranks strong");
    if (rankEl.length >= 2) {
      globalRank = $(rankEl[0]).text().trim() || null;
      countryRank = $(rankEl[1]).text().trim() || null;
    }

    // Country & Organization
    let country: string | null = null;
    let userType: string | null = null;
    let institution: string | null = null;
    $(".user-details li").each((_, el) => {
      const text = $(el).text();
      if (text.includes("Country:")) {
        country = $(el).find(".user-country-name").text().trim() || text.replace("Country:", "").trim();
      }
      if (text.includes("Student/Professional:")) {
        userType = text.replace("Student/Professional:", "").trim();
      }
      if (text.includes("Institution:")) {
        institution = text.replace("Institution:", "").trim();
      }
    });

    // Contest Data from Drupal settings
    const dvrMatch = html.match(/"date_versus_rating":\s*(\{.*?\})\s*,\s*"user_initial_ratings"/);
    const rawContests: any[] = [];
    if (dvrMatch) {
      try {
        const parsed = JSON.parse(dvrMatch[1]);
        if (Array.isArray(parsed.all)) {
          rawContests.push(...parsed.all);
        }
      } catch (e) {
        console.error("Failed to parse date_versus_rating:", e);
      }
    }

    // Sort ascending by end_date
    rawContests.sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    );

    // If currentRating wasn't in HTML, pick the rating from latest contest
    if (!currentRating && rawContests.length > 0) {
      const last = rawContests[rawContests.length - 1];
      if (last.rating) currentRating = parseInt(last.rating, 10);
    }

    // Compute max rating
    let maxRating = currentRating || 0;
    $("small").each((_, el) => {
      const text = $(el).text();
      if (text.includes("Highest Rating")) {
        const m = text.match(/\d+/);
        if (m) {
          const val = parseInt(m[0], 10);
          if (val > maxRating) maxRating = val;
        }
      }
    });
    for (const c of rawContests) {
      const r = parseInt(c.rating, 10);
      if (r > maxRating) maxRating = r;
    }

    // Process contests and calculate deltas
    let prevRating = 1000; // CodeChef baseline initial rating
    const processedContests: ContestItem[] = [];

    for (let i = 0; i < rawContests.length; i++) {
      const c = rawContests[i];
      const r = parseInt(c.rating, 10) || prevRating;
      const delta = i === 0 ? r - 1000 : r - prevRating;
      prevRating = r;

      processedContests.push({
        code: c.code || `CONTEST_${i + 1}`,
        name: c.name || c.code || "Contest",
        date: c.end_date ? c.end_date.split(" ")[0] : "",
        rating: r,
        rank: parseInt(c.rank, 10) || 0,
        color: c.color || "#666666",
        delta,
      });
    }

    // Calculate Contest Streak
    // CodeChef Starters happen weekly (Wednesdays).
    // Consecutive contest means:
    // 1) Contest codes differ by 1 (e.g., START255, START256) OR
    // 2) The difference in days between consecutive contest dates is <= 10 days.
    let maxContestStreak = 0;
    let tempStreak = 0;
    const streaksList: number[] = [];

    for (let i = 0; i < rawContests.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = rawContests[i - 1];
        const curr = rawContests[i];

        const prevDate = new Date(prev.end_date);
        const currDate = new Date(curr.end_date);
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const prevCodeMatch = (prev.code || "").match(/\d+/);
        const currCodeMatch = (curr.code || "").match(/\d+/);
        const isConsecutiveNumber =
          prevCodeMatch &&
          currCodeMatch &&
          parseInt(currCodeMatch[0], 10) - parseInt(prevCodeMatch[0], 10) === 1;

        const isConsecutiveWeekly = diffDays >= 5 && diffDays <= 11;

        if (isConsecutiveNumber || isConsecutiveWeekly) {
          tempStreak++;
        } else {
          streaksList.push(tempStreak);
          tempStreak = 1;
        }
      }

      if (tempStreak > maxContestStreak) {
        maxContestStreak = tempStreak;
      }
    }
    if (tempStreak > 0) {
      streaksList.push(tempStreak);
    }

    const currentContestStreak = rawContests.length > 0 ? tempStreak : 0;

    // Daily submissions activity from heatmap
    const hmMatch = html.match(/var\s+userDailySubmissionsStats\s*=\s*(\[.*?\]);/s);
    let totalSubmissions = 0;
    let totalActiveDays = 0;
    let currentDailyStreak = 0;
    let maxDailyStreak = 0;

    if (hmMatch) {
      try {
        const dailyStats: Array<{ date: string; value: number }> = JSON.parse(hmMatch[1]);
        totalActiveDays = dailyStats.length;
        totalSubmissions = dailyStats.reduce((acc, curr) => acc + (curr.value || 0), 0);

        // Sort dates
        const dateList = dailyStats
          .map((item) => new Date(item.date).getTime())
          .filter((t) => !isNaN(t))
          .sort((a, b) => a - b);

        let curDStreak = 0;
        let maxDStreak = 0;
        for (let i = 0; i < dateList.length; i++) {
          if (i === 0) {
            curDStreak = 1;
          } else {
            const diffDays = Math.round((dateList[i] - dateList[i - 1]) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              curDStreak++;
            } else if (diffDays > 1) {
              curDStreak = 1;
            }
          }
          if (curDStreak > maxDStreak) {
            maxDStreak = curDStreak;
          }
        }
        maxDailyStreak = maxDStreak;
        currentDailyStreak = curDStreak;
      } catch (e) {
        console.error("Failed to parse daily stats:", e);
      }
    }

    // Total problems solved
    let problemsSolved = 0;
    $("section.problems-solved h3").each((_, el) => {
      const text = $(el).text();
      if (text.includes("Total Problems Solved")) {
        const m = text.match(/\d+/);
        if (m) problemsSolved = parseInt(m[0], 10);
      }
    });

    const responseData = {
      profile: {
        username,
        name,
        profileUrl,
        stars,
        currentRating: currentRating || 0,
        maxRating: maxRating || currentRating || 0,
        globalRank,
        countryRank,
        country,
        userType,
        institution,
        problemsSolved,
      },
      stats: {
        totalContests: processedContests.length,
        currentContestStreak,
        maxContestStreak,
        lastContest:
          processedContests.length > 0
            ? processedContests[processedContests.length - 1]
            : null,
        totalActiveDays,
        totalSubmissions,
        currentDailyStreak,
        maxDailyStreak,
      },
      contests: processedContests.reverse(), // latest first for table
      ratingHistory: processedContests.slice().reverse(), // ascending for graph
    };

    // Non-blocking log to Google Sheet if webhook configured
    logToGoogleSheet({
      username,
      name,
      profileUrl,
      currentRating: currentRating || 0,
      stars,
      totalContests: processedContests.length,
      currentContestStreak,
      country,
    }).catch(() => {});

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + (error?.message || "Failed to process request") },
      { status: 500 }
    );
  }
}
