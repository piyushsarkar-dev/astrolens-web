"use client";

import {
  Check,
  Clock,
  Folder,
  HardDrive,
  Heart,
  Images,
  KeyRound,
  Lock,
  MoonStar,
  PanelLeftClose,
  Plus,
  Power,
  Settings,
  Sun,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserAvatar from "@/components/Auth/UserAvatar";
import { useBackup } from "@/components/Backup";
import { useSidebarToggle } from "@/components/Providers/SidebarProvider";
import { useTheme } from "@/components/Providers/ThemeProvider";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card } from "@/components/shadcnui/card";
import { Input } from "@/components/shadcnui/input";
import { Separator } from "@/components/shadcnui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcnui/tooltip";
import { cn } from "@/lib/utils";

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
  /** `#tag` chips derived from the tags genuinely attached to the vault's photos. */
  quickFilters: string[];
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
  quickFilters,
  onCreateAlbum,
}: AstroSidebarProps) => {
  const { user, profile, avatarUrl, avatarConfig, signOut } = useAuth();
  const { openUploadPicker, isBackingUp } = useBackup();
  const { theme, setTheme } = useTheme();
  const { isOpen, toggleSidebar, setIsOpen } = useSidebarToggle();
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

  return (
    <>
      {/* Mobile Backdrop Overlay when sidebar is open on small screens */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          aria-label="Close sidebar backdrop"
        />
      )}

      <TooltipProvider delay={200}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 pt-16 lg:static lg:z-30 flex h-full shrink-0 flex-col justify-between border-r border-border bg-sidebar text-sidebar-foreground select-none transition-[width,transform,opacity] duration-300 ease-in-out",
            isOpen ?
              "w-72 translate-x-0 opacity-100"
            : "w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-r-0 opacity-0 pointer-events-none",
          )}>
          {/* Top Scrollable Content */}
          <div className="flex-1 scrollbar-thin scrollbar-thumb-white/10 space-y-6 overflow-x-hidden overflow-y-auto p-4 w-72">
            {/* Header row with collapse button */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <span className="text-xs font-semibold tracking-wide text-foreground/80">
                Navigation
              </span>
              <button
                type="button"
                onClick={toggleSidebar}
                className="grid size-7 cursor-pointer place-items-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Collapse sidebar (Ctrl+B)">
                <PanelLeftClose size={14} />
              </button>
            </div>

            {/* Upload Photos Gradient Button */}
            <button
              type="button"
              onClick={openUploadPicker}
              disabled={isBackingUp}
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-3.5 py-2.5 font-semibold text-white shadow-lg shadow-sky-950/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
            <div className="flex items-center gap-2">
              <Upload size={16} />
              <span className="text-sm tracking-wide">Upload Photos</span>
            </div>
            <kbd className="rounded-md border border-white/20 bg-black/25 px-2 py-0.5 font-mono text-[10px] font-medium text-white/90">
              ⌘U
            </kbd>
          </button>

          {/* LIBRARY Section */}
          <div className="space-y-1">
            <p className="mb-2 px-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Library
            </p>

            {/* Photos */}
            <button
              type="button"
              onClick={() => {
                onSelectView({ type: "all" });
                onSelectTag(null);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                activeView.type === "all" && !selectedTag
                  ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Images size={16} />
                <span>Photos</span>
              </div>
              <div className="flex items-center gap-2">
                {activeView.type === "all" && !selectedTag && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
                <Badge
                  variant={activeView.type === "all" && !selectedTag ? "default" : "secondary"}
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                >
                  {totalPhotosCount.toLocaleString()}
                </Badge>
              </div>
            </button>

            {/* Favorites */}
            <button
              type="button"
              onClick={() => {
                onSelectView({ type: "favorites" });
                onSelectTag(null);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                activeView.type === "favorites"
                  ? "bg-rose-500/10 font-semibold text-rose-500 ring-1 ring-rose-500/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Heart
                  size={16}
                  className={cn(
                    activeView.type === "favorites"
                      ? "fill-rose-500 text-rose-500"
                      : "text-rose-400"
                  )}
                />
                <span>Favorites</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  activeView.type === "favorites"
                    ? "border-rose-500/30 bg-rose-500/15 text-rose-500"
                    : "border-border text-muted-foreground"
                )}
              >
                {favoritesCount}
              </Badge>
            </button>

            {/* Recents */}
            <button
              type="button"
              onClick={() => {
                onSelectView({ type: "recents" });
                onSelectTag(null);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                activeView.type === "recents"
                  ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
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
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                activeView.type === "hidden"
                  ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Lock size={16} />
                <span>Hidden Vault</span>
              </div>
              <KeyRound size={13} className="text-muted-foreground/60" />
            </button>
          </div>

          <Separator className="bg-border/60" />

          {/* ALBUMS Section with shadcn UI Form */}
          <div className="space-y-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Albums
              </p>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setIsCreatingAlbum((v) => !v)}
                  className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label={isCreatingAlbum ? "Cancel" : "Create new album"}
                >
                  {isCreatingAlbum ? <X size={14} /> : <Plus size={14} />}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isCreatingAlbum ? "Cancel" : "Create new album"}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Shadcn UI Album Creation Form */}
            {isCreatingAlbum && (
              <form
                onSubmit={handleCreateAlbumSubmit}
                className="mb-3 space-y-2 rounded-xl border border-primary/30 bg-sidebar-accent/50 p-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Folder size={14} className="text-primary" />
                  <span>New Album</span>
                </div>
                <Input
                  type="text"
                  autoFocus
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Album name…"
                  className="h-8 rounded-lg bg-background text-xs"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingAlbum(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newAlbumName.trim()}
                    className="h-7 px-2.5 text-xs font-semibold"
                  >
                    <Check size={13} className="mr-1" /> Create
                  </Button>
                </div>
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
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                    isSelected
                      ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="mr-2 flex items-center gap-2.5 truncate">
                    <Folder
                      size={16}
                      className={isSelected ? "text-primary" : "text-muted-foreground/60"}
                    />
                    <span className="truncate">{album.name}</span>
                  </div>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {album.count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* QUICK FILTERS Section — only shown when real photo tags exist. */}
          {quickFilters.length > 0 && (
            <div className="space-y-2">
              <Separator className="bg-border/60" />
              <p className="px-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Quick Filters
              </p>
              <div className="flex flex-wrap gap-1.5 px-2">
                {quickFilters.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <Badge
                      key={tag}
                      variant={active ? "default" : "outline"}
                      onClick={() => onSelectTag(active ? null : tag)}
                      className={cn(
                        "cursor-pointer font-mono text-xs transition",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-sidebar-accent/50 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Profile & Storage Card */}
        <div className="border-t border-border bg-sidebar p-3 space-y-3">
          {/* Storage Bar Card — real vault usage */}
          <Card className="border-border bg-card/60 p-3 shadow-none gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <HardDrive size={13} className="text-primary" />
                <span>Encrypted Vault</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {usedGb.toFixed(1)} / {quotaGb.toFixed(0)} GB
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </Card>

          {/* User Account Row */}
          <div className="flex items-center justify-between px-1">
            <Link
              href="/profile"
              className="group flex min-w-0 items-center gap-2.5"
            >
              <div className="relative">
                {avatarUrl ? (
                  <UserAvatar
                    seed={user?.id || "P"}
                    avatarUrl={avatarUrl}
                    avatarConfig={avatarConfig}
                    size={34}
                    className="rounded-xl border border-border"
                  />
                ) : (
                  <div className="grid size-[34px] place-items-center rounded-xl border border-primary/20 bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-sidebar bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground transition group-hover:text-primary">
                  {user ? displayName : "Guest"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user ? "Master Vault" : "Not signed in"}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-0.5 text-muted-foreground">
              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Toggle theme"
                >
                  <Sun size={15} className="hidden dark:block" />
                  <MoonStar size={15} className="block dark:hidden" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Toggle {theme === "dark" ? "light" : "dark"} mode</p>
                </TooltipContent>
              </Tooltip>

              {/* Settings button */}
              <Tooltip>
                <TooltipTrigger
                  onClick={() => router.push("/settings")}
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Open settings"
                >
                  <Settings size={15} />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>

              {/* Sign out / Log in */}
              {user ? (
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => signOut()}
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Sign out"
                  >
                    <Power size={14} />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Sign out</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  title="Log in to your vault"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  </>
);
};
export default AstroSidebar;
