"use client";

import { KeyRound, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useBackup } from "@/components/Backup";
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
  const { subscribeToUploadedImage } = useBackup();

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
  // (Logged-out visitors simply see an empty gallery — derived below.)
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
        // Real-time: drop it from the grid immediately and close the viewer.
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
    <section className="space-y-6 pt-20 pb-10 sm:pt-24">

      {/* Centered drag-and-drop card ONLY when user has 0 photos in account */}
      {visibleImages.length === 0 && (
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
            <p className="font-display text-base font-semibold">Log in to see your photos</p>
            <p className="text-mist mt-0.5 text-sm">Your gallery is private — each account only sees its own uploads. Log in or create an account to continue.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/login" className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition">Log in</a>
            <a href="/signup" className="bg-sky rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky/90">Sign up</a>
          </div>
        </div>
      )}

            {!authLoading && user && !hasImgbbKey && (
        <div className="vault-card flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm sm:p-6">
          <span className="bg-amber-500/10 text-amber-500 ring-line-subtle grid size-10 shrink-0 place-items-center rounded-full ring-1">
            <KeyRound size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold">Add your ImgBB API key to enable uploads</p>
            <p className="text-mist mt-0.5 text-sm">Save your personal key — open Settings from your account menu. It is free at api.imgbb.com.</p>
          </div>
          <a href="/settings" className="bg-sky rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky/90">Open Settings</a>
        </div>
      )}

      <ImageGrid
        images={visibleImages}
        onSelectImage={setSelectedIndex}
      />

      {userId && selectedIndex !== null && visibleImages.length > 0 && (
        <Lightbox
          images={visibleImages}
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
  );
};

export default GalleryPage;
