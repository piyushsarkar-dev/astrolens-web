"use client";

import { KeyRound, Lock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/Auth/AuthProvider";
import type { ImageRecord } from "@/lib/types";
import ImageGrid from "./ImageGrid";
import Lightbox from "./Lightbox";
import UploadSection from "./UploadSection";

type GalleryPageProps = {
  initialImages: ImageRecord[];
};

const GalleryPage = ({ initialImages }: GalleryPageProps) => {
  const { user, profile, loading: authLoading, hasImgbbKey } = useAuth();
  const userId = user?.id ?? null;
  const [allImages, setAllImages] = useState<ImageRecord[]>(initialImages);
  const [syncing, setSyncing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  const syncFromImgbb = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/images/sync", { method: "POST" });
      const json = (await response.json().catch(() => null)) as {
        data?: ImageRecord[];
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(json?.error ?? "Could not sync images with ImgBB.");
      }
      setAllImages(json?.data ?? []);
      toast.success("Synced with ImgBB.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not sync images.",
      );
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleUploaded = useCallback((newImages: ImageRecord[]) => {
    setAllImages((previous) => {
      const byId = new Map(previous.map((image) => [image.id, image]));
      for (const image of newImages) byId.set(image.id, image);
      return [...byId.values()];
    });
  }, []);

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
    <section className="space-y-6 pt-24 pb-10 sm:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sky text-[11px] font-semibold tracking-[0.18em] uppercase">
            Lumen Vault
          </p>

          <h2 className="font-display text-[28px] leading-[36px] font-bold tracking-[-0.02em] lg:text-4xl lg:leading-[44px]">
            {user
              ? `${profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Your"}’s Photos`
              : "Photos"}
          </h2>

          <p className="text-mist text-sm">
            {!user
              ? "Log in to see your private photo vault."
              : `${visibleImages.length} ${visibleImages.length === 1 ? "photo" : "photos"} · synced with ImgBB`}
          </p>
        </div>

        <button
          type="button"
          onClick={syncFromImgbb}
          disabled={syncing || !user || !hasImgbbKey}
          title={!user ? "Log in first" : !hasImgbbKey ? "Add your ImgBB key in profile first" : "Sync with ImgBB"}
          className="bg-foreground/[0.04] ring-line-subtle hover:bg-foreground/[0.09] inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 backdrop-blur transition disabled:opacity-60">
          <RefreshCw
            size={16}
            className={syncing ? "animate-spin" : ""}
            aria-hidden
          />
          {syncing ? "Syncing…" : "Sync with ImgBB"}
        </button>
      </div>

      <UploadSection
        onUploaded={handleUploaded}
        onError={handleError}
        disabled={authLoading ? true : !user || !hasImgbbKey}
      />

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
        />
      )}
    </section>
  );
};

export default GalleryPage;
