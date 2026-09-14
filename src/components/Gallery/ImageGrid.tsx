"use client";

import { Check, Images } from "lucide-react";
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
  if (images.length === 0) {
    return (
      <div className="vault-card grid min-h-72 place-items-center rounded-2xl border-dashed p-10 text-center">
        <div className="max-w-sm space-y-3">
          <span className="bg-sky/15 ring-line-subtle mx-auto grid size-16 place-items-center rounded-full ring-1">
            <Images
              size={28}
              className="text-sky"
              aria-hidden
            />
          </span>
          <p className="font-display text-xl font-semibold">No photos yet</p>
          <p className="text-mist text-sm">
            Upload your first photo above, or hit Sync with ImgBB to pull in
            images that were already uploaded to your ImgBB account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-masonry columns-4 gap-3 sm:columns-8 lg:columns-12">
      {images.map((image, index) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onSelectImage(index)}
          className="group bg-vault-lowest ring-line-subtle focus-visible:ring-sky relative block w-full break-inside-avoid overflow-hidden rounded-xl text-left ring-1 transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.56)] focus-visible:ring-2 focus-visible:outline-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- masonry grid needs natural aspect ratio from remote images */}
          <img
            src={image.thumbUrl || image.url}
            alt={image.title || "Photo"}
            title={image.title}
            width={image.width > 0 ? image.width : undefined}
            height={image.height > 0 ? image.height : undefined}
            loading="lazy"
            decoding="async"
            className="w-full transition-transform duration-300 will-change-transform group-hover:scale-[1.04]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
            <p className="truncate text-sm font-semibold text-white drop-shadow">
              {image.title || "Untitled"}
            </p>
            <p className="truncate text-xs text-white/70">
              {formatDate(image.uploadedAt)}
            </p>
          </div>

          <span className="bg-sky ring-line-strong absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full opacity-0 ring-1 transition-opacity duration-200 group-hover:opacity-100">
            <Check
              size={13}
              strokeWidth={3}
              className="text-white"
              aria-hidden
            />
          </span>
        </button>
      ))}
    </div>
  );
};

export default ImageGrid;
