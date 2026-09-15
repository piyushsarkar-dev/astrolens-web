"use client";

import {
  ArrowUpDown,
  CheckSquare,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Play,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";

export type TimeFilterMode = "Years" | "Months" | "Days" | "All Photos";
export type GridDensity = "compact" | "normal" | "large";
export type SortOrder = "desc" | "asc";

type AstroTopNavProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  timeFilter: TimeFilterMode;
  onTimeFilterChange: (mode: TimeFilterMode) => void;
  gridDensity: GridDensity;
  onGridDensityChange: (d: GridDensity) => void;
  sortOrder: SortOrder;
  onToggleSortOrder: () => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  isExifFilterOpen: boolean;
  onToggleExifFilter: () => void;
  onStartSlideshow: () => void;
  /** Photos matching the current search / filters. */
  resultCount?: number;
  /** True while the initial gallery load is still in flight. */
  isLoading?: boolean;
};

export const AstroTopNav = ({
  searchQuery,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  gridDensity,
  onGridDensityChange,
  sortOrder,
  onToggleSortOrder,
  isSelectMode,
  onToggleSelectMode,
  isExifFilterOpen,
  onToggleExifFilter,
  onStartSlideshow,
  resultCount,
  isLoading = false,
}: AstroTopNavProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const timeOptions: TimeFilterMode[] = [
    "Years",
    "Months",
    "Days",
    "All Photos",
  ];

  // Show the "loading vault…" / "N matches" hint next to the search field.
  const showStatus =
    isLoading || (searchQuery.trim().length > 0 && resultCount !== undefined);

  return (
    <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#0c0d10]/95 px-6 backdrop-blur-md">
      {/* Search Bar with Ctrl+K + live result count */}
      <div className="flex items-center gap-3">
        <div className="relative w-64 md:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/40"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-1.5 pr-14 pl-9 text-xs text-white transition outline-none placeholder:text-white/35 hover:border-white/15 focus:border-emerald-500/50"
          />
          {searchQuery ?
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white/40 hover:text-white"
              title="Clear search">
              <X size={13} />
            </button>
          : <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-white/40">
              Ctrl+K
            </kbd>
          }
        </div>

        {showStatus && (
          <span className="hidden items-center gap-1.5 font-mono text-[11px] text-white/40 xl:flex">
            {isLoading ?
              <>
                <Loader2
                  size={12}
                  className="text-sky animate-spin"
                />
                <span>Loading vault…</span>
              </>
            : <>
                <span className="text-white/70">
                  {(resultCount ?? 0).toLocaleString()}
                </span>
                <span>matches</span>
              </>
            }
          </span>
        )}
      </div>

      {/* Time Segmented Pills */}
      <div className="hidden items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 text-xs font-medium sm:flex">
        {timeOptions.map((opt) => {
          const isActive = timeFilter === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onTimeFilterChange(opt)}
              className={`cursor-pointer rounded-lg px-3 py-1 transition ${
                isActive ?
                  "border border-white/15 bg-[#181a20] font-semibold text-white shadow-sm"
                : "text-white/50 hover:text-white"
              }`}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Density Layout Icons */}
        <div className="hidden items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 lg:flex">
          <button
            type="button"
            onClick={() => onGridDensityChange("compact")}
            className={`cursor-pointer rounded-lg p-1.5 transition ${
              gridDensity === "compact" ?
                "bg-white/10 text-white"
              : "text-white/40 hover:text-white"
            }`}
            title="Compact 4-column grid">
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => onGridDensityChange("normal")}
            className={`cursor-pointer rounded-lg p-1.5 transition ${
              gridDensity === "normal" ?
                "bg-white/10 text-white"
              : "text-white/40 hover:text-white"
            }`}
            title="Standard 3-column grid">
            <Grid3X3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onGridDensityChange("large")}
            className={`cursor-pointer rounded-lg p-1.5 transition ${
              gridDensity === "large" ?
                "bg-white/10 text-white"
              : "text-white/40 hover:text-white"
            }`}
            title="Wide 2-column grid">
            <Grid2X2 size={14} />
          </button>
        </div>

        {/* EXIF Filter */}
        <button
          type="button"
          onClick={onToggleExifFilter}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            isExifFilterOpen ?
              "border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-300"
            : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
          }`}>
          <SlidersHorizontal size={13} />
          <span className="hidden md:inline">EXIF Filter</span>
        </button>

        {/* Date Captured Sort — toggles newest-first / oldest-first */}
        <button
          type="button"
          onClick={onToggleSortOrder}
          aria-label={
            sortOrder === "desc" ?
              "Sorted by newest first, click for oldest first"
            : "Sorted by oldest first, click for newest first"
          }
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white">
          <ArrowUpDown
            size={13}
            className={`transition-transform duration-200 ${
              sortOrder === "asc" ? "rotate-180" : ""
            }`}
          />
          <span className="hidden md:inline">Date Captured</span>
          <span className="hidden text-white/40 lg:inline">
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </span>
        </button>

        {/* Select Mode */}
        <button
          type="button"
          onClick={onToggleSelectMode}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            isSelectMode ?
              "bg-sky border-sky font-semibold text-white"
            : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
          }`}>
          <CheckSquare size={13} />
          <span>Select</span>
        </button>

        {/* Play Slideshow */}
        <button
          type="button"
          onClick={onStartSlideshow}
          className="grid size-8 cursor-pointer place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          title="Play fullscreen slideshow">
          <Play size={13} />
        </button>
      </div>
    </div>
  );
};
