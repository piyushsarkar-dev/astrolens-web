"use client";

import {
  Camera,
  Clock,
  Folder,
  HardDrive,
  Heart,
  Images,
  KeyRound,
  Lock,
  MoonStar,
  Plus,
  Power,
  Settings,
  ShieldCheck,
  Sun,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserAvatar from "@/components/Auth/UserAvatar";
import { useBackup } from "@/components/Backup";
import { useTheme } from "@/components/Providers/ThemeProvider";

export type AstroViewMode =
  | { type: "all" }
  | { type: "favorites" }
  | { type: "recents" }
  | { type: "hidden" }
  | { type: "album"; name: string };

type AstroSidebarProps = {
  activeView: AstroViewMode;
  onSelectView: (view: AstroViewMode) => void;
  totalPhotosCount: number;
  favoritesCount: number;
  /** Real bytes currently stored in the vault (sum of the user's photos). */
  usedBytes: number;
  /** Vault quota in bytes. */
  quotaBytes: number;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  albums: Array<{ name: string; count: number }>;
  onCreateAlbum: (name: string) => void;
};

export const AstroSidebar = ({
  activeView,
  onSelectView,
  totalPhotosCount,
  favoritesCount,
  usedBytes,
  quotaBytes,
  selectedTag,
  onSelectTag,
  albums,
  onCreateAlbum,
}: AstroSidebarProps) => {
  const { user, profile, avatarUrl, avatarConfig, signOut } = useAuth();
  const { openUploadPicker, isBackingUp } = useBackup();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");

  // Shortcut for ⌘U / Ctrl+U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        openUploadPicker();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openUploadPicker]);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    profile?.display_name ||
    user?.email?.split("@")[0] ||
    "Piyush";

  // Real vault usage, derived from the caller's photo sizes.
  const GIB = 1024 * 1024 * 1024;
  const safeQuota = quotaBytes > 0 ? quotaBytes : 100 * GIB;
  const usedGb = usedBytes / GIB;
  const quotaGb = safeQuota / GIB;
  const usedPercent = Math.max(0, Math.min(100, (usedBytes / safeQuota) * 100));

  const handleCreateAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    onCreateAlbum(newAlbumName.trim());
    setNewAlbumName("");
    setIsCreatingAlbum(false);
    onSelectView({ type: "album", name: newAlbumName.trim() });
  };

  const quickFilters = ["#RAW", "#B&W", "#LongExposure", "#Cyber"];

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-72 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[#0c0d10] select-none">
      {/* Top Scrollable Content */}
      <div className="flex-1 scrollbar-thin scrollbar-thumb-white/10 space-y-6 overflow-x-hidden overflow-y-auto p-4">
        {/* Header Branding */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/"
            className="group flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-950/40 transition group-hover:border-emerald-500/40">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[15px] font-bold tracking-wide text-white">
                  Astro Lens
                </span>
                <span className="size-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-white/40">
                <ShieldCheck
                  size={11}
                  className="text-emerald-400/80"
                />
                Private photo vault
              </p>
            </div>
          </Link>
          <div className="grid size-8 place-items-center rounded-lg text-white/30 transition hover:text-white/60">
            <Lock size={15} />
          </div>
        </div>

        {/* Upload Photos Gradient Button */}
        <button
          type="button"
          onClick={openUploadPicker}
          disabled={isBackingUp}
          className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-rose-500/20 bg-gradient-to-r from-[#ff2a6d] via-[#f00075] to-[#d80064] px-3.5 py-2.5 font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50">
          <div className="flex items-center gap-2">
            <Upload size={16} />
            <span className="text-sm tracking-wide">Upload Photos</span>
          </div>
          <kbd className="rounded-md border border-white/15 bg-black/25 px-2 py-0.5 font-mono text-[10px] font-medium text-white/90">
            ⌘U
          </kbd>
        </button>

        {/* LIBRARY Section */}
        <div className="space-y-1">
          <p className="mb-2 px-2 text-[10px] font-bold tracking-widest text-white/35 uppercase">
            Library
          </p>

          {/* Photos */}
          <button
            type="button"
            onClick={() => {
              onSelectView({ type: "all" });
              onSelectTag(null);
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
              activeView.type === "all" && !selectedTag ?
                "border border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-400"
              : "text-white/60 hover:bg-white/[0.04] hover:text-white"
            }`}>
            <div className="flex items-center gap-2.5">
              <Images size={16} />
              <span>Photos</span>
            </div>
            <div className="flex items-center gap-2">
              {activeView.type === "all" && !selectedTag && (
                <span className="size-1.5 rounded-full bg-emerald-400" />
              )}
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                {totalPhotosCount.toLocaleString()}
              </span>
            </div>
          </button>

          {/* Favorites */}
          <button
            type="button"
            onClick={() => {
              onSelectView({ type: "favorites" });
              onSelectTag(null);
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
              activeView.type === "favorites" ?
                "border border-rose-500/30 bg-rose-500/15 font-semibold text-rose-400"
              : "text-white/60 hover:bg-white/[0.04] hover:text-white"
            }`}>
            <div className="flex items-center gap-2.5">
              <Heart
                size={16}
                className={
                  activeView.type === "favorites" ?
                    "fill-rose-400"
                  : "text-rose-400/80"
                }
              />
              <span>Favorites</span>
            </div>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300">
              {favoritesCount}
            </span>
          </button>

          {/* Recents */}
          <button
            type="button"
            onClick={() => {
              onSelectView({ type: "recents" });
              onSelectTag(null);
            }}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              activeView.type === "recents" ?
                "border border-white/15 bg-white/[0.08] font-semibold text-white"
              : "text-white/60 hover:bg-white/[0.04] hover:text-white"
            }`}>
            <Clock size={16} />
            <span>Recents</span>
          </button>

          {/* Hidden Vault */}
          <button
            type="button"
            onClick={() => {
              onSelectView({ type: "hidden" });
              onSelectTag(null);
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
              activeView.type === "hidden" ?
                "border border-white/15 bg-white/[0.08] font-semibold text-white"
              : "text-white/60 hover:bg-white/[0.04] hover:text-white"
            }`}>
            <div className="flex items-center gap-2.5">
              <Lock size={16} />
              <span>Hidden Vault</span>
            </div>
            <KeyRound
              size={13}
              className="text-white/30"
            />
          </button>
        </div>

        {/* ALBUMS Section */}
        <div className="space-y-1">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold tracking-widest text-white/35 uppercase">
              Albums
            </p>
            <button
              type="button"
              onClick={() => setIsCreatingAlbum((v) => !v)}
              className="grid size-5 cursor-pointer place-items-center rounded text-white/40 transition hover:bg-white/10 hover:text-white"
              title="New album">
              <Plus size={14} />
            </button>
          </div>

          {isCreatingAlbum && (
            <form
              onSubmit={handleCreateAlbumSubmit}
              className="mb-2 px-2">
              <input
                type="text"
                autoFocus
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Album name…"
                className="w-full rounded-lg border border-white/15 bg-[#14161b] px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
              />
            </form>
          )}

          {albums.map((album) => {
            const isSelected =
              activeView.type === "album" && activeView.name === album.name;
            return (
              <button
                key={album.name}
                type="button"
                onClick={() => {
                  onSelectView({ type: "album", name: album.name });
                  onSelectTag(null);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isSelected ?
                    "border border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-400"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}>
                <div className="mr-2 flex items-center gap-2.5 truncate">
                  <Folder
                    size={16}
                    className={
                      isSelected ? "text-emerald-400" : "text-white/40"
                    }
                  />
                  <span className="truncate">{album.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-white/40">
                  {album.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* QUICK FILTERS Section */}
        <div>
          <p className="mb-2.5 px-2 text-[10px] font-bold tracking-widest text-white/35 uppercase">
            Quick Filters
          </p>
          <div className="flex flex-wrap gap-1.5 px-2">
            {quickFilters.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(active ? null : tag)}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-xs font-medium transition ${
                    active ?
                      "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border-white/[0.06] bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white"
                  }`}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Profile & Storage Card */}
      <div className="border-t border-white/[0.06] bg-[#090a0d] p-3">
        {/* Storage Bar Card — real vault usage */}
        <div className="mb-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-white/70">
              <HardDrive
                size={13}
                className="text-emerald-400"
              />
              <span>Encrypted Vault</span>
            </div>
            <span className="font-mono text-[11px] text-white/40">
              {usedGb.toFixed(1)} / {quotaGb.toFixed(0)} GB
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>

        {/* User Account Row */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/profile"
            className="group flex min-w-0 items-center gap-2.5">
            <div className="relative">
              {avatarUrl ?
                <UserAvatar
                  seed={user?.id || "P"}
                  avatarUrl={avatarUrl}
                  avatarConfig={avatarConfig}
                  size={34}
                  className="rounded-xl border border-white/10"
                />
              : <div className="grid size-[34px] place-items-center rounded-xl border border-white/15 bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              }
              <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-[#090a0d] bg-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white transition group-hover:text-emerald-300">
                {user ? displayName : "Guest"}
              </p>
              <p className="truncate text-[10px] text-white/40">
                {user ? "Master Vault" : "Not signed in"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 text-white/40">
            {/* Theme toggle is kept in the vault chrome because the global
                header is hidden on the gallery route. */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid size-7 cursor-pointer place-items-center rounded-lg transition hover:bg-white/10 hover:text-white"
              title={
                theme === "dark" ?
                  "Switch to light theme"
                : "Switch to dark theme"
              }
              aria-label="Toggle theme">
              <Sun
                size={15}
                className="hidden dark:block"
              />
              <MoonStar
                size={15}
                className="block dark:hidden"
              />
            </button>
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="grid size-7 cursor-pointer place-items-center rounded-lg transition hover:bg-white/10 hover:text-white"
              title="Settings">
              <Settings size={15} />
            </button>
            {user ?
              <button
                type="button"
                onClick={() => signOut()}
                className="grid size-7 cursor-pointer place-items-center rounded-lg transition hover:bg-rose-500/10 hover:text-rose-400"
                title="Sign out">
                <Power size={14} />
              </button>
            : <Link
                href="/login"
                className="bg-sky/90 hover:bg-sky rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white transition"
                title="Log in to your vault">
                Log in
              </Link>
            }
          </div>
        </div>
      </div>
    </aside>
  );
};
