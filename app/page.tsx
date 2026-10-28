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
  Zap,
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
  platform: "codechef" | "leetcode";
  profile: UserProfile;
  stats: UserStats;
  contests: ContestItem[];
  ratingHistory: ContestItem[];
}

export interface SavedProfile {
  username: string;
  platform: "codechef" | "leetcode";
  customName: string;
  rating?: number;
  streak?: number;
  stars?: string;
}

interface MultiMatch {
  username: string;
  codechef?: ApiResponse;
  leetcode?: ApiResponse;
}

export default function Home() {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Multi-platform match state when username exists on both
  const [multiMatch, setMultiMatch] = useState<MultiMatch | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<"codechef" | "leetcode">("codechef");

  // Saved Profiles (Local Storage)
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<{ username: string; platform: "codechef" | "leetcode"; currentName: string } | null>(null);
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

  // Update localStorage helper
  const updateSavedList = (list: SavedProfile[]) => {
    setSavedProfiles(list);
    try {
      localStorage.setItem("cc_saved_profiles", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  };

  // Add or update profile in saved list upon successful fetch
  const handleSaveSuccessfulProfile = (userProfile: UserProfile, stats: UserStats, platform: "codechef" | "leetcode") => {
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
        };
        updated = [updatedItem, ...prev.filter((_, i) => i !== existingIdx)];
      } else {
        const defaultName =
          userProfile.name && userProfile.name !== userProfile.username
            ? userProfile.name
            : userProfile.username;

        const newItem: SavedProfile = {
          username: userProfile.username,
          platform,
          customName: defaultName,
          rating: userProfile.currentRating,
          streak: stats.currentContestStreak,
          stars: userProfile.stars,
        };
        updated = [newItem, ...prev].slice(0, 25);
      }

      try {
        localStorage.setItem("cc_saved_profiles", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
      return updated;
    });
  };

  const fetchDirectPlatform = async (platform: "codechef" | "leetcode", query: string) => {
    setLoading(true);
    setError(null);
    setMultiMatch(null);
    try {
      const endpoint = platform === "leetcode" ? "/api/leetcode" : "/api/codechef";
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to fetch ${platform} data.`);
      }
      setData(json);
      setActivePlatformTab(platform);
      handleSaveSuccessfulProfile(json.profile, json.stats, platform);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoDetect = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    // Check if input is a direct LeetCode URL
    if (trimmed.includes("leetcode.com")) {
      await fetchDirectPlatform("leetcode", trimmed);
      return;
    }

    // Check if input is a direct CodeChef URL
    if (trimmed.includes("codechef.com")) {
      await fetchDirectPlatform("codechef", trimmed);
      return;
    }

    // Input is a username: check BOTH platforms simultaneously
    setLoading(true);
    setError(null);
    setMultiMatch(null);

    try {
      const [ccRes, lcRes] = await Promise.allSettled([
        fetch(`/api/codechef?query=${encodeURIComponent(trimmed)}`).then(async (r) => (r.ok ? r.json() : null)),
        fetch(`/api/leetcode?query=${encodeURIComponent(trimmed)}`).then(async (r) => (r.ok ? r.json() : null)),
      ]);

      const ccData: ApiResponse | null = ccRes.status === "fulfilled" ? ccRes.value : null;
      const lcData: ApiResponse | null = lcRes.status === "fulfilled" ? lcRes.value : null;

      if (ccData && lcData) {
        // Exists on BOTH platforms! Let user choose or toggle
        setMultiMatch({
          username: trimmed,
          codechef: ccData,
          leetcode: lcData,
        });
        // Default to CodeChef first, but tabs are active
        setData(ccData);
        setActivePlatformTab("codechef");
        handleSaveSuccessfulProfile(ccData.profile, ccData.stats, "codechef");
        handleSaveSuccessfulProfile(lcData.profile, lcData.stats, "leetcode");
      } else if (ccData && !lcData) {
        // Exists ONLY on CodeChef
        setData(ccData);
        setActivePlatformTab("codechef");
        handleSaveSuccessfulProfile(ccData.profile, ccData.stats, "codechef");
      } else if (!ccData && lcData) {
        // Exists ONLY on LeetCode
        setData(lcData);
        setActivePlatformTab("leetcode");
        handleSaveSuccessfulProfile(lcData.profile, lcData.stats, "leetcode");
      } else {
        // Exists on NEITHER
        setData(null);
        setError(`User '${trimmed}' not found on CodeChef or LeetCode.`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during lookup.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAutoDetect(inputVal);
  };

  const handleCopySummary = () => {
    if (!data) return;
    const currentSaved = savedProfiles.find(
      (p) => p.username.toLowerCase() === data.profile.username.toLowerCase() && p.platform === data.platform
    );
    const displayName = currentSaved?.customName || data.profile.name;

    const text = `${data.platform === "leetcode" ? "LeetCode" : "CodeChef"} Stats for ${displayName} (@${data.profile.username}):\n` +
      `Contests: ${data.stats.totalContests}\n` +
      `Current Streak: ${data.stats.currentContestStreak}\n` +
      `Max Streak: ${data.stats.maxContestStreak}\n` +
      `Rating: ${data.profile.currentRating} (${data.profile.stars}) | Peak: ${data.profile.maxRating}`;
    navigator.clipboard.writeText(text);
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

  const handleDeleteSaved = (username: string, platform: "codechef" | "leetcode", e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProfiles.filter(
      (p) => !(p.username.toLowerCase() === username.toLowerCase() && p.platform === platform)
    );
    updateSavedList(updated);
  };

  const getRatingBadgeColor = (rating: number, platform: string = "codechef") => {
    if (platform === "leetcode") {
      if (rating >= 2200) return "text-amber-400 bg-amber-950/40 border-amber-500/30"; // Guardian
      if (rating >= 1850) return "text-purple-400 bg-purple-950/40 border-purple-500/30"; // Knight
      return "text-blue-400 bg-blue-950/40 border-blue-500/30";
    }
    // CodeChef
    if (rating >= 2500) return "text-red-400 bg-red-950/40 border-red-500/30";
    if (rating >= 2200) return "text-orange-400 bg-orange-950/40 border-orange-500/30";
    if (rating >= 2000) return "text-yellow-400 bg-yellow-950/40 border-yellow-500/30";
    if (rating >= 1800) return "text-purple-400 bg-purple-950/40 border-purple-500/30";
    if (rating >= 1600) return "text-blue-400 bg-blue-950/40 border-blue-500/30";
    if (rating >= 1400) return "text-green-400 bg-green-950/40 border-green-500/30";
    return "text-zinc-300 bg-zinc-800/60 border-zinc-700/50";
  };

  const currentSavedProfile = data
    ? savedProfiles.find(
        (p) => p.username.toLowerCase() === data.profile.username.toLowerCase() && p.platform === data.platform
      )
    : null;

  return (
    <main className="min-h-screen px-3 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Coder</span>
          <span className="text-amber-400">Streak Tracker</span>
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          CodeChef &amp; LeetCode contest streaks, ratings, and stats
        </p>
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
              placeholder="Enter username or CodeChef / LeetCode URL..."
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
              return (
                <div
                  key={`${p.platform}_${p.username}`}
                  onClick={() => {
                    setInputVal(p.username);
                    fetchDirectPlatform(p.platform, p.username);
                  }}
                  className={`group shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <span className={`text-[10px] font-bold px-1 rounded ${
                    p.platform === "leetcode" ? "bg-amber-500/20 text-amber-400" : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {p.platform === "leetcode" ? "LC" : "CC"}
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
                      setEditingProfile({ username: p.username, platform: p.platform, currentName: p.customName });
                      setRenameValue(p.customName);
                    }}
                    title="Rename / Set Custom Name"
                    className="opacity-50 hover:opacity-100 text-zinc-400 hover:text-amber-400 p-0.5 rounded transition-opacity"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSaved(p.username, p.platform, e)}
                    title="Remove from saved"
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

      {/* Multi-Match Platform Selector */}
      {multiMatch && (
        <div className="max-w-xl mx-auto my-4 p-3 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-300 text-center sm:text-left">
            <span>Found </span>
            <strong className="text-amber-400">@{multiMatch.username}</strong>
            <span> on both platforms. Choose one to view:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActivePlatformTab("codechef");
                setData(multiMatch.codechef || null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePlatformTab === "codechef"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-bold shadow-md"
                  : "bg-zinc-800 text-zinc-300 hover:text-white"
              }`}
            >
              <span>🧑‍🍳 CodeChef</span>
            </button>
            <button
              onClick={() => {
                setActivePlatformTab("leetcode");
                setData(multiMatch.leetcode || null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePlatformTab === "leetcode"
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold shadow-md"
                  : "bg-zinc-800 text-zinc-300 hover:text-white"
              }`}
            >
              <span>⚡ LeetCode</span>
            </button>
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
                <h3 className="text-sm font-semibold text-white">Custom Name</h3>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Set a friendly nickname for <strong className="text-amber-400">@{editingProfile.username}</strong> ({editingProfile.platform === "leetcode" ? "LeetCode" : "CodeChef"}):
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

      {/* Main Results Display */}
      {!loading && data && (
        <div className="space-y-4 sm:space-y-6 mt-6">
          {/* User Profile Card */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border ${
                  data.platform === "leetcode"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                }`}>
                  {(currentSavedProfile?.customName || data.profile.name).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {currentSavedProfile?.customName || data.profile.name}
                    </h2>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                      data.platform === "leetcode"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/30"
                    }`}>
                      {data.platform === "leetcode" ? "LeetCode" : "CodeChef"}
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
                    {data.profile.problemsSolved > 0 && (
                      <span className="text-zinc-500">
                        • {data.profile.problemsSolved} solved
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
                  <span>{data.platform === "leetcode" ? "LeetCode" : "CodeChef"}</span>
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
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRatingBadgeColor(data.profile.currentRating, data.platform)}`}>
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
                {data.profile.countryRank ? `Country: #${data.profile.countryRank}` : `${data.profile.problemsSolved} Solved`}
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
        Coder Streak Tracker • CodeChef &amp; LeetCode
      </footer>
    </main>
  );
}
