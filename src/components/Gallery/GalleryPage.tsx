"use client";

import { AlertCircle, KeyRound, Lock, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [images, setImages] = useState<ImageRecord[]>(initialImages);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // When account changes (login / logout / switch user), reload ONLY that
  // user's photos from the server. Logged out → clear the grid.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setImages([]);
      setSelectedIndex(null);
      return;
    }
    let cancelled = false;
    setImages([]);
    setSelectedIndex(null);
    fetch("/api/images", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { data?: ImageRecord[] } | null) => {
        if (!cancelled) setImages(json?.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  const visibleImages = useMemo(
    () => [...images].sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0)),
    [images],
  );

  const syncFromImgbb = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/images/sync", { method: "POST" });
      const json = (await response.json().catch(() => null)) as {
        data?: ImageRecord[];
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(json?.error ?? "Could not sync images with ImgBB.");
      }
      setImages(json?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync images.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleUploaded = useCallback((newImages: ImageRecord[]) => {
    setImages((previous) => {
      const byId = new Map(previous.map((image) => [image.id, image]));
      for (const image of newImages) byId.set(image.id, image);
      return [...byId.values()];
    });
  }, []);

  const handleError = useCallback((message: string) => setError(message), []);

  const handleDelete = useCallback(
    async (image: ImageRecord) => {
      setError(null);
      try {
        const response = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
          method: "DELETE",
        });
        const json = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (!response.ok) {
          throw new Error(json?.error ?? "Could not delete the photo.");
        }
        // Remove from the grid and close the viewer if it was open.
        setImages((previous) => previous.filter((item) => item.id !== image.id));
        setSelectedIndex((current) => (current === null ? null : null));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed.");
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

      {error && (
        <div
          role="alert"
          className="vault-card text-gold flex items-start gap-3 rounded-2xl p-4 text-sm sm:p-6">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
            aria-hidden
          />
          <div className="flex-1">
            <p className="font-display text-base font-semibold">
              Something went wrong
            </p>
            <p className="text-mist mt-1 text-sm">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="bg-foreground/[0.04] hover:bg-foreground/[0.09] ring-line-subtle shrink-0 rounded-full p-1.5 ring-1 transition">
            <X size={16} />
          </button>
        </div>
      )}

      <ImageGrid
        images={visibleImages}
        onSelectImage={setSelectedIndex}
      />

      {selectedIndex !== null && visibleImages.length > 0 && (
                        <Lightbox
          images={visibleImages}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
          onDelete={user ? handleDelete : undefined}
        />
      )}
    </section>
  );
};

export default GalleryPage;
