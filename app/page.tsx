"use client";

import React, { useState } from "react";
import {
  Flame,
  Trophy,
  Award,
  Globe,
  MapPin,
  ExternalLink,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ContestItem {
  code: string;
  name: string;
  date: string;
  rating: number;
  rank: number;
  color: string;
  delta: number;
}

interface UserProfile {
  username: string;
  name: string;
  profileUrl: string;
  stars: string;
  currentRating: number;
  maxRating: number;
  globalRank: string | null;
  countryRank: string | null;
  country: string | null;
  userType: string | null;
  institution: string | null;
  problemsSolved: number;
}

interface UserStats {
  totalContests: number;
  currentContestStreak: number;
  maxContestStreak: number;
  lastContest: ContestItem | null;
  totalActiveDays: number;
  totalSubmissions: number;
  currentDailyStreak: number;
  maxDailyStreak: number;
}

interface ApiResponse {
  profile: UserProfile;
  stats: UserStats;
  contests: ContestItem[];
  ratingHistory: ContestItem[];
}

export default function Home() {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUserData = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/codechef?query=${encodeURIComponent(queryToSearch.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "User data fetch nahi ho saka.");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Kuch galat hua. Kripya dobara try karein.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    // Prevent duplicate re-fetching if already viewing the same user
    const currentHandle = data?.profile?.username?.toLowerCase();
    const cleanInput = query
      .replace(/^.*codechef\.com\/users\//, "")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    if (currentHandle && cleanInput === currentHandle && !error) {
      return;
    }

    fetchUserData(query);
  };

  const handleCopySummary = () => {
    if (!data) return;
    const text = `🔥 CodeChef Streak Stats for ${data.profile.name} (@${data.profile.username}):\n` +
      `🏆 Total Contests: ${data.stats.totalContests}\n` +
      `🔥 Current Contest Streak: ${data.stats.currentContestStreak} contests\n` +
      `⚡ Max Contest Streak: ${data.stats.maxContestStreak} contests\n` +
      `⭐ Rating: ${data.profile.currentRating} (${data.profile.stars}) | Peak: ${data.profile.maxRating}\n` +
      `Check your streak here!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 2500) return "text-red-400 bg-red-950/40 border-red-500/30";
    if (rating >= 2200) return "text-orange-400 bg-orange-950/40 border-orange-500/30";
    if (rating >= 2000) return "text-yellow-400 bg-yellow-950/40 border-yellow-500/30";
    if (rating >= 1800) return "text-purple-400 bg-purple-950/40 border-purple-500/30";
    if (rating >= 1600) return "text-blue-400 bg-blue-950/40 border-blue-500/30";
    if (rating >= 1400) return "text-green-400 bg-green-950/40 border-green-500/30";
    return "text-zinc-300 bg-zinc-800/60 border-zinc-700/50";
  };

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          CodeChef <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Streak & Contest</span> Tracker
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto px-2">
          Apna CodeChef profile link ya username enter karein aur dekhein total contests, active streak, aur rating trajectory!
        </p>
      </div>

      {/* Search Bar (Mobile & Desktop Optimized) */}
      <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 sm:relative shadow-2xl">
          <div className="relative flex-1">
            <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Profile URL ya username paste karein..."
              className="w-full pl-10 sm:pl-12 pr-4 sm:pr-36 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-zinc-900/90 border border-zinc-700/60 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-base shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2 px-5 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Check Streak</span>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl sm:rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-xs sm:text-sm">User Data Nahi Mila</div>
            <div className="text-xs text-red-300/90 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 sm:space-y-6 animate-pulse">
          <div className="h-28 sm:h-32 rounded-2xl sm:rounded-3xl bg-zinc-800/40 border border-zinc-700/40"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 sm:h-28 rounded-xl sm:rounded-2xl bg-zinc-800/40 border border-zinc-700/40"></div>
            ))}
          </div>
          <div className="h-56 sm:h-64 rounded-2xl sm:rounded-3xl bg-zinc-800/40 border border-zinc-700/40"></div>
        </div>
      )}

      {/* Empty State / Welcome Screen */}
      {!loading && !data && !error && (
        <div className="text-center py-12 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-zinc-900/40 border border-zinc-800/80 max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-white">Kisi bhi CodeChef profile ka link ya username daalein</h3>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
            Upar search box me kisi bhi user ki profile URL paste karein ya username likhein aur &quot;Check Streak&quot; button dabayein.
          </p>
        </div>
      )}

      {/* Main Results Display */}
      {!loading && data && (
        <div className="space-y-4 sm:space-y-6">
          {/* User Profile Card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-black text-xl sm:text-2xl shadow-lg ring-4 ring-amber-500/20 shrink-0">
                  {data.profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{data.profile.name}</h2>
                    <a
                      href={data.profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-amber-400 transition-colors shrink-0"
                      title="Open CodeChef Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-400 mt-1">
                    <span className="text-amber-400 font-medium">@{data.profile.username}</span>
                    {data.profile.country && (
                      <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                        {data.profile.country}
                      </span>
                    )}
                    {data.profile.userType && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[10px] sm:text-xs">
                        {data.profile.userType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Share & Actions */}
              <div className="grid grid-cols-2 sm:flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  onClick={handleCopySummary}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Share Streak</span>
                    </>
                  )}
                </button>
                <a
                  href={data.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 sm:px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <span>CodeChef</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Key Stats Metric Grid (2 cols on mobile, 4 on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. Total Contests */}
            <div className="rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Total Contests</span>
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {data.stats.totalContests}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 line-clamp-1">
                Official contests
              </p>
            </div>

            {/* 2. Active Contest Streak */}
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-950/30 to-orange-950/20 border border-amber-500/30 p-3.5 sm:p-5 relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between text-amber-300 mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Contest Streak</span>
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 animate-bounce" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="text-2xl sm:text-3xl font-black text-orange-400">
                  {data.stats.currentContestStreak}
                </div>
                <span className="text-[10px] sm:text-xs text-amber-200/80 font-medium">in a row</span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-1">
                Max: <strong className="text-white">{data.stats.maxContestStreak}</strong>
              </p>
            </div>

            {/* 3. Rating & Stars */}
            <div className="rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Rating</span>
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">{data.profile.currentRating}</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold border ${getRatingBadgeColor(data.profile.currentRating)}`}>
                  {data.profile.stars}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-1">
                Peak: <strong className="text-zinc-300">{data.profile.maxRating}</strong>
              </p>
            </div>

            {/* 4. Global & Country Rank */}
            <div className="rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Rankings</span>
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-white truncate">
                {data.profile.globalRank ? `#${data.profile.globalRank}` : "N/A"}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 truncate">
                Country: <span className="text-zinc-200 font-semibold">{data.profile.countryRank ? `#${data.profile.countryRank}` : "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Streak Status Insights Callout */}
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-xs sm:text-base">
                  Streak Status: {data.stats.currentContestStreak > 0 ? (
                    <span className="text-amber-400 font-bold">Active 🔥</span>
                  ) : (
                    <span className="text-zinc-400">Needs Next Contest</span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-sm text-zinc-400 mt-0.5">
                  {data.stats.currentContestStreak > 0
                    ? `User ne lagataar ${data.stats.currentContestStreak} contests diye hain! All-time record: ${data.stats.maxContestStreak} contests.`
                    : `Total ${data.stats.totalContests} contests diye hain. Agle Starters contest me participate karke nayi streak banayein!`}
                </p>
              </div>
            </div>
            {data.stats.lastContest && (
              <div className="text-[11px] sm:text-xs text-zinc-400 bg-zinc-900/90 px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-zinc-800 w-full sm:w-auto text-left sm:text-right shrink-0">
                <span>Last: </span>
                <strong className="text-amber-300">{data.stats.lastContest.name}</strong>
                <span className="text-zinc-500 ml-1">({data.stats.lastContest.date})</span>
              </div>
            )}
          </div>

          {/* Rating Progression Graph (SVG with Horizontal Touch Scroll) */}
          {data.ratingHistory.length > 0 && (
            <div className="rounded-2xl sm:rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    Contest Rating Trajectory
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                    Rating changes across all {data.ratingHistory.length} contests
                  </p>
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 bg-zinc-800/60 px-2 sm:px-3 py-1 rounded-lg border border-zinc-700/40">
                  Peak: {data.profile.maxRating}
                </div>
              </div>

              {/* Chart container with horizontal scroll on mobile */}
              <div className="w-full overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
                <div className="min-w-[500px] sm:min-w-[600px] h-44 sm:h-48 relative">
                  {(() => {
                    const ratings = data.ratingHistory.map((c) => c.rating);
                    const minR = Math.min(...ratings, 700);
                    const maxR = Math.max(...ratings, 1000);
                    const range = Math.max(maxR - minR, 100);
                    const width = 600;
                    const height = 150;

                    const points = data.ratingHistory.map((c, idx) => {
                      const x = (idx / Math.max(data.ratingHistory.length - 1, 1)) * (width - 60) + 30;
                      const y = height - ((c.rating - minR) / range) * (height - 40) - 20;
                      return { x, y, c };
                    });

                    const pathString = points
                      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                      .join(" ");

                    return (
                      <svg viewBox={`0 0 ${width} ${height + 30}`} className="w-full h-full overflow-visible">
                        {/* Grid lines */}
                        <line x1="20" y1="20" x2={width - 20} y2="20" stroke="#27272a" strokeDasharray="4 4" />
                        <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="#27272a" strokeDasharray="4 4" />
                        <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="#27272a" strokeDasharray="4 4" />

                        {/* Fill Gradient Area */}
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {points.length > 1 && (
                          <path
                            d={`${pathString} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
                            fill="url(#chartGradient)"
                          />
                        )}

                        {/* Line */}
                        <path d={pathString} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Points & Labels */}
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4.5" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
                            <text
                              x={p.x}
                              y={p.y - 10}
                              fill="#fbbf24"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {p.c.rating}
                            </text>
                            <text
                              x={p.x}
                              y={height + 18}
                              fill="#71717a"
                              fontSize="9"
                              textAnchor="middle"
                            >
                              {p.c.code}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 sm:hidden text-center mt-1">
                ← Swipe horizontally to see all contest points →
              </div>
            </div>
          )}

          {/* Contest History Table */}
          <div className="rounded-2xl sm:rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-4 sm:p-6 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  Contest Breakdown
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                  Latest contests first
                </p>
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-zinc-800 border border-zinc-700">
                {data.contests.length} Contests
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] sm:text-xs uppercase font-medium">
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4">Contest Name</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4">Date</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4">Rank</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4">Rating</th>
                      <th className="py-2.5 sm:py-3 px-2 sm:px-4">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {data.contests.map((c, i) => (
                      <tr key={c.code + i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-semibold text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[11px] sm:text-xs text-zinc-400 whitespace-nowrap">{c.date}</td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[11px] sm:text-xs font-mono text-zinc-300 whitespace-nowrap">
                          {c.rank > 0 ? `#${c.rank}` : "—"}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-white whitespace-nowrap">{c.rating}</td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 whitespace-nowrap">
                          {c.delta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-green-950/60 text-green-400 border border-green-500/30">
                              <TrendingUp className="w-3 h-3" />
                              +{c.delta}
                            </span>
                          ) : c.delta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                              <TrendingDown className="w-3 h-3" />
                              {c.delta}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-zinc-800/80 text-center text-[11px] sm:text-xs text-zinc-500 space-y-1 sm:space-y-2">
        <p>CodeChef Streak & Contest Intelligence Tracker</p>
        <p className="text-zinc-600">Enter any valid CodeChef username or link to inspect participation streaks.</p>
      </footer>
    </main>
  );
}
