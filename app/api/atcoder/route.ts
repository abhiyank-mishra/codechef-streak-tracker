import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function cleanHandle(input: string): string {
  let val = input.trim();
  if (val.includes("atcoder.jp/users/")) {
    val = val.split("atcoder.jp/users/")[1].split("/")[0].split("?")[0];
  }
  return val.replace(/^@/, "").trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawInput = searchParams.get("username") || searchParams.get("url") || "";

  if (!rawInput.trim()) {
    return NextResponse.json(
      { error: "Username or AtCoder profile URL is required." },
      { status: 400 }
    );
  }

  const handle = cleanHandle(rawInput);
  const historyUrl = `https://atcoder.jp/users/${handle}/history/json`;
  const profileUrl = `https://atcoder.jp/users/${handle}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const [histRes, pageRes] = await Promise.all([
      fetch(historyUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
      fetch(profileUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
    ]);

    clearTimeout(timeout);

    if (pageRes.status === 404) {
      return NextResponse.json(
        { error: `AtCoder user '${handle}' not found.` },
        { status: 404 }
      );
    }

    const historyData = histRes.ok ? await histRes.json() : [];
    const html = pageRes.ok ? await pageRes.text() : "";

    // Extract rating, rank, country, etc. from profile HTML if available
    let currentRating = 0;
    let maxRating = 0;
    let country: string | null = null;
    let affiliation: string | null = null;

    const ratingMatch = html.match(/Rating<\/th>\s*<td>\s*<span[^>]*>(\d+)<\/span>/i);
    if (ratingMatch) currentRating = parseInt(ratingMatch[1], 10);

    const highestMatch = html.match(/Highest Rating<\/th>\s*<td>\s*<span[^>]*>(\d+)<\/span>/i);
    if (highestMatch) maxRating = parseInt(highestMatch[1], 10);

    const countryMatch = html.match(/Country\/Region<\/th>\s*<td>\s*<span[^>]*>([^<]+)<\/span>/i);
    if (countryMatch) country = countryMatch[1].trim();

    const affMatch = html.match(/Affiliation<\/th>\s*<td>([^<]+)<\/td>/i);
    if (affMatch) affiliation = affMatch[1].trim();

    // Process contests
    const processedContests: Array<{
      code: string;
      name: string;
      date: string;
      rating: number;
      rank: number;
      color: string;
      delta: number;
    }> = [];

    if (Array.isArray(historyData)) {
      historyData.forEach((item: any, idx: number) => {
        if (!item.IsRated && item.Place === 0) return;
        const dateStr = item.EndTime
          ? new Date(item.EndTime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : `Contest ${idx + 1}`;

        const delta = (item.NewRating || 0) - (item.OldRating || 0);
        if (item.NewRating && item.NewRating > maxRating) {
          maxRating = item.NewRating;
        }

        processedContests.push({
          code: item.ContestScreenName || `AC-${idx + 1}`,
          name: item.ContestNameEn || item.ContestName || `AtCoder Round ${idx + 1}`,
          date: dateStr,
          rating: item.NewRating || 0,
          rank: item.Place || 0,
          color: "#06b6d4",
          delta,
        });
      });
    }

    if (processedContests.length > 0 && currentRating === 0) {
      currentRating = processedContests[processedContests.length - 1].rating;
    }

    const responseData = {
      platform: "atcoder",
      profile: {
        username: handle,
        name: handle,
        profileUrl,
        stars: currentRating > 0 ? `${currentRating} Dan/Kyu` : "Active",
        currentRating,
        maxRating,
        globalRank: null,
        countryRank: null,
        country,
        userType: "AtCoder",
        institution: affiliation,
        problemsSolved: 0,
        avatar: null,
      },
      stats: {
        totalContests: processedContests.length,
        currentContestStreak: processedContests.length,
        maxContestStreak: processedContests.length,
        lastContest:
          processedContests.length > 0
            ? processedContests[processedContests.length - 1]
            : null,
        totalActiveDays: 0,
        totalSubmissions: 0,
        currentDailyStreak: 0,
        maxDailyStreak: 0,
      },
      contests: processedContests.slice().reverse(),
      ratingHistory: processedContests,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "AtCoder request timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch AtCoder profile." },
      { status: 500 }
    );
  }
}
