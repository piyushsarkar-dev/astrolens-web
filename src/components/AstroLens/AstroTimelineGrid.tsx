"use client";

import { Check, Heart, MapPin } from "lucide-react";
import { useMemo } from "react";
import type { ImageRecord } from "@/lib/types";
import type { GridDensity, TimeFilterMode } from "./AstroTopNav";

type AstroTimelineGridProps = {
  images: ImageRecord[];
  onSelectImage: (index: number) => void;
  onToggleFavorite: (image: ImageRecord, e: React.MouseEvent) => void;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelectItem: (id: string) => void;
  onSelectGroup: (ids: string[]) => void;
  gridDensity: GridDensity;
  timeFilter: TimeFilterMode;
  /** Active search query — used to tailor the empty state message. */
  searchQuery?: string;
};

type ImageGroup = {
  key: string;
  title: string;
  location?: string;
  images: Array<{ item: ImageRecord; globalIndex: number }>;
};

export const AstroTimelineGrid = ({
  images,
  onSelectImage,
  onToggleFavorite,
  isSelectMode,
  selectedIds,
  onToggleSelectItem,
  onSelectGroup,
  gridDensity,
  timeFilter,
  searchQuery = "",
}: AstroTimelineGridProps) => {
  // Group photos using the bucket selected in the top nav (Days / Months /
  // Years / All Photos). Order follows `images`, which the page sorts.
  const groups: ImageGroup[] = useMemo(() => {
    const map = new Map<string, ImageGroup>();
    const now = new Date();

    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    images.forEach((item, index) => {
      const parsed = item.uploadedAt ? new Date(item.uploadedAt) : now;
      const d = Number.isNaN(parsed.getTime()) ? now : parsed;

      let key: string;
      let title: string;

      if (timeFilter === "All Photos") {
        key = "all";
        title = "All Photos";
      } else if (timeFilter === "Years") {
        key = `y-${d.getFullYear()}`;
        title = String(d.getFullYear());
      } else if (timeFilter === "Months") {
        key = `m-${d.getFullYear()}-${d.getMonth() + 1}`;
        const monthLabel = d.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });
        const isThisMonth =
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth();
        title = isThisMonth ? `This month — ${monthLabel}` : monthLabel;
      } else {
        key = `d-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const dayLabel = d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        title =
          isSameDay(d, now) ? `Today — ${dayLabel}`
          : isSameDay(d, yesterday) ? `Yesterday — ${dayLabel}`
          : dayLabel;
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          title,
          location: item.location?.name,
          images: [],
        });
      }

      map.get(key)!.images.push({ item, globalIndex: index });
    });

    return Array.from(map.values());
  }, [images, timeFilter]);

  // Determine format tag for each image (ARW 14-bit, CR3, TIFF Stack, etc.)
  const getFormatTag = (img: ImageRecord) => {
    if (img.mime?.includes("arw"))
      return {
        label: "ARW 14-bit",
        color: "text-emerald-400 border-emerald-500/30",
      };
    if (img.mime?.includes("cr3"))
      return { label: "CR3", color: "text-foreground/80 border-line-strong" };
    if (
      img.mime?.includes("tiff") &&
      img.title.toLowerCase().includes("nebula")
    ) {
      return {
        label: "TIFF Stack",
        color: "text-amber-300 border-amber-500/30",
      };
    }
    if (img.mime?.includes("tiff"))
      return { label: "TIFF", color: "text-rose-300 border-rose-500/30" };
    if (img.mime?.includes("dng"))
      return { label: "DNG Scan", color: "text-amber-400 border-amber-500/30" };
    if (img.mime?.includes("nef"))
      return {
        label: "NEF Macro",
        color: "text-emerald-300 border-emerald-500/30",
      };
    if (img.tags?.includes("RAW"))
      return {
        label: "RAW 14-bit",
        color: "text-emerald-400 border-emerald-500/30",
      };
    return { label: "JPEG", color: "text-foreground/60 border-line-subtle" };
  };

  const getGridClass = () => {
    if (gridDensity === "compact")
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    if (gridDensity === "large") return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line-subtle py-20 text-center">
        <p className="text-sm font-medium text-foreground/60">
          {searchQuery.trim() ?
            `No photos match “${searchQuery.trim()}”`
          : "No photos found in this view"}
        </p>
        <p className="text-xs text-foreground/35">
          {searchQuery.trim() ?
            "Try a different keyword, or clear the search to see everything."
          : "Upload a photo or switch to another album to fill this view."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24">
      {groups.map((group) => {
        const groupItemIds = group.images.map((g) => g.item.id);
        const allGroupSelected = groupItemIds.every((id) =>
          selectedIds.has(id),
        );

        return (
          <div
            key={group.key}
            className="space-y-3.5">
            {/* Group Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  {group.title}
                </h2>
                {group.location && (
                  <span className="flex items-center gap-1 text-xs font-medium text-foreground/40">
                    <MapPin
                      size={11}
                      className="text-foreground/30"
                    />
                    {group.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-foreground/40">
                  {group.images.length}{" "}
                  {group.images.length === 1 ? "capture" : "captures"}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectGroup(groupItemIds)}
                  className="cursor-pointer font-medium text-foreground/50 transition hover:text-foreground">
                  {allGroupSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className={`grid gap-3.5 ${getGridClass()}`}>
              {group.images.map(({ item, globalIndex }) => {
                const isSelected = selectedIds.has(item.id);
                const tag = getFormatTag(item);

                return (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-vault-low transition duration-200 ${
                      isSelected ?
                        "border-sky ring-sky/50 ring-2"
                      : "border-line-subtle hover:border-line-strong hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
                    }`}>
                    {/* Top Format Tag Badge */}
                    <div className="pointer-events-none absolute top-2.5 left-2.5 z-10">
                      <span
                        className={`inline-block rounded-md border bg-black/60 px-2 py-0.5 font-mono text-[10px] font-medium backdrop-blur-md ${tag.color}`}>
                        {tag.label}
                      </span>
                    </div>

                    {/* Top Right Favorite Heart */}
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(item, e)}
                      className="absolute top-2.5 right-2.5 z-10 grid size-7 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md transition hover:bg-black/80"
                      title={
                        item.isFavorite ? "Remove favorite" : "Add to favorites"
                      }>
                      <Heart
                        size={13}
                        className={
                          item.isFavorite ?
                            "fill-[#ff2a6d] text-[#ff2a6d]"
                          : "text-foreground/70 hover:text-foreground"
                        }
                      />
                    </button>

                    {/* Multi-Select Checkbox */}
                    {isSelectMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectItem(item.id);
                        }}
                        className={`absolute bottom-2.5 left-2.5 z-10 grid size-6 cursor-pointer place-items-center rounded-lg transition ${
                          isSelected ?
                            "bg-sky border-sky border text-white"
                          : "border border-white/20 bg-black/60 text-transparent hover:border-white/50"
                        }`}>
                        <Check
                          size={13}
                          strokeWidth={3}
                        />
                      </button>
                    )}

                    {/* Image Surface */}
                    <button
                      type="button"
                      onClick={() => {
                        // In select mode a tap toggles selection instead of
                        // opening the lightbox.
                        if (isSelectMode) {
                          onToggleSelectItem(item.id);
                          return;
                        }
                        onSelectImage(globalIndex);
                      }}
                      aria-pressed={isSelectMode ? isSelected : undefined}
                      className="block aspect-[4/3] w-full cursor-pointer overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.displayUrl || item.url}
                        alt={item.title || "Capture"}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.03]"
                      />
                    </button>

                    {/* Hover Title Overlay */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-6 opacity-0 transition duration-200 group-hover:opacity-100">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {item.title || "Untitled Capture"}
                      </p>
                      {item.metadata?.camera && (
                        <p className="truncate text-[10px] text-foreground/60">
                          {item.metadata.camera} · {item.metadata.shutter || ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
