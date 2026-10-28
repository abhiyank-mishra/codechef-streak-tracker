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
        throw new Error(json.error || "Failed to fetch user data.");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
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
    const text = `CodeChef Stats for ${data.profile.name} (@${data.profile.username}):\n` +
      `Contests: ${data.stats.totalContests}\n` +
      `Current Streak: ${data.stats.currentContestStreak}\n` +
      `Max Streak: ${data.stats.maxContestStreak}\n` +
      `Rating: ${data.profile.currentRating} (${data.profile.stars}) | Peak: ${data.profile.maxRating}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <main className="min-h-screen px-3 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          CodeChef <span className="text-amber-400">Streak Tracker</span>
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Track contest participation and streak history
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 sm:relative">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter username or profile URL..."
              className="w-full pl-10 pr-4 sm:pr-28 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="sm:absolute sm:right-1.5 sm:top-1/2 sm:-translate-y-1/2 px-4 py-2 sm:py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-xl mx-auto mb-6 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 flex items-center gap-2.5 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 rounded-2xl bg-zinc-900 border border-zinc-800"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-900 border border-zinc-800"></div>
            ))}
          </div>
          <div className="h-52 rounded-2xl bg-zinc-900 border border-zinc-800"></div>
        </div>
      )}

      {/* Main Results Display */}
      {!loading && data && (
        <div className="space-y-4 sm:space-y-6">
          {/* User Profile Card */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                  {data.profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">{data.profile.name}</h2>
                    <a
                      href={data.profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
                      title="View on CodeChef"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span className="text-amber-400/90">@{data.profile.username}</span>
                    {data.profile.country && (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {data.profile.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Share</span>
                    </>
                  )}
                </button>
                <a
                  href={data.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>
            </div>
          </div>

          {/* 4 Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Total Contests */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3.5">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[10px] uppercase font-medium tracking-wider">Contests</span>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {data.stats.totalContests}
              </div>
            </div>

            {/* Streak */}
            <div className="rounded-xl bg-zinc-900 border border-amber-500/20 p-3.5">
              <div className="flex items-center justify-between text-amber-400/80 mb-1">
                <span className="text-[10px] uppercase font-medium tracking-wider">Streak</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-amber-400">{data.stats.currentContestStreak}</span>
                <span className="text-[11px] text-zinc-500">contests</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Max: {data.stats.maxContestStreak}
              </div>
            </div>

            {/* Rating */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3.5">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[10px] uppercase font-medium tracking-wider">Rating</span>
                <Award className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-white">{data.profile.currentRating}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRatingBadgeColor(data.profile.currentRating)}`}>
                  {data.profile.stars}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Peak: {data.profile.maxRating}
              </div>
            </div>

            {/* Global Rank */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3.5">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[10px] uppercase font-medium tracking-wider">Rank</span>
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="text-lg font-bold text-white truncate">
                {data.profile.globalRank ? `#${data.profile.globalRank}` : "—"}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                Country: {data.profile.countryRank ? `#${data.profile.countryRank}` : "—"}
              </div>
            </div>
          </div>

          {/* Rating Progression Chart */}
          {data.ratingHistory.length > 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Rating History
                </h3>
                <span className="text-[11px] text-zinc-500">
                  {data.ratingHistory.length} contests
                </span>
              </div>

              {/* Chart */}
              <div className="w-full overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
                <div className="min-w-[460px] sm:min-w-[560px] h-36 sm:h-40 relative">
                  {(() => {
                    const ratings = data.ratingHistory.map((c) => c.rating);
                    const minR = Math.min(...ratings, 700);
                    const maxR = Math.max(...ratings, 1000);
                    const range = Math.max(maxR - minR, 80);
                    const width = 560;
                    const height = 120;

                    const points = data.ratingHistory.map((c, idx) => {
                      const x = (idx / Math.max(data.ratingHistory.length - 1, 1)) * (width - 50) + 25;
                      const y = height - ((c.rating - minR) / range) * (height - 30) - 15;
                      return { x, y, c };
                    });

                    const pathString = points
                      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                      .join(" ");

                    return (
                      <svg viewBox={`0 0 ${width} ${height + 25}`} className="w-full h-full overflow-visible">
                        <line x1="15" y1="15" x2={width - 15} y2="15" stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="15" y1={height / 2} x2={width - 15} y2={height / 2} stroke="#27272a" strokeDasharray="3 3" />
                        <line x1="15" y1={height - 15} x2={width - 15} y2={height - 15} stroke="#27272a" strokeDasharray="3 3" />

                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {points.length > 1 && (
                          <path
                            d={`${pathString} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
                            fill="url(#chartGradient)"
                          />
                        )}

                        <path d={pathString} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#18181b" stroke="#f59e0b" strokeWidth="2" />
                            <text
                              x={p.x}
                              y={p.y - 8}
                              fill="#fbbf24"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {p.c.rating}
                            </text>
                            <text
                              x={p.x}
                              y={height + 16}
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
            </div>
          )}

          {/* Contest Breakdown Table */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Contests
              </h3>
              <span className="text-[11px] text-zinc-500">
                {data.contests.length} Total
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-medium">
                      <th className="py-2.5 px-3">Contest</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                    {data.contests.map((c, i) => (
                      <tr key={c.code + i} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">{c.date}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                          {c.rank > 0 ? `#${c.rank}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">{c.rating}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {c.delta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-950/60 text-green-400 border border-green-500/20">
                              <TrendingUp className="w-2.5 h-2.5" />
                              +{c.delta}
                            </span>
                          ) : c.delta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-500/20">
                              <TrendingDown className="w-2.5 h-2.5" />
                              {c.delta}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-[10px]">0</span>
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
      <footer className="mt-12 text-center text-[11px] text-zinc-600">
        CodeChef Streak Tracker
      </footer>
    </main>
  );
}
