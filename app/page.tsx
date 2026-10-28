"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Trophy,
  Award,
  Globe,
  MapPin,
  ExternalLink,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Code2,
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
    fetchUserData(inputVal);
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
    <main className="min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto">
      {/* Top Banner & Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs md:text-sm font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Vercel-Ready Next.js Tracker</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          CodeChef <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Streak & Contest</span> Tracker
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
          Apna CodeChef profile link ya username enter karein aur dekhein apne total contests, active contest streak, aur rating history!
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSubmit} className="relative flex items-center shadow-2xl">
          <div className="absolute left-4 text-zinc-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="e.g. https://www.codechef.com/users/abhiyank_in ya abhiyank_in"
            className="w-full pl-12 pr-32 py-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm md:text-base shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:scale-[1.02] active:scale-[0.98]"
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

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-zinc-400">
          <span>Try quick profiles:</span>
          {["abhiyank_in", "tourist", "admin"].map((handle) => (
            <button
              key={handle}
              onClick={() => {
                setInputVal(handle);
                fetchUserData(handle);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
            >
              @{handle}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Error Occurred</div>
            <div className="text-xs text-red-300/90 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-32 rounded-3xl bg-zinc-800/40 border border-zinc-700/40"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-zinc-800/40 border border-zinc-700/40"></div>
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-zinc-800/40 border border-zinc-700/40"></div>
        </div>
      )}

      {/* Empty State / Welcome Screen */}
      {!loading && !data && !error && (
        <div className="text-center py-12 px-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white">Kisi bhi CodeChef profile ka link ya username daalein</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Upar diye gaye search box me apni ya kisi bhi dost ki CodeChef profile URL (jaise <span className="text-amber-400">codechef.com/users/...</span>) paste karein aur &quot;Check Streak&quot; par click karein.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setInputVal("abhiyank_in");
                fetchUserData("abhiyank_in");
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-zinc-700 transition-all"
            >
              Check @abhiyank_in
            </button>
            <button
              onClick={() => {
                setInputVal("tourist");
                fetchUserData("tourist");
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-all"
            >
              Check @tourist
            </button>
          </div>
        </div>
      )}

      {/* Main Results Display */}
      {!loading && data && (
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 md:p-8 backdrop-blur-md shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-black text-2xl shadow-lg ring-4 ring-amber-500/20">
                  {data.profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{data.profile.name}</h2>
                    <a
                      href={data.profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-amber-400 transition-colors"
                      title="Open CodeChef Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-400 mt-1">
                    <span className="text-amber-400 font-medium">@{data.profile.username}</span>
                    {data.profile.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {data.profile.country}
                      </span>
                    )}
                    {data.profile.userType && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                        {data.profile.userType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Share & Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs md:text-sm font-medium transition-all flex items-center gap-2 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Copied Stats!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      <span>Share Streak</span>
                    </>
                  )}
                </button>
                <a
                  href={data.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs md:text-sm font-medium transition-all flex items-center gap-2"
                >
                  <span>CodeChef</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Key Stats Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Contests */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Contests</span>
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {data.stats.totalContests}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Total contests participated on CodeChef
              </p>
            </div>

            {/* 2. Active Contest Streak */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-950/30 to-orange-950/20 border border-amber-500/30 p-5 relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between text-amber-300 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Contest Streak</span>
                <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-orange-400">
                  {data.stats.currentContestStreak}
                </div>
                <span className="text-xs text-amber-200/80 font-medium">contests in a row</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Max streak: <strong className="text-white">{data.stats.maxContestStreak} contests</strong>
              </p>
            </div>

            {/* 3. Rating & Stars */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Rating & Tier</span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white">{data.profile.currentRating}</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getRatingBadgeColor(data.profile.currentRating)}`}>
                  {data.profile.stars}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Peak rating: <strong className="text-zinc-300">{data.profile.maxRating}</strong>
              </p>
            </div>

            {/* 4. Global & Country Rank */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Rankings</span>
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white">
                {data.profile.globalRank ? `#${data.profile.globalRank}` : "N/A"}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Country Rank: <span className="text-zinc-200 font-semibold">{data.profile.countryRank ? `#${data.profile.countryRank}` : "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Streak Status Insights Callout */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm md:text-base">
                  Streak Status: {data.stats.currentContestStreak > 0 ? (
                    <span className="text-amber-400 font-bold">Active 🔥</span>
                  ) : (
                    <span className="text-zinc-400">Needs Next Contest</span>
                  )}
                </h3>
                <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
                  {data.stats.currentContestStreak > 0
                    ? `User ne lagataar ${data.stats.currentContestStreak} contests diye hain! All-time record: ${data.stats.maxContestStreak} contests.`
                    : `Total ${data.stats.totalContests} contests diye hain. Agle Starters contest me participate karke nayi streak banayein!`}
                </p>
              </div>
            </div>
            {data.stats.lastContest && (
              <div className="text-xs text-zinc-400 bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800 shrink-0">
                <span>Last Contest: </span>
                <strong className="text-amber-300">{data.stats.lastContest.name}</strong>
                <span className="text-zinc-500 ml-1">({data.stats.lastContest.date})</span>
              </div>
            )}
          </div>

          {/* Rating Progression Graph (SVG) */}
          {data.ratingHistory.length > 0 && (
            <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Contest Rating Trajectory
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Rating changes across all {data.ratingHistory.length} contests
                  </p>
                </div>
                <div className="text-xs text-zinc-400 bg-zinc-800/60 px-3 py-1 rounded-lg border border-zinc-700/40">
                  Base 1000 ➔ Latest {data.profile.currentRating}
                </div>
              </div>

              {/* Simple Responsive SVG Chart */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px] h-48 relative">
                  {(() => {
                    const ratings = data.ratingHistory.map((c) => c.rating);
                    const minR = Math.min(...ratings, 700);
                    const maxR = Math.max(...ratings, 1000);
                    const range = Math.max(maxR - minR, 100);
                    const width = 600;
                    const height = 160;

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
                            <circle cx={p.x} cy={p.y} r="5" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
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
            </div>
          )}

          {/* Contest History Table */}
          <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Contest History Breakdown
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pichle sabhi contests ki poori details (Latest first)
                </p>
              </div>
              <span className="text-xs text-zinc-400 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
                {data.contests.length} Contests
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase font-medium">
                    <th className="py-3 px-4">Contest Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {data.contests.map((c, i) => (
                    <tr key={c.code + i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400">{c.date}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-300">
                        {c.rank > 0 ? `#${c.rank}` : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{c.rating}</td>
                      <td className="py-3.5 px-4">
                        {c.delta > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-950/60 text-green-400 border border-green-500/30">
                            <TrendingUp className="w-3 h-3" />
                            +{c.delta}
                          </span>
                        ) : c.delta < 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
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
      )}

      {/* Footer & Deploy Guide */}
      <footer className="mt-16 pt-8 border-t border-zinc-800/80 text-center text-xs text-zinc-500 space-y-2">
        <p>Built with Next.js 14, Tailwind CSS & Serverless API. Optimized for Vercel deployment.</p>
        <p className="text-zinc-600">Enter any valid CodeChef username or link to inspect participation streaks.</p>
      </footer>
    </main>
  );
}
