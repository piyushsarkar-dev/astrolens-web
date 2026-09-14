"use client";

import { Folder, Heart, KeyRound, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useBackup } from "@/components/Backup";
import { AppSidebar, type SidebarView } from "@/components/Navigation/AppSidebar";
import type { ImageRecord } from "@/lib/types";
import ImageGrid from "./ImageGrid";
import Lightbox from "./Lightbox";
import UploadSection from "./UploadSection";

type GalleryPageProps = {
  initialImages: ImageRecord[];
};

const GalleryPage = ({ initialImages }: GalleryPageProps) => {
  const { user, loading: authLoading, hasImgbbKey } = useAuth();
  const userId = user?.id ?? null;
  const [allImages, setAllImages] = useState<ImageRecord[]>(initialImages);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<SidebarView>({ type: "all" });
  const [createdAlbums, setCreatedAlbums] = useState<string[]>([]);
  const { subscribeToUploadedImage } = useBackup();

  // Handle ?view=favorites from top navbar or URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "favorites") {
        setCurrentView({ type: "favorites" });
      }
    }
  }, []);

  const handleUploaded = useCallback((newImages: ImageRecord[]) => {
    setAllImages((previous) => {
      const byId = new Map(previous.map((image) => [image.id, image]));
      for (const image of newImages) byId.set(image.id, image);
      return [...byId.values()];
    });
  }, []);

  // Listen for uploads initiated from anywhere (e.g. the Navbar Upload button)
  useEffect(() => {
    const unsubscribe = subscribeToUploadedImage((uploadedRecord) => {
      handleUploaded([uploadedRecord]);
    });
    return unsubscribe;
  }, [subscribeToUploadedImage, handleUploaded]);

  // Reload ONLY the signed-in user's photos whenever the account changes.
  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    fetch("/api/images", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { data?: ImageRecord[] } | null) => {
        if (!cancelled) setAllImages(json?.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  const visibleImages = useMemo(
    () =>
      userId
        ? [...allImages].sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0))
        : [],
    [allImages, userId],
  );

  // Dynamic albums list computed from user's photos and created albums
  const albumsList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of visibleImages) {
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
  }, [visibleImages, createdAlbums]);

  const favoritesCount = useMemo(
    () => visibleImages.filter((img) => img.isFavorite).length,
    [visibleImages],
  );

  // Images filtered by current sidebar view
  const displayedImages = useMemo(() => {
    if (currentView.type === "favorites") {
      return visibleImages.filter((img) => img.isFavorite);
    }
    if (currentView.type === "album") {
      return visibleImages.filter((img) =>
        img.albums?.includes(currentView.name),
      );
    }
    return visibleImages;
  }, [visibleImages, currentView]);

  const handleError = useCallback((message: string) => toast.error(message), []);

  const handleDelete = useCallback(
    async (image: ImageRecord) => {
      try {
        const response = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
          method: "DELETE",
        });
        const json = (await response.json().catch(() => null)) as {
          error?: string;
          warning?: string;
        } | null;
        if (!response.ok) {
          throw new Error(json?.error ?? "Could not delete the photo.");
        }
        setAllImages((previous) => previous.filter((item) => item.id !== image.id));
        setSelectedIndex(null);
        if (json?.warning) {
          toast.warning("Deleted from your gallery", { description: json.warning });
        } else {
          toast.success("Photo deleted from ImgBB and your gallery.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed.");
      }
    },
    [],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 pt-20 pb-12 sm:pt-24 min-h-[calc(100vh-4rem)]">
      {/* Shadcn-style Left Sidebar Navigation */}
      {userId && (
        <AppSidebar
          activeView={currentView}
          onSelectView={setCurrentView}
          allPhotosCount={visibleImages.length}
          favoritesCount={favoritesCount}
          albums={albumsList}
          onCreateAlbum={(name) =>
            setCreatedAlbums((prev) => Array.from(new Set([...prev, name])))
          }
        />
      )}

      {/* Main Gallery Area */}
      <section className="flex-1 min-w-0 space-y-6">
        {/* Header Indicator for Favorites or Selected Album */}
        {currentView.type === "favorites" && (
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-rose-500/15 text-rose-500">
                <Heart size={18} className="fill-rose-500" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  Favorites
                </h2>
                <p className="text-xs text-muted-foreground">
                  {displayedImages.length}{" "}
                  {displayedImages.length === 1 ? "photo" : "photos"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView({ type: "all" })}
              className="text-xs font-medium text-sky hover:underline cursor-pointer">
              View all photos
            </button>
          </div>
        )}

        {currentView.type === "album" && (
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                <Folder size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {currentView.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {displayedImages.length}{" "}
                  {displayedImages.length === 1 ? "photo" : "photos"} in album
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView({ type: "all" })}
              className="text-xs font-medium text-sky hover:underline cursor-pointer">
              View all photos
            </button>
          </div>
        )}

        {/* Empty State for Favorites */}
        {currentView.type === "favorites" && displayedImages.length === 0 && (
          <div className="vault-card p-12 text-center rounded-3xl border border-dashed border-border/60 space-y-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-400 mx-auto">
              <Heart size={24} className="fill-rose-500/50" />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              No favorites yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click the heart icon on any photo in the viewer to add it to your Favorites.
            </p>
          </div>
        )}

        {/* Empty State for Album */}
        {currentView.type === "album" && displayedImages.length === 0 && (
          <div className="vault-card p-12 text-center rounded-3xl border border-dashed border-border/60 space-y-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 mx-auto">
              <Folder size={24} />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              Album is empty
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Open any photo and click &ldquo;Add to Album&rdquo; to add it to &ldquo;{currentView.name}&rdquo;.
            </p>
          </div>
        )}

        {/* Centered drag-and-drop card ONLY when user has 0 photos in account */}
        {currentView.type === "all" && visibleImages.length === 0 && (
          <UploadSection
            onUploaded={handleUploaded}
            onError={handleError}
            disabled={authLoading ? true : !user || !hasImgbbKey}
          />
        )}

        {!authLoading && !user && (
          <div className="vault-card flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm sm:p-6">
            <span className="bg-sky/15 text-sky ring-line-subtle grid size-10 shrink-0 place-items-center rounded-full ring-1">
              <Lock size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold">
                Log in to see your photos
              </p>
              <p className="text-mist mt-0.5 text-sm">
                Your gallery is private — each account only sees its own uploads. Log in or create an account to continue.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition">
                Log in
              </a>
              <a
                href="/signup"
                className="bg-sky rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky/90">
                Sign up
              </a>
            </div>
          </div>
        )}

        {!authLoading && user && !hasImgbbKey && (
          <div className="vault-card flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm sm:p-6">
            <span className="bg-amber-500/10 text-amber-500 ring-line-subtle grid size-10 shrink-0 place-items-center rounded-full ring-1">
              <KeyRound size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold">
                Add your ImgBB API key to enable uploads
              </p>
              <p className="text-mist mt-0.5 text-sm">
                Save your personal key — open Settings from your account menu. It is free at api.imgbb.com.
              </p>
            </div>
            <a
              href="/settings"
              className="bg-sky rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky/90">
              Open Settings
            </a>
          </div>
        )}

        <ImageGrid
          images={displayedImages}
          onSelectImage={setSelectedIndex}
        />

        {userId && selectedIndex !== null && displayedImages.length > 0 && (
          <Lightbox
            images={displayedImages}
            index={selectedIndex}
            onClose={() => setSelectedIndex(null)}
            onNavigate={setSelectedIndex}
            onDelete={handleDelete}
            onUpdateImage={(updated) => {
              setAllImages((previous) =>
                previous.map((item) => (item.id === updated.id ? updated : item)),
              );
            }}
          />
        )}
      </section>
    </div>
  );
};

export default GalleryPage;
