"use client";

import {
  Check,
  Folder,
  Heart,
  Images,
  ListChecks,
  MapPin,
  MoreHorizontal,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AstroViewMode } from "./AstroSidebar";

type AstroHeroProps = {
  view: AstroViewMode;
  totalCount: number;
  totalSizeBytes: number;
  /** Selected photos across the whole view (enables the bulk actions). */
  selectedCount?: number;
  onOpenMap?: () => void;
  onOpenMemories?: () => void;
  onSelectAll?: () => void;
  onUpload?: () => void;
  onOpenSettings?: () => void;
};

export const AstroHero = ({
  view,
  totalCount,
  totalSizeBytes,
  selectedCount = 0,
  onOpenMap,
  onOpenMemories,
  onSelectAll,
  onUpload,
  onOpenSettings,
}: AstroHeroProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the "more options" menu when clicking anywhere outside of it.
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isMenuOpen]);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTitle = () => {
    if (view.type === "favorites") return "Favorites";
    if (view.type === "recents") return "Recents";
    if (view.type === "hidden") return "Hidden Vault";
    if (view.type === "album") return view.name;
    return "Photos";
  };

  const getIcon = () => {
    if (view.type === "favorites")
      return (
        <Heart
          size={20}
          className="fill-rose-400 text-rose-400"
        />
      );
    if (view.type === "album")
      return (
        <Folder
          size={20}
          className="text-amber-400"
        />
      );
    return (
      <Images
        size={20}
        className="text-emerald-400"
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 pb-4">
      {/* Title & Stats */}
      <div className="flex items-center gap-3.5">
        <div className="grid size-11 place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 shadow-md shadow-emerald-950/30">
          {getIcon()}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              {getTitle()}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Encrypted Master Vault
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
            <span>{totalCount.toLocaleString()} items</span>
            <span>•</span>
            <span>{formatSize(totalSizeBytes)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-400/90">
              <Check
                size={13}
                strokeWidth={2.5}
              />
              Synced & Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMap}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white">
          <MapPin
            size={14}
            className="text-emerald-400"
          />
          <span>Places Map</span>
        </button>

        <button
          type="button"
          onClick={onOpenMemories}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white">
          <Sparkles
            size={14}
            className="text-rose-400"
          />
          <span>Memories</span>
        </button>

        <div
          ref={menuRef}
          className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`grid size-9 cursor-pointer place-items-center rounded-xl border transition ${
              isMenuOpen ?
                "border-white/20 bg-white/[0.09] text-white"
              : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
            title="More options">
            <MoreHorizontal size={15} />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="animate-in fade-in slide-in-from-top-1 absolute top-11 right-0 z-40 w-52 overflow-hidden rounded-xl border border-white/[0.09] bg-[#111318] py-1 shadow-[0_18px_48px_rgba(0,0,0,0.65)]">
              {onSelectAll && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectAll();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white">
                  <ListChecks
                    size={14}
                    className="text-emerald-400"
                  />
                  <span>Select all photos ({totalCount.toLocaleString()})</span>
                </button>
              )}

              {onUpload && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onUpload();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white">
                  <Upload
                    size={14}
                    className="text-sky"
                  />
                  <span>Upload photos</span>
                </button>
              )}

              {onOpenSettings && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenSettings();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-xs text-white/75 transition hover:bg-white/[0.06] hover:text-white">
                  <Settings
                    size={14}
                    className="text-white/50"
                  />
                  <span>Vault settings</span>
                </button>
              )}

              {selectedCount > 0 && (
                <p className="mt-1 border-t border-white/[0.06] px-3 pt-2 pb-1 font-mono text-[10px] text-white/35">
                  {selectedCount} selected
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
