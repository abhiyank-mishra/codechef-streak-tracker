import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recentlyLoggedLeetCode = new Map<string, number>();

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
  const lowerUser = `lc_${payload.username.toLowerCase()}`;
  const lastTime = recentlyLoggedLeetCode.get(lowerUser);

  if (lastTime && now - lastTime < 30 * 60 * 1000) {
    return;
  }
  recentlyLoggedLeetCode.set(lowerUser, now);

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        platform: "LeetCode",
        ...payload,
      }),
    });
  } catch (err) {
    console.error("Google Sheet log error:", err);
  }
}

function cleanLeetCodeUsername(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.includes("leetcode.com/u/")) {
    cleaned = cleaned.split("leetcode.com/u/")[1].split("/")[0].split("?")[0];
  } else if (cleaned.includes("leetcode.com/")) {
    cleaned = cleaned.split("leetcode.com/")[1].split("/")[0].split("?")[0];
  }
  cleaned = cleaned.replace(/^@/, "");
  return cleaned.replace(/[^a-zA-Z0-9_-]/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("username") || searchParams.get("user");

    if (!query) {
      return NextResponse.json(
        { error: "Please enter a LeetCode username or profile link." },
        { status: 400 }
      );
    }

    const username = cleanLeetCodeUsername(query);
    if (!username) {
      return NextResponse.json(
        { error: "Invalid username. Please check and try again." },
        { status: 400 }
      );
    }

    const profileUrl = `https://leetcode.com/u/${username}/`;

    const gqlQuery = `
      query getLeetCodeUser($username: String!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          username
          profile {
            realName
            userAvatar
            countryName
            ranking
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userCalendar {
            streak
            totalActiveDays
          }
        }
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
          badge {
            name
          }
        }
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: gqlQuery,
        variables: { username },
      }),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to connect to LeetCode (Status: ${res.status}).` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const matchedUser = json.data?.matchedUser;

    if (!matchedUser) {
      return NextResponse.json(
        { error: `User '${username}' does not exist on LeetCode.` },
        { status: 404 }
      );
    }

    const name = matchedUser.profile?.realName || matchedUser.username;
    const country = matchedUser.profile?.countryName || null;
    const globalRank = matchedUser.profile?.ranking ? String(matchedUser.profile.ranking) : null;

    const contestRanking = json.data?.userContestRanking;
    const currentRating = contestRanking?.rating ? Math.round(contestRanking.rating) : 1500;
    const stars = contestRanking?.badge?.name || (contestRanking?.topPercentage ? `Top ${contestRanking.topPercentage}%` : "Contestant");

    // Problem breakdown & totals
    const submitStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const allCounts = json.data?.allQuestionsCount || [];

    const easySolved = submitStats.find((s: any) => s.difficulty === "Easy")?.count || 0;
    const mediumSolved = submitStats.find((s: any) => s.difficulty === "Medium")?.count || 0;
    const hardSolved = submitStats.find((s: any) => s.difficulty === "Hard")?.count || 0;
    const allSolved = submitStats.find((s: any) => s.difficulty === "All")?.count || (easySolved + mediumSolved + hardSolved);

    const easyTotal = allCounts.find((s: any) => s.difficulty === "Easy")?.count || 900;
    const mediumTotal = allCounts.find((s: any) => s.difficulty === "Medium")?.count || 2100;
    const hardTotal = allCounts.find((s: any) => s.difficulty === "Hard")?.count || 980;
    const allTotal = allCounts.find((s: any) => s.difficulty === "All")?.count || (easyTotal + mediumTotal + hardTotal);

    const solvedBreakdown = {
      easy: easySolved,
      easyTotal,
      medium: mediumSolved,
      mediumTotal,
      hard: hardSolved,
      hardTotal,
      total: allSolved,
      allTotal,
    };

    const userCalendar = matchedUser.userCalendar;
    const dailyStreak = userCalendar?.streak || 0;
    const totalActiveDays = userCalendar?.totalActiveDays || 0;

    // Contest history
    const rawContests = (json.data?.userContestRankingHistory || [])
      .filter((c: any) => c.attended)
      .sort((a: any, b: any) => (a.contest?.startTime || 0) - (b.contest?.startTime || 0));

    let prevRating = 1500; // LeetCode baseline initial rating
    let maxRating = currentRating;
    const processedContests: any[] = [];

    for (let i = 0; i < rawContests.length; i++) {
      const c = rawContests[i];
      const r = Math.round(c.rating || prevRating);
      if (r > maxRating) maxRating = r;
      const delta = r - prevRating;
      prevRating = r;

      const dateStr = c.contest?.startTime
        ? new Date(c.contest.startTime * 1000).toISOString().split("T")[0]
        : "";

      processedContests.push({
        code: c.contest?.title || `Contest ${i + 1}`,
        name: c.contest?.title || `Contest ${i + 1}`,
        date: dateStr,
        rating: r,
        rank: c.ranking || 0,
        color: "#f59e0b",
        delta,
      });
    }

    // Contest streak calculation
    let maxContestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < rawContests.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevTime = rawContests[i - 1].contest?.startTime || 0;
        const currTime = rawContests[i].contest?.startTime || 0;
        const diffDays = Math.round((currTime - prevTime) / 86400);

        // Consecutive weekly or biweekly contest (~7 to 14 days)
        if (diffDays <= 15) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > maxContestStreak) {
        maxContestStreak = tempStreak;
      }
    }

    const currentContestStreak = rawContests.length > 0 ? tempStreak : 0;

    const responseData = {
      platform: "leetcode",
      profile: {
        username: matchedUser.username,
        name,
        profileUrl,
        stars,
        currentRating,
        maxRating,
        globalRank,
        countryRank: null,
        country,
        userType: "LeetCoder",
        institution: null,
        problemsSolved: allSolved,
        solvedBreakdown,
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
        totalSubmissions: allSolved,
        currentDailyStreak: dailyStreak,
        maxDailyStreak: dailyStreak,
      },
      contests: processedContests.reverse(), // latest first
      ratingHistory: processedContests.slice().reverse(), // ascending
    };

    // Google Sheet logging
    logToGoogleSheet({
      username: matchedUser.username,
      name,
      profileUrl,
      currentRating,
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
    console.error("LeetCode API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + (error?.message || "Failed to process request") },
      { status: 500 }
    );
  }
}
