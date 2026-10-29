import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CodeforcesUserInfo {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  titlePhoto?: string;
  avatar?: string;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  verdict?: string;
  problem: {
    contestId?: number;
    index: string;
    name: string;
  };
}

function cleanHandle(input: string): string {
  let val = input.trim();
  if (val.includes("codeforces.com/profile/")) {
    val = val.split("codeforces.com/profile/")[1].split("/")[0].split("?")[0];
  }
  return val.replace(/^@/, "").trim();
}

async function logToGoogleSheet(params: {
  username: string;
  name: string;
  profileUrl: string;
  currentRating: number;
  rank: string;
  totalContests: number;
  currentContestStreak: number;
  country: string | null;
}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        platform: "codeforces",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Codeforces Google Sheets logging error:", err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawInput = searchParams.get("username") || searchParams.get("url") || "";

  if (!rawInput.trim()) {
    return NextResponse.json(
      { error: "Username or Codeforces profile URL is required." },
      { status: 400 }
    );
  }

  const handle = cleanHandle(rawInput);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // 1. Fetch user.info
    const userInfoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );

    clearTimeout(timeout);

    if (!userInfoRes.ok) {
      return NextResponse.json(
        { error: `Codeforces user '${handle}' not found.` },
        { status: 404 }
      );
    }

    const userInfoData = await userInfoRes.json();
    if (userInfoData.status !== "OK" || !userInfoData.result || userInfoData.result.length === 0) {
      return NextResponse.json(
        { error: `Codeforces user '${handle}' not found.` },
        { status: 404 }
      );
    }

    const user: CodeforcesUserInfo = userInfoData.result[0];

    // 2. Fetch user.rating & user.status in parallel
    const [ratingRes, statusRes] = await Promise.allSettled([
      fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
      fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=2000`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
    ]);

    // Process Rating Changes (Contests)
    let processedContests: Array<{
      code: string;
      name: string;
      date: string;
      rating: number;
      rank: number;
      color: string;
      delta: number;
    }> = [];

    if (ratingRes.status === "fulfilled" && ratingRes.value.ok) {
      try {
        const ratingData = await ratingRes.value.json();
        if (ratingData.status === "OK" && Array.isArray(ratingData.result)) {
          processedContests = ratingData.result.map((rc: CodeforcesRatingChange) => {
            const dateObj = new Date(rc.ratingUpdateTimeSeconds * 1000);
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const delta = rc.newRating - rc.oldRating;
            return {
              code: `CF-${rc.contestId}`,
              name: rc.contestName,
              date: dateStr,
              rating: rc.newRating,
              rank: rc.rank,
              color: "#ef4444",
              delta,
            };
          });
        }
      } catch (e) {
        console.error("Error parsing Codeforces rating changes:", e);
      }
    }

    // Process Submissions to find unique solved problems
    let uniqueSolvedCount = 0;
    if (statusRes.status === "fulfilled" && statusRes.value.ok) {
      try {
        const statusData = await statusRes.value.json();
        if (statusData.status === "OK" && Array.isArray(statusData.result)) {
          const solvedSet = new Set<string>();
          for (const sub of statusData.result as CodeforcesSubmission[]) {
            if (sub.verdict === "OK" && sub.problem) {
              const pKey = `${sub.problem.contestId || 0}_${sub.problem.index}`;
              solvedSet.add(pKey);
            }
          }
          uniqueSolvedCount = solvedSet.size;
        }
      } catch (e) {
        console.error("Error parsing Codeforces submissions:", e);
      }
    }

    // Calculate streaks
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < processedContests.length; i++) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    }
    currentStreak = processedContests.length > 0 ? tempStreak : 0;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.handle;

    const responseData = {
      platform: "codeforces",
      profile: {
        username: user.handle,
        name: fullName,
        profileUrl: `https://codeforces.com/profile/${user.handle}`,
        stars: user.rank ? user.rank.toUpperCase() : "UNRATED",
        currentRating: user.rating || 0,
        maxRating: user.maxRating || 0,
        globalRank: user.rank || null,
        countryRank: null,
        country: user.country || null,
        userType: user.rank || "Coder",
        institution: user.organization || null,
        problemsSolved: uniqueSolvedCount,
        avatar: user.avatar || user.titlePhoto || null,
      },
      stats: {
        totalContests: processedContests.length,
        currentContestStreak: currentStreak,
        maxContestStreak: maxStreak,
        lastContest:
          processedContests.length > 0
            ? processedContests[processedContests.length - 1]
            : null,
        totalActiveDays: 0,
        totalSubmissions: uniqueSolvedCount,
        currentDailyStreak: 0,
        maxDailyStreak: 0,
      },
      contests: processedContests.slice().reverse(), // latest first
      ratingHistory: processedContests, // chronological
    };

    // Google Sheets log
    logToGoogleSheet({
      username: user.handle,
      name: fullName,
      profileUrl: `https://codeforces.com/profile/${user.handle}`,
      currentRating: user.rating || 0,
      rank: user.rank || "unrated",
      totalContests: processedContests.length,
      currentContestStreak: currentStreak,
      country: user.country || null,
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
        { error: "Codeforces request timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch Codeforces profile." },
      { status: 500 }
    );
  }
}
