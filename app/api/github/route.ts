import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function cleanUsername(input: string): string {
  let val = input.trim();
  if (val.includes("github.com/")) {
    val = val.split("github.com/")[1].split("/")[0].split("?")[0];
  }
  return val.replace(/^@/, "").trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawInput = searchParams.get("username") || searchParams.get("url") || "";

  if (!rawInput.trim()) {
    return NextResponse.json(
      { error: "Username or GitHub profile URL is required." },
      { status: 400 }
    );
  }

  const username = cleanUsername(rawInput);
  const profileUrl = `https://github.com/${username}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    clearTimeout(timeout);

    if (res.status === 404) {
      return NextResponse.json(
        { error: `GitHub user '${username}' not found.` },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch GitHub profile (HTTP ${res.status}).` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const responseData = {
      platform: "github",
      profile: {
        username: data.login,
        name: data.name || data.login,
        profileUrl,
        stars: `${data.public_repos} Repos`,
        currentRating: data.public_repos,
        maxRating: data.followers,
        globalRank: `${data.followers} Followers`,
        countryRank: null,
        country: data.location || null,
        userType: "Developer",
        institution: data.company || null,
        problemsSolved: data.public_repos,
        avatar: data.avatar_url || null,
      },
      stats: {
        totalContests: 0,
        currentContestStreak: 0,
        maxContestStreak: 0,
        lastContest: null,
        totalActiveDays: 0,
        totalSubmissions: data.public_repos,
        currentDailyStreak: 0,
        maxDailyStreak: 0,
      },
      contests: [],
      ratingHistory: [],
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
        { error: "GitHub request timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to fetch GitHub profile." },
      { status: 500 }
    );
  }
}
