"use client";

import { Check, Heart, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import type { ImageRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
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
      return "columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3 sm:gap-3.5";
    if (gridDensity === "large")
      return "columns-1 sm:columns-2 md:columns-2 lg:columns-3 gap-4 sm:gap-5";
    return "columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3.5 sm:gap-4";
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-20 text-center">
        <p className="text-sm font-medium text-foreground/60">
          {searchQuery.trim() ?
            `No photos match “${searchQuery.trim()}”`
          : "No photos found in this view"}
        </p>
        <p className="text-xs text-muted-foreground">
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
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <MapPin
                      size={11}
                      className="text-muted-foreground/60"
                    />
                    {group.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  {group.images.length}{" "}
                  {group.images.length === 1 ? "capture" : "captures"}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectGroup(groupItemIds)}
                  className="cursor-pointer font-medium text-muted-foreground transition hover:text-foreground">
                  {allGroupSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
            </div>

            {/* Photos Auto-Adjusting Pinterest-style Masonry Flow */}
            <div className={cn("w-full", getGridClass())}>
              {group.images.map(({ item, globalIndex }) => (
                <AstroPhotoCard
                  key={item.id}
                  item={item}
                  globalIndex={globalIndex}
                  isSelected={selectedIds.has(item.id)}
                  isSelectMode={isSelectMode}
                  onSelectImage={onSelectImage}
                  onToggleSelectItem={onToggleSelectItem}
                  onToggleFavorite={onToggleFavorite}
                  tag={getFormatTag(item)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

type AstroPhotoCardProps = {
  item: ImageRecord;
  globalIndex: number;
  isSelected: boolean;
  isSelectMode: boolean;
  onSelectImage: (index: number) => void;
  onToggleSelectItem: (id: string) => void;
  onToggleFavorite: (image: ImageRecord, e: React.MouseEvent) => void;
  tag: { label: string; color: string };
};

const AstroPhotoCard = ({
  item,
  globalIndex,
  isSelected,
  isSelectMode,
  onSelectImage,
  onToggleSelectItem,
  onToggleFavorite,
  tag,
}: AstroPhotoCardProps) => {
  // Capture natural image dimensions so that even if width/height is 0 in database,
  // the card dynamically auto-adjusts its height upon image load.
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(() =>
    item.width > 0 && item.height > 0 ?
      { width: item.width, height: item.height }
    : null,
  );

  const effectiveWidth = naturalSize?.width || item.width || 0;
  const effectiveHeight = naturalSize?.height || item.height || 0;
  const hasDimensions = effectiveWidth > 0 && effectiveHeight > 0;
  const isPortrait = hasDimensions && effectiveHeight > effectiveWidth * 1.15;
  const isPanoramic = hasDimensions && effectiveWidth > effectiveHeight * 1.8;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      if (
        !naturalSize ||
        naturalSize.width !== img.naturalWidth ||
        naturalSize.height !== img.naturalHeight
      ) {
        setNaturalSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    }
  };

  return (
    <div
      className={cn(
        "group relative mb-3.5 sm:mb-4 inline-block w-full break-inside-avoid overflow-hidden rounded-2xl border bg-card text-card-foreground transition-all duration-200",
        isSelected ?
          "border-primary ring-2 ring-primary/50 shadow-md"
        : "border-border hover:border-line-strong hover:shadow-[0_12px_36px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.7)]",
      )}
      style={{ transform: "translateZ(0)" }}>
      {/* Top Left Format & Orientation Badges */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-block rounded-md border bg-black/60 px-2 py-0.5 font-mono text-[10px] font-medium backdrop-blur-md shadow-sm",
            tag.color,
          )}>
          {tag.label}
        </span>
        {isPortrait && (
          <span className="hidden sm:inline-block rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/80 backdrop-blur-md">
            Portrait
          </span>
        )}
        {isPanoramic && (
          <span className="hidden sm:inline-block rounded-md border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] text-amber-300 backdrop-blur-md">
            Pano
          </span>
        )}
      </div>

      {/* Top Right Favorite Heart */}
      <button
        type="button"
        onClick={(e) => onToggleFavorite(item, e)}
        className="absolute top-2.5 right-2.5 z-10 grid size-7 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md transition hover:scale-110 hover:bg-black/80"
        title={item.isFavorite ? "Remove favorite" : "Add to favorites"}>
        <Heart
          size={13}
          className={
            item.isFavorite ?
              "fill-rose-500 text-rose-500"
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
          className={cn(
            "absolute bottom-2.5 left-2.5 z-10 grid size-6 cursor-pointer place-items-center rounded-lg transition",
            isSelected ?
              "bg-primary border-primary border text-primary-foreground shadow-sm"
            : "border border-white/20 bg-black/60 text-transparent hover:border-white/50",
          )}>
          <Check
            size={13}
            strokeWidth={3}
          />
        </button>
      )}

      {/* Responsive Surface: Height adapts 100% to Image Dimensions */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isSelectMode) {
            onToggleSelectItem(item.id);
            return;
          }
          onSelectImage(globalIndex);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isSelectMode) {
              onToggleSelectItem(item.id);
            } else {
              onSelectImage(globalIndex);
            }
          }
        }}
        aria-pressed={isSelectMode ? isSelected : undefined}
        className="relative block w-full cursor-pointer overflow-hidden bg-muted/20 text-left focus:outline-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.displayUrl || item.url}
          alt={item.title || "Capture"}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          style={{
            aspectRatio:
              hasDimensions ?
                `${effectiveWidth} / ${effectiveHeight}`
              : undefined,
          }}
          className="block h-auto w-full object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.025]"
        />
      </div>

      {/* Hover Title & EXIF Details Overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-8 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-white drop-shadow-sm">
            {item.title || "Untitled Capture"}
          </p>
          {hasDimensions && (
            <span className="shrink-0 font-mono text-[10px] text-white/70">
              {effectiveWidth}×{effectiveHeight}
            </span>
          )}
        </div>
        {item.metadata?.camera && (
          <p className="truncate text-[10px] text-white/70 mt-0.5">
            {item.metadata.camera}
            {item.metadata.shutter ? ` · ${item.metadata.shutter}` : ""}
            {item.metadata.focalLength ?
              ` · ${item.metadata.focalLength}`
            : ""}
          </p>
        )}
      </div>
    </div>
  );
};
