"use client";

import { KeyRound, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useBackup } from "@/components/Backup";
import {
  AstroBottomStatusBar,
  AstroHero,
  AstroSelectionBar,
  AstroSidebar,
  AstroTimelineGrid,
  AstroTopNav,
  type AstroViewMode,
  type GridDensity,
  type SortOrder,
  type TimeFilterMode,
} from "@/components/AstroLens";
import { searchImages } from "@/lib/search";
import type { ImageRecord } from "@/lib/types";
import Lightbox from "./Lightbox";
import UploadSection from "./UploadSection";

type GalleryPageProps = {
  initialImages: ImageRecord[];
  /** `?view=favorites|recents|hidden` coming from the header / settings links. */
  initialView?: string;
  /** Server-confirmed session state (undefined when it could not be checked). */
  initialUser?: boolean;
};

/** Storage quota displayed by the sidebar vault meter. */
const VAULT_QUOTA_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB

/** Caps how many derived filter chips the UI renders at once. */
const MAX_FILTER_CHIPS = 8;

/**
 * Derives the EXIF quick-filter chips from the photos actually stored in the
 * vault. Every chip is a value that genuinely exists on a record, so a chip
 * always matches at least one photo — nothing is hard-coded or invented.
 */
const collectExifChips = (images: ImageRecord[]): string[] => {
  const chips: string[] = [];
  const seen = new Set<string>();
  const push = (value: string | number | null | undefined) => {
    if (value == null) return;
    const label = String(value).trim();
    if (!label || seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    chips.push(label);
  };

  for (const image of images) {
    const meta = image.metadata;
    if (!meta) continue;
    push(meta.camera);
    push(meta.lens);
    push(meta.focalLength);
    push(meta.aperture);
    push(meta.iso);
    push(meta.shutter);
    if (chips.length >= MAX_FILTER_CHIPS) break;
  }

  return chips.slice(0, MAX_FILTER_CHIPS);
};

/**
 * Derives the sidebar `#tag` chips from the tags genuinely attached to the
 * vault's photos. Returns an empty array when no photo carries a tag.
 */
const collectTagChips = (images: ImageRecord[]): string[] => {
  const chips: string[] = [];
  const seen = new Set<string>();

  for (const image of images) {
    for (const tag of image.tags ?? []) {
      const clean = tag.trim();
      if (!clean || seen.has(clean.toLowerCase())) continue;
      seen.add(clean.toLowerCase());
      chips.push(`#${clean}`);
      if (chips.length >= MAX_FILTER_CHIPS) return chips;
    }
  }

  return chips;
};

/** Maps a raw `?view=` query value onto a real sidebar view. */
const toViewMode = (view: string | undefined): AstroViewMode => {
  switch (view) {
    case "favorites":
      return { type: "favorites" };
    case "recents":
      return { type: "recents" };
    case "hidden":
      return { type: "hidden" };
    default:
      return { type: "all" };
  }
};

const GalleryPage = ({
  initialImages,
  initialView,
  initialUser,
}: GalleryPageProps) => {
  const { user, loading: authLoading, hasImgbbKey } = useAuth();
  const userId = user?.id ?? null;

  // The server already knows whether a session exists, so the first paint is
  // correct: no "0 items" flash for signed-in users, and no gallery flash for
  // signed-out visitors.
  const showLoginWall =
    !userId &&
    (initialUser === false || (initialUser === undefined && !authLoading));

  // Photos that genuinely belong to the signed-in account.
  const [userImages, setUserImages] = useState<ImageRecord[]>(initialImages);
  // False until the first client-side fetch settles — keeps the empty upload
  // card from flashing before the real data arrives.
  const [imagesLoaded, setImagesLoaded] = useState(initialImages.length > 0);

  const [activeView, setActiveView] = useState<AstroViewMode>(() =>
    toViewMode(initialView),
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterMode>("Days");
  const [gridDensity, setGridDensity] = useState<GridDensity>("normal");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkBusy, setIsBulkBusy] = useState(false);
  const [isExifFilterOpen, setIsExifFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [createdAlbums, setCreatedAlbums] = useState<string[]>([]);

  const { subscribeToUploadedImage, openUploadPicker } = useBackup();
  const router = useRouter();

  // Handle uploaded images in real-time
  const handleUploaded = useCallback((newImages: ImageRecord[]) => {
    setUserImages((previous) => {
      const byId = new Map(previous.map((img) => [img.id, img]));
      for (const img of newImages) byId.set(img.id, img);
      return [...byId.values()];
    });
    setImagesLoaded(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUploadedImage((uploadedRecord) => {
      handleUploaded([uploadedRecord]);
    });
    return unsubscribe;
  }, [subscribeToUploadedImage, handleUploaded]);

  // Sync fresh images from backend when user logs in
  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    fetch("/api/images", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { data?: ImageRecord[] } | null) => {
        if (cancelled) return;
        setUserImages(json?.data ?? []);
        setImagesLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setImagesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  // The account's own photos, newest first.
  const ownImages = useMemo(
    () =>
      userId ?
        [...userImages].sort(
          (a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0),
        )
      : [],
    [userImages, userId],
  );

  // Everything visible in the gallery: strictly the user's own photos.
  const allImages = useMemo(
    () => (userId ? ownImages : []),
    [userId, ownImages],
  );

  // Filter chips are derived from photos that genuinely exist in the vault,
  // so every chip offered by the UI always matches at least one photo.
  const exifChips = useMemo(() => collectExifChips(allImages), [allImages]);
  const tagChips = useMemo(() => collectTagChips(allImages), [allImages]);

  // Album counts computed from the photos that are actually visible.
  const albumsList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of allImages) {
      for (const alb of img.albums || []) {
        counts.set(alb, (counts.get(alb) || 0) + 1);
      }
    }
    for (const alb of createdAlbums) {
      if (!counts.has(alb)) counts.set(alb, 0);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [allImages, createdAlbums]);

  const favoritesCount = useMemo(
    () => allImages.filter((img) => img.isFavorite).length,
    [allImages],
  );

  // Filtered by current sidebar view mode
  const filteredByView = useMemo(() => {
    if (activeView.type === "favorites") {
      return allImages.filter((img) => img.isFavorite);
    }
    if (activeView.type === "album") {
      return allImages.filter((img) => img.albums?.includes(activeView.name));
    }
    if (activeView.type === "recents") {
      return [...allImages].sort(
        (a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0),
      );
    }
    if (activeView.type === "hidden") {
      return allImages.filter((img) => img.tags?.includes("Hidden"));
    }
    return allImages;
  }, [allImages, activeView]);

  // Filtered by selected quick filter tag
  const filteredByTag = useMemo(() => {
    if (!selectedTag) return filteredByView;
    const cleanTag = selectedTag.replace("#", "").toLowerCase();
    return filteredByView.filter((img) => {
      const tagMatch = img.tags?.some((t) => t.toLowerCase() === cleanTag);
      const titleMatch = img.title.toLowerCase().includes(cleanTag);
      const mimeMatch = img.mime?.toLowerCase().includes(cleanTag);
      return tagMatch || titleMatch || mimeMatch;
    });
  }, [filteredByView, selectedTag]);

  // Filtered by live search query, then ordered by the sort toggle.
  const displayedImages = useMemo(() => {
    const matched = searchImages(searchQuery, filteredByTag);
    return [...matched].sort((a, b) =>
      sortOrder === "desc" ?
        (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0)
      : (a.uploadedAt ?? 0) - (b.uploadedAt ?? 0),
    );
  }, [searchQuery, filteredByTag, sortOrder]);

  // Applies a patch to matching photos in the user's vault so optimistic
  // updates stay consistent everywhere.
  const patchImages = useCallback(
    (ids: Set<string>, patch: Partial<ImageRecord>) => {
      setUserImages((list) =>
        list.map((item) => (ids.has(item.id) ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const removeImages = useCallback((ids: Set<string>) => {
    setUserImages((list) => list.filter((item) => !ids.has(item.id)));
  }, []);

  // Toggle favorite status on a photo
  const handleToggleFavorite = useCallback(
    async (image: ImageRecord, e: React.MouseEvent) => {
      e.stopPropagation();
      const nextFavorite = !image.isFavorite;

      // Update state locally immediately
      patchImages(new Set([image.id]), { isFavorite: nextFavorite });

      // If managed photo, persist to server
      if (image.managed) {
        try {
          await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: nextFavorite }),
          });
        } catch {
          // Keep local state
        }
      }

      toast.success(
        nextFavorite ? "Added to Favorites" : "Removed from Favorites",
      );
    },
    [patchImages],
  );

  // Multi-select handlers
  const handleToggleSelectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // "Select all" inside a timeline group also switches on select mode so the
  // bulk action bar appears immediately.
  const handleSelectGroup = useCallback(
    (groupItemIds: string[]) => {
      const allSelected = groupItemIds.every((id) => selectedIds.has(id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          groupItemIds.forEach((id) => next.delete(id));
        } else {
          groupItemIds.forEach((id) => next.add(id));
        }
        return next;
      });
      if (!allSelected) setIsSelectMode(true);
    },
    [selectedIds],
  );

  // Sidebar view switching always closes the lightbox and drops any selection.
  const handleSelectView = useCallback((view: AstroViewMode) => {
    setActiveView(view);
    setSelectedIndex(null);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(displayedImages.map((img) => img.id)));
    setIsSelectMode(true);
  }, [displayedImages]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode((previous) => !previous);
    setSelectedIds(new Set());
  }, []);

  // Bulk favorite for every selected photo
  const handleBulkFavorite = useCallback(async () => {
    const targets = allImages.filter((img) => selectedIds.has(img.id));
    if (targets.length === 0) return;

    const nextFavorite = !targets.every((img) => img.isFavorite);
    setIsBulkBusy(true);
    patchImages(new Set(targets.map((img) => img.id)), {
      isFavorite: nextFavorite,
    });

    await Promise.all(
      targets
        .filter((img) => img.managed)
        .map((img) =>
          fetch(`/api/images/${encodeURIComponent(img.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: nextFavorite }),
          }).catch(() => null),
        ),
    );

    setIsBulkBusy(false);
    toast.success(
      `${targets.length} photo${targets.length === 1 ? "" : "s"} ${
        nextFavorite ? "added to" : "removed from"
      } Favorites`,
    );
  }, [allImages, selectedIds, patchImages]);

  // Bulk delete for every selected photo
  const handleBulkDelete = useCallback(async () => {
    const targets = allImages.filter((img) => selectedIds.has(img.id));
    if (targets.length === 0) return;

    const managed = targets.filter((img) => img.managed);
    const confirmed = window.confirm(
      managed.length > 0 ?
        `Delete ${managed.length} photo${managed.length === 1 ? "" : "s"} from ImgBB and your vault?`
      : `Remove ${targets.length} photo${targets.length === 1 ? "" : "s"} from this view?`,
    );
    if (!confirmed) return;

    setIsBulkBusy(true);
    let failed = 0;

    await Promise.all(
      managed.map(async (img) => {
        try {
          const response = await fetch(
            `/api/images/${encodeURIComponent(img.id)}`,
            { method: "DELETE" },
          );
          if (!response.ok) failed += 1;
        } catch {
          failed += 1;
        }
      }),
    );

    removeImages(new Set(targets.map((img) => img.id)));
    setSelectedIds(new Set());
    setIsSelectMode(false);
    setIsBulkBusy(false);

    if (failed > 0) {
      toast.error(
        `${failed} photo${failed === 1 ? "" : "s"} could not be deleted.`,
      );
    } else {
      toast.success(
        `${targets.length} photo${targets.length === 1 ? "" : "s"} removed.`,
      );
    }
  }, [allImages, selectedIds, removeImages]);

  // Delete a single photo (from the lightbox)
  const handleDelete = useCallback(
    async (image: ImageRecord) => {
      try {
        if (image.managed) {
          const response = await fetch(
            `/api/images/${encodeURIComponent(image.id)}`,
            { method: "DELETE" },
          );
          const json = (await response.json().catch(() => null)) as {
            error?: string;
            warning?: string;
          } | null;
          if (!response.ok) {
            throw new Error(json?.error ?? "Could not delete the photo.");
          }
          if (json?.warning) {
            toast.warning("Deleted from your gallery", {
              description: json.warning,
            });
          } else {
            toast.success("Photo deleted from ImgBB and your gallery.");
          }
        } else {
          toast.success("Photo removed from this view.");
        }

        removeImages(new Set([image.id]));
        setSelectedIds((prev) => {
          if (!prev.has(image.id)) return prev;
          const next = new Set(prev);
          next.delete(image.id);
          return next;
        });
        setSelectedIndex(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed.");
      }
    },
    [removeImages],
  );

  // Update photo edits/metadata
  const handleUpdateImage = useCallback((updated: ImageRecord) => {
    setUserImages((list) =>
      list.map((img) => (img.id === updated.id ? updated : img)),
    );
  }, []);

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  // Real totals — the sidebar meter only counts the user's own photos.
  const totalBytes = useMemo(
    () => allImages.reduce((acc, img) => acc + (img.size || 0), 0),
    [allImages],
  );

  const ownBytes = useMemo(
    () => ownImages.reduce((acc, img) => acc + (img.size || 0), 0),
    [ownImages],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d10] text-[#e3e2e6]">
      {/* Left Sidebar */}
      <AstroSidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        totalPhotosCount={allImages.length}
        favoritesCount={favoritesCount}
        usedBytes={ownBytes}
        quotaBytes={VAULT_QUOTA_BYTES}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        albums={albumsList}
        quickFilters={tagChips}
        onCreateAlbum={(name) =>
          setCreatedAlbums((prev) => Array.from(new Set([...prev, name])))
        }
      />

      {/* Main Content Workspace */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <AstroTopNav
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          gridDensity={gridDensity}
          onGridDensityChange={setGridDensity}
          sortOrder={sortOrder}
          onToggleSortOrder={() =>
            setSortOrder((previous) => (previous === "desc" ? "asc" : "desc"))
          }
          isSelectMode={isSelectMode}
          onToggleSelectMode={handleToggleSelectMode}
          isExifFilterOpen={isExifFilterOpen}
          onToggleExifFilter={() => setIsExifFilterOpen((v) => !v)}
          onStartSlideshow={() => {
            if (displayedImages.length > 0) setSelectedIndex(0);
          }}
          resultCount={displayedImages.length}
          isLoading={Boolean(userId) && !imagesLoaded && !authLoading}
        />

        {/* Scrollable Gallery Area */}
        <main className="flex-1 scrollbar-thin scrollbar-thumb-white/10 space-y-4 overflow-y-auto px-8">
          {/* Logged-out state — the vault is private to each account. */}
          {showLoginWall ?
            <div className="flex justify-center py-24">
              <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <span className="border-sky/20 bg-sky/10 text-sky mx-auto grid size-14 place-items-center rounded-2xl border">
                  <Lock size={24} />
                </span>
                <h2 className="font-display mt-5 text-xl font-bold text-white">
                  Log in to see your photos
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  Your gallery is private — each account only sees its own
                  uploads. Log in or create an account to continue.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-white transition hover:bg-white/[0.09]">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-sky hover:bg-sky/90 rounded-full px-5 py-2 text-sm font-semibold text-white transition">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          : <>
              {/* Hero Section */}
              <AstroHero
                view={activeView}
                totalCount={allImages.length}
                totalSizeBytes={totalBytes}
                selectedCount={selectedIds.size}
                onOpenMap={() =>
                  toast.info("Interactive places map opening soon.")
                }
                onOpenMemories={() =>
                  toast.info("Curated AI memories vault opening soon.")
                }
                onSelectAll={handleSelectAll}
                onUpload={openUploadPicker}
                onOpenSettings={() => router.push("/settings")}
              />

              {/* Collapsible EXIF Filter Strip */}
              {isExifFilterOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 font-mono text-xs text-white/70">
                  <span className="mr-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
                    EXIF Tags:
                  </span>
                  {exifChips.length === 0 && (
                    <span className="text-white/35">
                      No camera metadata in this vault yet.
                    </span>
                  )}
                  {exifChips.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSearchQuery((previous) =>
                          previous === tag ? "" : tag,
                        )
                      }
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 transition ${
                        searchQuery === tag ?
                          "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:text-white"
                      }`}>
                      {tag}
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="ml-auto cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-white/60 transition hover:text-white">
                      Clear filter
                    </button>
                  )}
                </div>
              )}

              {/* Bulk actions — only while photos are selected in Select mode */}
              {isSelectMode && selectedIds.size > 0 && (
                <AstroSelectionBar
                  selectedCount={selectedIds.size}
                  totalCount={displayedImages.length}
                  isBusy={isBulkBusy}
                  onFavoriteSelected={handleBulkFavorite}
                  onDeleteSelected={handleBulkDelete}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onExitSelectMode={handleToggleSelectMode}
                />
              )}

              {/* ImgBB key reminder — uploads need a personal API key. */}
              {imagesLoaded && !hasImgbbKey && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-400">
                    <KeyRound size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-white">
                      Add your ImgBB API key to enable uploads
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      Your personal key is free at api.imgbb.com — save it from
                      Settings.
                    </p>
                  </div>
                  <Link
                    href="/settings"
                    className="bg-sky hover:bg-sky/90 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition">
                    Open Settings
                  </Link>
                </div>
              )}

              {/* Centered drag & drop card while the account has no photos yet. */}
              {imagesLoaded && ownImages.length === 0 && (
                <UploadSection
                  onUploaded={handleUploaded}
                  onError={handleError}
                  disabled={!hasImgbbKey}
                />
              )}

              {/* Timeline Photo Grid */}
              <AstroTimelineGrid
                images={displayedImages}
                onSelectImage={setSelectedIndex}
                onToggleFavorite={handleToggleFavorite}
                isSelectMode={isSelectMode}
                selectedIds={selectedIds}
                onToggleSelectItem={handleToggleSelectItem}
                onSelectGroup={handleSelectGroup}
                gridDensity={gridDensity}
                timeFilter={timeFilter}
                searchQuery={searchQuery}
              />
            </>
          }
        </main>

        {/* Bottom Status Bar */}
        <AstroBottomStatusBar
          totalCount={allImages.length}
          totalSizeBytes={totalBytes}
          syncedCount={displayedImages.length}
        />
      </div>

      {/* Lightbox / Slideshow / Photo Inspector */}
      {selectedIndex !== null && displayedImages[selectedIndex] && (
        <Lightbox
          images={displayedImages}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
          onDelete={handleDelete}
          onUpdateImage={handleUpdateImage}
        />
      )}
    </div>
  );
};

export default GalleryPage;
