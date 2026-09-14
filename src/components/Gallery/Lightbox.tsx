"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import type { ImageRecord } from "@/lib/types";

type LightboxProps = {
  images: ImageRecord[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

const Lightbox = ({ images, index, onClose, onNavigate }: LightboxProps) => {
  const image = images[index];

  const go = useCallback(
    (delta: number) => {
      if (images.length === 0) return;
      onNavigate((index + delta + images.length) % images.length);
    },
    [images.length, index, onNavigate],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [go, onClose]);

  if (!image) return null;

  const imageSrc = image.url || image.displayUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.title || "Photo viewer"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-[20px]"
      onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="bg-foreground/[0.08] ring-line-strong hover:bg-foreground/[0.16] absolute top-4 right-4 grid size-10 place-items-center rounded-full text-white ring-1 transition">
        <X size={22} />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          go(-1);
        }}
        aria-label="Previous photo"
        className="bg-foreground/[0.08] ring-line-strong hover:bg-foreground/[0.16] absolute left-3 grid size-11 place-items-center rounded-full text-white ring-1 transition sm:left-6">
        <ChevronLeft size={26} />
      </button>

      <figure
        className="vault-modal w-[92vw] max-w-3xl space-y-0 overflow-hidden rounded-3xl"
        onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic remote images in a fullscreen viewer */}
        <img
          src={imageSrc}
          alt={image.title || "Photo"}
          className="mx-auto max-h-[72vh] w-full bg-black object-contain"
        />

        <figcaption className="flex items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6">
          <p className="font-display truncate text-base font-semibold">
            {image.title || "Untitled"}
          </p>
          <p className="text-mist shrink-0 text-xs font-medium tracking-wide">
            {index + 1} / {images.length}
          </p>
        </figcaption>
      </figure>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          go(1);
        }}
        aria-label="Next photo"
        className="bg-foreground/[0.08] ring-line-strong hover:bg-foreground/[0.16] absolute right-3 grid size-11 place-items-center rounded-full text-white ring-1 transition sm:right-6">
        <ChevronRight size={26} />
      </button>
    </div>
  );
};

export default Lightbox;
