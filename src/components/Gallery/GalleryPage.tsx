"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ImageRecord } from "@/lib/types";
import ImageGrid from "./ImageGrid";
import Lightbox from "./Lightbox";
import UploadSection from "./UploadSection";

type GalleryPageProps = {
  initialImages: ImageRecord[];
};

const GalleryPage = ({ initialImages }: GalleryPageProps) => {
  const [images, setImages] = useState<ImageRecord[]>(initialImages);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  return (
    <section className="space-y-6 pt-24 pb-10 sm:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sky text-[11px] font-semibold tracking-[0.18em] uppercase">
            Lumen Vault
          </p>

          <h2 className="font-display text-[28px] leading-[36px] font-bold tracking-[-0.02em] lg:text-4xl lg:leading-[44px]">
            Photos
          </h2>

          <p className="text-mist text-sm">
            {visibleImages.length}{" "}
            {visibleImages.length === 1 ? "photo" : "photos"} · synced with
            ImgBB
          </p>
        </div>

        <button
          type="button"
          onClick={syncFromImgbb}
          disabled={syncing}
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
      />

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
        />
      )}
    </section>
  );
};

export default GalleryPage;
