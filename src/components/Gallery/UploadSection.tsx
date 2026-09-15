"use client";

import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useBackup } from "@/components/Backup";
import { cn } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

type UploadSectionProps = {
  onUploaded: (images: ImageRecord[]) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

const MAX_UPLOAD_COUNT = 30;

const UploadSection = ({
  onUploaded,
  onError,
  disabled,
}: UploadSectionProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const { startBackup, isBackingUp } = useBackup();

  const handleFiles = useCallback(
    (files: File[]) => {
      const selected = files
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, MAX_UPLOAD_COUNT);

      if (selected.length === 0) {
        onError("Please choose image files (JPG, PNG, GIF, WebP, etc.).");
        return;
      }

      const oversized = selected.filter((file) => file.size > 32 * 1024 * 1024);
      if (oversized.length > 0) {
        onError(
          `Some images exceed the 32 MB limit (${oversized.map((f) => f.name).join(", ")}). Please choose images up to 32 MB.`,
        );
        return;
      }

      startBackup(selected, (image) => {
        onUploaded([image]);
      });
    },
    [onError, onUploaded, startBackup],
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) handleFiles(files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <section className="mx-auto w-full max-w-2xl py-4 sm:py-8">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          "vault-card flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-8 py-12 text-center transition-all duration-300 sm:py-16 shadow-xl",
          dragging
            ? "border-sky bg-sky/[0.09] scale-[1.01]"
            : "border-border/60 hover:border-sky/50 hover:bg-foreground/[0.02]",
          (disabled || isBackingUp) && "pointer-events-none opacity-70",
        )}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || isBackingUp}
        />

        <div className="bg-sky/15 ring-sky/30 shadow-sky/20 grid size-16 place-items-center rounded-2xl ring-1 shadow-lg transition-transform duration-300 group-hover:scale-110">
          {isBackingUp ? (
            <Loader2 size={30} className="text-sky animate-spin" />
          ) : (
            <UploadCloud size={30} className="text-sky" />
          )}
        </div>

        <div className="space-y-1.5 max-w-md">
          <p className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {isBackingUp
              ? "Backing up photos…"
              : "Drag & drop photos here, or click to browse"}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            Upload up to {MAX_UPLOAD_COUNT} photos at once (up to 32 MB each) · stored on ImgBB via your API key
          </p>
        </div>

        <button
          type="button"
          disabled={disabled || isBackingUp}
          className="bg-sky hover:bg-sky/90 shadow-sky/25 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}>
          <ImagePlus size={18} aria-hidden />
          <span>{isBackingUp ? "Backing up…" : "Upload files"}</span>
        </button>
      </div>
    </section>
  );
};

export default UploadSection;
