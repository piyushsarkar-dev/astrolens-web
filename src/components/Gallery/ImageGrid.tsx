"use client";

import { Heart } from "lucide-react";
import { useEffect } from "react";
import { preloadImage } from "@/lib/preloadImage";
import type { ImageRecord } from "@/lib/types";

type ImageGridProps = {
  images: ImageRecord[];
  onSelectImage: (index: number) => void;
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ImageGrid = ({ images, onSelectImage }: ImageGridProps) => {
  // Warm up the first 8 photos during browser idle time so initial clicks are instant
  useEffect(() => {
    if (typeof window === "undefined" || images.length === 0) return;

    const warmInitialImages = () => {
      const initialBatch = images.slice(0, 8);
      for (const img of initialBatch) {
        void preloadImage(img.displayUrl || img.url);
      }
    };

    if ("requestIdleCallback" in window) {
      const handle = (
        window as unknown as {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number },
          ) => number;
        }
      ).requestIdleCallback(warmInitialImages, { timeout: 2000 });
      return () =>
        (
          window as unknown as {
            cancelIdleCallback: (id: number) => void;
          }
        ).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(warmInitialImages, 500);
      return () => clearTimeout(timer);
    }
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="vault-masonry columns-4 gap-3 sm:columns-8 lg:columns-12">
      {images.map((image, index) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onSelectImage(index)}
          onMouseEnter={() => void preloadImage(image.displayUrl || image.url)}
          onFocus={() => void preloadImage(image.displayUrl || image.url)}
          onTouchStart={() => void preloadImage(image.displayUrl || image.url)}
          className="group bg-vault-lowest ring-line-subtle focus-visible:ring-sky relative block w-full break-inside-avoid overflow-hidden rounded-xl text-left ring-1 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.56)] focus-visible:ring-2 focus-visible:outline-none cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element -- masonry grid needs natural aspect ratio from remote images */}
          <img
            src={image.thumbUrl || image.url}
            alt={image.title || "Photo"}
            title={image.title}
            width={image.width > 0 ? image.width : undefined}
            height={image.height > 0 ? image.height : undefined}
            loading="lazy"
            decoding="async"
            className="w-full transition-transform duration-200 will-change-transform group-hover:scale-[1.02]"
          />

          {image.isFavorite && (
            <span
              className="absolute top-2.5 left-2.5 z-10 grid size-6 place-items-center rounded-full bg-black/50 backdrop-blur text-rose-500 shadow-md border border-white/10"
              title="Favorite photo">
              <Heart size={12} className="fill-rose-500" />
            </span>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <p className="truncate text-sm font-semibold text-white drop-shadow">
              {image.title || "Untitled"}
            </p>
            <p className="truncate text-xs text-white/70">
              {formatDate(image.uploadedAt)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ImageGrid;
