import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function cleanUsername(input: string): string {
  let val = input.trim();
  if (val.includes("geeksforgeeks.org/user/")) {
    val = val.split("geeksforgeeks.org/user/")[1].split("/")[0].split("?")[0];
  } else if (val.includes("geeksforgeeks.org/profile/")) {
    val = val.split("geeksforgeeks.org/profile/")[1].split("/")[0].split("?")[0];
  }
  return val.replace(/^@/, "").trim();
}

async function logToGoogleSheet(params: {
  username: string;
  name: string;
  profileUrl: string;
  codingScore: number;
  problemsSolved: number;
  currentStreak: number;
}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        platform: "gfg",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("GFG Google Sheets logging error:", err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawInput = searchParams.get("username") || searchParams.get("url") || "";

  if (!rawInput.trim()) {
    return NextResponse.json(
      { error: "Username or GeeksforGeeks profile URL is required." },
      { status: 400 }
    );
  }

  const username = cleanUsername(rawInput);
  const profileUrl = `https://www.geeksforgeeks.org/profile/${username}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(profileUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (res.status === 404) {
      return NextResponse.json(
        { error: `GeeksforGeeks user '${username}' not found.` },
        { status: 404 }
      );
    }

    const html = await res.text();

    // Check if user exists
    const hasData = html.includes("data retrieved successfully") || html.includes("articleCount");
    if (!hasData || html.includes("404 Not Found") && !html.includes("articleCount")) {
      return NextResponse.json(
        { error: `GeeksforGeeks user '${username}' not found.` },
        { status: 404 }
      );
    }

    // Extract fields
    const mentorNameMatch = html.match(
      /\\"mentor\\"\s*:\s*\{[^}]*?\\"name\\"\s*:\s*\\"([^\\"]+)\\"/
    );
    const articleNameMatch = html.match(
      /\\"articleCount\\"\s*:\s*\{[^}]*?\\"name\\"\s*:\s*\\"([^\\"]+)\\"/
    );
    const candidateName =
      (mentorNameMatch && mentorNameMatch[1]) ||
      (articleNameMatch && articleNameMatch[1]) ||
      "";
    const name =
      candidateName.trim() && candidateName !== "null" && candidateName !== "viewport"
        ? candidateName.trim()
        : username;
    const scoreMatch = html.match(/\\"score\\"\s*:\s*(\d+)/);
    const solvedMatch = html.match(/\\"total_problems_solved\\"\s*:\s*(\d+)/);
    const currentStreakMatch = html.match(/\\"pod_solved_current_streak\\"\s*:\s*(\d+)/);
    const maxStreakMatch = html.match(/\\"pod_solved_longest_streak\\"\s*:\s*(\d+)/);
    const rankMatch = html.match(/\\"institute_rank\\"\s*:\s*\\"([^\\"]+)\\"/);
    const instMatch = html.match(/\\"institute_name\\"\s*:\s*\\"([^\\"]+)\\"/);
    const avatarMatch = html.match(/\\"profile_image_url\\"\s*:\s*\\"([^\\"]+)\\"/);
    const codingScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const problemsSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
    const currentStreak = currentStreakMatch ? parseInt(currentStreakMatch[1], 10) : 0;
    const maxStreak = maxStreakMatch ? parseInt(maxStreakMatch[1], 10) : 0;
    const instituteRank = rankMatch ? rankMatch[1] : null;
    const instituteName = instMatch ? instMatch[1] : null;
    const avatar = avatarMatch ? avatarMatch[1].replace(/\\\//g, "/") : null;

    const responseData = {
      platform: "gfg",
      profile: {
        username,
        name,
        profileUrl,
        stars: codingScore > 0 ? `${codingScore} pts` : "Active",
        currentRating: codingScore,
        maxRating: codingScore,
        globalRank: null,
        countryRank: instituteRank ? `Institute #${instituteRank}` : null,
        country: null,
        userType: "Geek",
        institution: instituteName,
        problemsSolved,
        avatar,
      },
      stats: {
        totalContests: 0,
        currentContestStreak: currentStreak,
        maxContestStreak: maxStreak,
        lastContest: null,
        totalActiveDays: currentStreak,
        totalSubmissions: problemsSolved,
        currentDailyStreak: currentStreak,
        maxDailyStreak: maxStreak,
      },
      contests: [],
      ratingHistory: [],
    };

    // Google Sheets log
    logToGoogleSheet({
      username,
      name,
      profileUrl,
      codingScore,
      problemsSolved,
      currentStreak,
    }).catch(() => {});

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "GeeksforGeeks request timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch GeeksforGeeks profile." },
      { status: 500 }
    );
  }
}
