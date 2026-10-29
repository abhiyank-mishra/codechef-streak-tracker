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
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Edit2,
  X,
  Tag,
  BarChart3,
  Code2,
  CheckCircle,
  BookOpen,
  GitBranch,
} from "lucide-react";

export type PlatformType =
  | "codechef"
  | "leetcode"
  | "codeforces"
  | "gfg"
  | "atcoder"
  | "github";

interface ContestItem {
  code: string;
  name: string;
  date: string;
  rating: number;
  rank: number;
  color: string;
  delta: number;
}

interface SolvedBreakdown {
  easy: number;
  easyTotal: number;
  medium: number;
  mediumTotal: number;
  hard: number;
  hardTotal: number;
  total: number;
  allTotal: number;
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
  avatar?: string | null;
  solvedBreakdown?: SolvedBreakdown;
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
  platform: PlatformType;
  profile: UserProfile;
  stats: UserStats;
  contests: ContestItem[];
  ratingHistory: ContestItem[];
}

export interface SavedProfile {
  username: string;
  platform: PlatformType;
  customName: string;
  rating?: number;
  streak?: number;
  stars?: string;
  problemsSolved?: number;
}

const PLATFORM_CONFIG: Record<
  PlatformType,
  {
    name: string;
    shortLabel: string;
    color: string;
    accentBg: string;
    accentText: string;
    border: string;
  }
> = {
  codechef: {
    name: "CodeChef",
    shortLabel: "CC",
    color: "#ea580c",
    accentBg: "bg-orange-500/10",
    accentText: "text-orange-400",
    border: "border-orange-500/30",
  },
  leetcode: {
    name: "LeetCode",
    shortLabel: "LC",
    color: "#f59e0b",
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-400",
    border: "border-amber-500/30",
  },
  codeforces: {
    name: "Codeforces",
    shortLabel: "CF",
    color: "#ef4444",
    accentBg: "bg-red-500/10",
    accentText: "text-red-400",
    border: "border-red-500/30",
  },
  gfg: {
    name: "GeeksforGeeks",
    shortLabel: "GFG",
    color: "#10b981",
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  atcoder: {
    name: "AtCoder",
    shortLabel: "AC",
    color: "#06b6d4",
    accentBg: "bg-cyan-500/10",
    accentText: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  github: {
    name: "GitHub",
    shortLabel: "GH",
    color: "#a855f7",
    accentBg: "bg-purple-500/10",
    accentText: "text-purple-400",
    border: "border-purple-500/30",
  },
};

const PLATFORMS_FILTER: Array<{
  id: "all" | PlatformType;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
  { id: "codeforces", label: "Codeforces" },
  { id: "gfg", label: "GFG" },
  { id: "atcoder", label: "AtCoder" },
  { id: "github", label: "GitHub" },
];

function detectPlatformFromUrl(input: string): PlatformType | null {
  const lower = input.toLowerCase();
  if (lower.includes("codechef.com")) return "codechef";
  if (lower.includes("leetcode.com")) return "leetcode";
  if (lower.includes("codeforces.com")) return "codeforces";
  if (lower.includes("geeksforgeeks.org")) return "gfg";
  if (lower.includes("atcoder.jp")) return "atcoder";
  if (lower.includes("github.com")) return "github";
  return null;
}

export default function Home() {
  const [inputVal, setInputVal] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | PlatformType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active single view data
  const [data, setData] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Discovered multi-platform matches for a handle
  const [multiMatches, setMultiMatches] = useState<ApiResponse[]>([]);
  const [activeView, setActiveView] = useState<PlatformType | "compare">("compare");

  // Saved Profiles (Local Storage)
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<{
    username: string;
    platform: PlatformType;
    currentName: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cc_saved_profiles");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedProfiles(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load saved profiles from localStorage:", e);
    }
  }, []);

  const updateSavedList = (list: SavedProfile[]) => {
    setSavedProfiles(list);
    try {
      localStorage.setItem("cc_saved_profiles", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  };

  const handleSaveSuccessfulProfile = (
    userProfile: UserProfile,
    stats: UserStats,
    platform: PlatformType
  ) => {
    setSavedProfiles((prev) => {
      const uname = userProfile.username.toLowerCase();
      const existingIdx = prev.findIndex(
        (p) => p.username.toLowerCase() === uname && p.platform === platform
      );

      let updated: SavedProfile[];
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const updatedItem: SavedProfile = {
          ...existing,
          rating: userProfile.currentRating,
          streak: stats.currentContestStreak,
          stars: userProfile.stars,
          problemsSolved: userProfile.problemsSolved,
        };
        updated = [...prev];
        updated[existingIdx] = updatedItem;
      } else {
        const newItem: SavedProfile = {
          username: userProfile.username,
          platform,
          customName: userProfile.name || userProfile.username,
          rating: userProfile.currentRating,
          streak: stats.currentContestStreak,
          stars: userProfile.stars,
          problemsSolved: userProfile.problemsSolved,
        };
        updated = [newItem, ...prev.slice(0, 19)];
      }

      try {
        localStorage.setItem("cc_saved_profiles", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to write to localStorage:", e);
      }
      return updated;
    });
  };

  // Fetch a specific platform directly
  const fetchSinglePlatform = async (platform: PlatformType, handle: string): Promise<ApiResponse | null> => {
    try {
      const res = await fetch(`/api/${platform}?username=${encodeURIComponent(handle)}`);
      if (!res.ok) return null;
      const json: ApiResponse = await res.json();
      return json;
    } catch {
      return null;
    }
  };

  const handleSearch = async (query: string, targetPlatform: "all" | PlatformType = selectedFilter) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please enter a username or profile URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setMultiMatches([]);

    // Check if input is a direct profile URL
    const detectedPlatform = detectPlatformFromUrl(trimmed);
    const effectivePlatform = detectedPlatform || (targetPlatform !== "all" ? targetPlatform : null);

    if (effectivePlatform) {
      try {
        const result = await fetchSinglePlatform(effectivePlatform, trimmed);
        if (!result) {
          setError(`No profile found on ${PLATFORM_CONFIG[effectivePlatform].name} for '${trimmed}'.`);
          setLoading(false);
          return;
        }
        setData(result);
        setActiveView(effectivePlatform);
        setMultiMatches([result]);
        handleSaveSuccessfulProfile(result.profile, result.stats, effectivePlatform);
      } catch (err: any) {
        setError(err.message || "Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Query multiple platforms in parallel
    const platformsToQuery: PlatformType[] = ["codechef", "leetcode", "codeforces", "gfg", "atcoder"];
    try {
      const results = await Promise.allSettled(
        platformsToQuery.map((p) => fetchSinglePlatform(p, trimmed))
      );

      const successfulMatches: ApiResponse[] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          successfulMatches.push(r.value);
          handleSaveSuccessfulProfile(r.value.profile, r.value.stats, r.value.platform);
        }
      });

      if (successfulMatches.length === 0) {
        setError(`No coder profile found for '@${trimmed}' across active platforms.`);
      } else if (successfulMatches.length === 1) {
        setData(successfulMatches[0]);
        setActiveView(successfulMatches[0].platform);
        setMultiMatches(successfulMatches);
      } else {
        // Found on multiple platforms!
        setMultiMatches(successfulMatches);
        setActiveView("compare");
        setData(successfulMatches[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to search profiles.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputVal);
  };

  const handleCopySummary = () => {
    if (!data) return;
    const summary = `${data.profile.name} (@${data.profile.username}) on ${PLATFORM_CONFIG[data.platform].name}
Rating: ${data.profile.currentRating} (${data.profile.stars})
Problems Solved: ${data.profile.problemsSolved}
Total Contests: ${data.stats.totalContests}
Contest Streak: ${data.stats.currentContestStreak} contests
Profile: ${data.profile.profileUrl}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !renameValue.trim()) return;

    const updated = savedProfiles.map((p) => {
      if (
        p.username.toLowerCase() === editingProfile.username.toLowerCase() &&
        p.platform === editingProfile.platform
      ) {
        return { ...p, customName: renameValue.trim() };
      }
      return p;
    });

    updateSavedList(updated);
    setEditingProfile(null);
    setRenameValue("");
  };

  const handleDeleteSaved = (username: string, platform: PlatformType, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProfiles.filter(
      (p) => !(p.username.toLowerCase() === username.toLowerCase() && p.platform === platform)
    );
    updateSavedList(updated);
  };

  const currentSavedProfile = data
    ? savedProfiles.find(
        (p) => p.username.toLowerCase() === data.profile.username.toLowerCase() && p.platform === data.platform
      )
    : null;

  return (
    <main className="min-h-screen px-3 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto overflow-x-hidden text-zinc-100">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Coder</span>
          <span className="text-amber-400">Streak Tracker</span>
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Unified tracking &amp; contest intelligence across CodeChef, LeetCode, Codeforces, GFG, &amp; more
        </p>
      </div>

      {/* Platform Filter Pills */}
      <div className="max-w-xl mx-auto mb-3 flex items-center justify-center gap-1.5 flex-wrap">
        {PLATFORMS_FILTER.map((tab) => {
          const isSelected = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? "bg-amber-500 text-zinc-950 font-semibold shadow-sm"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto mb-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 sm:relative">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                selectedFilter === "all"
                  ? "Enter username or profile URL from any platform..."
                  : `Enter ${PLATFORMS_FILTER.find((t) => t.id === selectedFilter)?.label} username or URL...`
              }
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

        {/* Quick Access / Saved Profiles Chips */}
        {savedProfiles.length > 0 && (
          <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold shrink-0">
              Saved:
            </span>
            {savedProfiles.map((p) => {
              const isSelected =
                data?.profile?.username.toLowerCase() === p.username.toLowerCase() &&
                data?.platform === p.platform;
              const cfg = PLATFORM_CONFIG[p.platform] || PLATFORM_CONFIG.codechef;
              return (
                <div
                  key={`${p.platform}_${p.username}`}
                  onClick={() => {
                    setInputVal(p.username);
                    setSelectedFilter(p.platform);
                    handleSearch(p.username, p.platform);
                  }}
                  className={`group shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <span className={`text-[10px] font-bold px-1 rounded ${cfg.accentBg} ${cfg.accentText}`}>
                    {cfg.shortLabel}
                  </span>
                  <span className="font-medium text-xs text-white">{p.customName}</span>
                  {p.customName.toLowerCase() !== p.username.toLowerCase() && (
                    <span className="text-[10px] text-zinc-500">(@{p.username})</span>
                  )}
                  {p.streak !== undefined && p.streak > 0 && (
                    <span className="text-[10px] text-amber-400 font-bold">🔥{p.streak}</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProfile({
                        username: p.username,
                        platform: p.platform,
                        currentName: p.customName,
                      });
                      setRenameValue(p.customName);
                    }}
                    title="Rename"
                    className="opacity-50 hover:opacity-100 text-zinc-400 hover:text-amber-400 p-0.5 rounded transition-opacity"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSaved(p.username, p.platform, e)}
                    title="Remove"
                    className="opacity-50 hover:opacity-100 text-zinc-400 hover:text-red-400 p-0.5 rounded transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Match Platform View Switcher */}
      {multiMatches.length > 1 && (
        <div className="max-w-xl mx-auto my-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            <span>Found on </span>
            <strong className="text-white">{multiMatches.length} platforms</strong>
            <span>:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex-wrap justify-center">
            <button
              onClick={() => setActiveView("compare")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                activeView === "compare"
                  ? "bg-amber-500 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Compare All</span>
            </button>
            {multiMatches.map((m) => {
              const cfg = PLATFORM_CONFIG[m.platform];
              const isSelected = activeView === m.platform;
              return (
                <button
                  key={m.platform}
                  onClick={() => {
                    setActiveView(m.platform);
                    setData(m);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  ></span>
                  <span>{cfg.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rename Dialog Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Custom Nickname</h3>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Set a friendly nickname for <strong className="text-amber-400">@{editingProfile.username}</strong> ({PLATFORM_CONFIG[editingProfile.platform]?.name}):
            </p>
            <form onSubmit={handleSaveRename} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="e.g. Ashutosh, Rohan, Friend..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs transition-colors"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-xl mx-auto my-6 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 flex items-center gap-2.5 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse mt-6">
          <div className="h-24 rounded-2xl bg-zinc-900 border border-zinc-800"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-900 border border-zinc-800"></div>
            ))}
          </div>
          <div className="h-52 rounded-2xl bg-zinc-900 border border-zinc-800"></div>
        </div>
      )}

      {/* MULTI-PLATFORM COMPARISON VIEW */}
      {!loading && multiMatches.length > 1 && activeView === "compare" && (
        <div className="space-y-6 mt-6">
          {/* Header Card */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span>Platform Comparison</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cross-platform analysis across {multiMatches.length} coding profiles
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                {multiMatches.map((m) => {
                  const cfg = PLATFORM_CONFIG[m.platform];
                  return (
                    <span key={m.platform} className="flex items-center gap-1.5 font-medium" style={{ color: cfg.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }}></span>
                      {cfg.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
              {multiMatches.map((m) => {
                const cfg = PLATFORM_CONFIG[m.platform];
                return (
                  <div
                    key={m.platform}
                    onClick={() => {
                      setData(m);
                      setActiveView(m.platform);
                    }}
                    className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.accentBg} ${cfg.accentText} ${cfg.border}`}>
                        {cfg.name}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">{m.profile.name}</h3>
                    <p className="text-xs text-zinc-500 mb-3">@{m.profile.username}</p>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Rating / Score</span>
                        <span className="font-bold text-white">{m.profile.currentRating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Problems Solved</span>
                        <span className="font-semibold text-zinc-300">{m.profile.problemsSolved}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Contests Attended</span>
                        <span className="font-semibold text-zinc-300">{m.stats.totalContests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Contest Streak</span>
                        <span className="font-bold text-amber-400">🔥 {m.stats.currentContestStreak}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Visual Bars */}
            <div className="space-y-5 pt-6 border-t border-zinc-800 mt-6">
              {/* Metric 1: Problems Solved */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Problems Solved</span>
                  <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                    {multiMatches.map((m) => (
                      <span key={m.platform} style={{ color: PLATFORM_CONFIG[m.platform].color }}>
                        {PLATFORM_CONFIG[m.platform].shortLabel}: {m.profile.problemsSolved}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                  {(() => {
                    const totalSolved = multiMatches.reduce((acc, m) => acc + m.profile.problemsSolved, 0) || 1;
                    return multiMatches.map((m) => {
                      const pct = Math.round((m.profile.problemsSolved / totalSolved) * 100);
                      return (
                        <div
                          key={m.platform}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PLATFORM_CONFIG[m.platform].color,
                          }}
                          className="h-full transition-all"
                          title={`${PLATFORM_CONFIG[m.platform].name}: ${m.profile.problemsSolved}`}
                        ></div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Metric 2: Contests Participated */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Contests Attended</span>
                  <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                    {multiMatches.map((m) => (
                      <span key={m.platform} style={{ color: PLATFORM_CONFIG[m.platform].color }}>
                        {PLATFORM_CONFIG[m.platform].shortLabel}: {m.stats.totalContests}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                  {(() => {
                    const totalContests = multiMatches.reduce((acc, m) => acc + m.stats.totalContests, 0) || 1;
                    return multiMatches.map((m) => {
                      const pct = Math.round((m.stats.totalContests / totalContests) * 100);
                      return (
                        <div
                          key={m.platform}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PLATFORM_CONFIG[m.platform].color,
                          }}
                          className="h-full transition-all"
                          title={`${PLATFORM_CONFIG[m.platform].name}: ${m.stats.totalContests}`}
                        ></div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Metric 3: Current Rating */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Rating / Score</span>
                  <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                    {multiMatches.map((m) => (
                      <span key={m.platform} style={{ color: PLATFORM_CONFIG[m.platform].color }}>
                        {PLATFORM_CONFIG[m.platform].shortLabel}: {m.profile.currentRating}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                  {(() => {
                    const totalRating = multiMatches.reduce((acc, m) => acc + m.profile.currentRating, 0) || 1;
                    return multiMatches.map((m) => {
                      const pct = Math.round((m.profile.currentRating / totalRating) * 100);
                      return (
                        <div
                          key={m.platform}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PLATFORM_CONFIG[m.platform].color,
                          }}
                          className="h-full transition-all"
                          title={`${PLATFORM_CONFIG[m.platform].name}: ${m.profile.currentRating}`}
                        ></div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PLATFORM DETAILS VIEW */}
      {!loading && data && activeView !== "compare" && (
        <div className="space-y-4 sm:space-y-6 mt-6">
          {/* User Profile Card */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {data.profile.avatar ? (
                  <img
                    src={data.profile.avatar}
                    alt={data.profile.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-700"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border ${
                      PLATFORM_CONFIG[data.platform]?.accentBg
                    } ${PLATFORM_CONFIG[data.platform]?.accentText} ${PLATFORM_CONFIG[data.platform]?.border}`}
                  >
                    {(currentSavedProfile?.customName || data.profile.name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {currentSavedProfile?.customName || data.profile.name}
                    </h2>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        PLATFORM_CONFIG[data.platform]?.accentBg
                      } ${PLATFORM_CONFIG[data.platform]?.accentText} ${PLATFORM_CONFIG[data.platform]?.border}`}
                    >
                      {PLATFORM_CONFIG[data.platform]?.name}
                    </span>
                    <button
                      onClick={() => {
                        setEditingProfile({
                          username: data.profile.username,
                          platform: data.platform,
                          currentName: currentSavedProfile?.customName || data.profile.name,
                        });
                        setRenameValue(currentSavedProfile?.customName || data.profile.name);
                      }}
                      title="Set custom nickname"
                      className="text-zinc-500 hover:text-amber-400 p-1 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={data.profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
                      title="View on platform"
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
                    {data.profile.institution && (
                      <span className="text-zinc-500">• {data.profile.institution}</span>
                    )}
                    {data.profile.problemsSolved > 0 && (
                      <span className="text-zinc-500">• {data.profile.problemsSolved} solved</span>
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
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Rating */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Rating / Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {data.profile.currentRating}
                </span>
                {data.profile.maxRating > data.profile.currentRating && (
                  <span className="text-[10px] text-zinc-500">Peak: {data.profile.maxRating}</span>
                )}
              </div>
              <span className="text-[10px] text-amber-400/90 font-medium truncate block">
                {data.profile.stars}
              </span>
            </div>

            {/* 2. Problems Solved */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Problems Solved</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {data.profile.problemsSolved}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate block">
                {data.profile.countryRank || data.profile.userType || "Active Coder"}
              </span>
            </div>

            {/* 3. Contest Streak */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Contest Streak</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-amber-400 flex items-center gap-1">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                  {data.stats.currentContestStreak}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Max: {data.stats.maxContestStreak} contests
              </span>
            </div>

            {/* 4. Total Contests */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Contests Given</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {data.stats.totalContests}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                {data.stats.lastContest ? `Last: ${data.stats.lastContest.date}` : "Lifetime"}
              </span>
            </div>
          </div>

          {/* LEETCODE PROBLEM-SOLVING BREAKDOWN CARD */}
          {data.platform === "leetcode" && data.profile.solvedBreakdown && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>LeetCode Problem Solving</span>
                </h3>
                <span className="text-xs text-zinc-400 font-medium">
                  {data.profile.solvedBreakdown.total} / {data.profile.solvedBreakdown.allTotal} Solved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Easy */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-semibold">Easy</span>
                    <span className="text-zinc-400">
                      {data.profile.solvedBreakdown.easy} / {data.profile.solvedBreakdown.easyTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((data.profile.solvedBreakdown.easy / (data.profile.solvedBreakdown.easyTotal || 1)) * 100)
                        )}%`,
                      }}
                      className="bg-emerald-500 h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>

                {/* Medium */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-amber-400 font-semibold">Medium</span>
                    <span className="text-zinc-400">
                      {data.profile.solvedBreakdown.medium} / {data.profile.solvedBreakdown.mediumTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((data.profile.solvedBreakdown.medium / (data.profile.solvedBreakdown.mediumTotal || 1)) * 100)
                        )}%`,
                      }}
                      className="bg-amber-400 h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>

                {/* Hard */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-red-400 font-semibold">Hard</span>
                    <span className="text-zinc-400">
                      {data.profile.solvedBreakdown.hard} / {data.profile.solvedBreakdown.hardTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((data.profile.solvedBreakdown.hard / (data.profile.solvedBreakdown.hardTotal || 1)) * 100)
                        )}%`,
                      }}
                      className="bg-red-500 h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SVG RATING TRAJECTORY GRAPH (For platforms with rating history) */}
          {data.ratingHistory.length > 1 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Rating Trajectory</span>
                </h3>
                <span className="text-[11px] text-zinc-500">
                  {data.ratingHistory.length} Rated Contests
                </span>
              </div>

              <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-[500px]">
                  {(() => {
                    const list = data.ratingHistory.slice(-20);
                    const ratings = list.map((c) => c.rating);
                    const minR = Math.min(...ratings) - 50;
                    const maxR = Math.max(...ratings) + 50;
                    const range = Math.max(maxR - minR, 100);

                    const width = 640;
                    const height = 140;
                    const paddingX = 40;
                    const paddingY = 20;

                    const points = list.map((c, i) => {
                      const x = paddingX + (i / Math.max(list.length - 1, 1)) * (width - 2 * paddingX);
                      const y = height - paddingY - ((c.rating - minR) / range) * (height - 2 * paddingY);
                      return { x, y, c };
                    });

                    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

                    return (
                      <svg viewBox={`0 0 ${width} ${height + 25}`} className="w-full h-36">
                        <line
                          x1={paddingX}
                          y1={height - paddingY}
                          x2={width - paddingX}
                          y2={height - paddingY}
                          stroke="#27272a"
                          strokeDasharray="4 4"
                        />
                        <polyline
                          fill="none"
                          stroke={PLATFORM_CONFIG[data.platform]?.color || "#fbbf24"}
                          strokeWidth="2.5"
                          points={polylinePoints}
                        />
                        {points.map((p, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="4"
                              fill="#09090b"
                              stroke={PLATFORM_CONFIG[data.platform]?.color || "#fbbf24"}
                              strokeWidth="2"
                            />
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
          {data.contests.length > 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Contest History</span>
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
                      {data.contests.slice(0, 30).map((c, i) => (
                        <tr key={c.code + i} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="max-w-[220px] truncate" title={c.name}>
                                {c.name}
                              </span>
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
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-[11px] text-zinc-600">
        Coder Streak Tracker • CodeChef • LeetCode • Codeforces • GFG • AtCoder
      </footer>
    </main>
  );
}
