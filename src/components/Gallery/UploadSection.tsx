"use client";

import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { ProgressiveImageCard, useBackup } from "@/components/Backup";
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
  const { startBackup, isBackingUp, queue, cancelItem, stopBackup } = useBackup();

  const handleFiles = useCallback(
    (files: File[]) => {
      const selected = files
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, MAX_UPLOAD_COUNT);

      if (selected.length === 0) {
        onError("Please choose image files (JPG, PNG, GIF, WebP, etc.).");
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
    <section className="space-y-3">
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
          "vault-card flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-dashed px-6 py-10 text-center transition-all sm:py-12",
          dragging ? "border-sky/60 bg-sky/[0.08]" : "hover:border-sky/40",
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

        <div className="bg-sky/15 ring-line-subtle grid size-14 place-items-center rounded-full ring-1">
          {isBackingUp ?
            <Loader2
              size={24}
              className="text-sky animate-spin"
            />
          : <UploadCloud
              size={24}
              className="text-sky"
            />
          }
        </div>

        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">
            {isBackingUp
              ? "Backing up photos…"
              : "Drag & drop photos here, or click to browse"}
          </p>
          <p className="text-mist text-sm">
            Upload up to {MAX_UPLOAD_COUNT} photos at once · images are stored
            on ImgBB via your API key
          </p>
        </div>

        <button
          type="button"
          disabled={disabled || isBackingUp}
          className="bg-sky hover:bg-sky/90 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white transition disabled:opacity-50"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}>
          <ImagePlus
            size={16}
            aria-hidden
          />
          {isBackingUp ? "Backing up…" : "Choose images"}
        </button>
      </div>

      {queue.length > 0 && (
        <div className="vault-card space-y-3 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-semibold">
                {isBackingUp ? "Uploading photos…" : "Upload queue"}
              </p>
              <p className="text-mist text-xs">
                Photos clear up progressively as real network upload completes
              </p>
            </div>
            {isBackingUp && (
              <button
                type="button"
                onClick={stopBackup}
                className="text-xs font-medium text-destructive transition hover:underline">
                Cancel all
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-1 sm:gap-4">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-1.5">
                <ProgressiveImageCard
                  src={item.previewUrl}
                  progress={item.progress}
                  status={item.status}
                  onCancel={() => cancelItem(item.id)}
                  sizeClassName="size-24 sm:size-28"
                />
                <span className="text-mist max-w-24 truncate text-center text-[11px] font-medium">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadSection;
