"use client";

import { Check, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

type UploadStatus = "pending" | "uploading" | "success" | "error";

type QueueItem = {
  key: string;
  name: string;
  status: UploadStatus;
  message?: string;
};

type UploadSectionProps = {
  onUploaded: (images: ImageRecord[]) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

const MAX_UPLOAD_COUNT = 30;

const uploadFileToApi = async (file: File): Promise<ImageRecord> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/images", {
    method: "POST",
    body: formData,
  });

  const json = (await response.json().catch(() => null)) as {
    data?: ImageRecord[];
    error?: string;
  } | null;

  if (!response.ok || !json?.data) {
    throw new Error(json?.error || `Upload failed (HTTP ${response.status}).`);
  }

  return json.data[0];
};
const UploadSection = ({
  onUploaded,
  onError,
  disabled,
}: UploadSectionProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const uploading = queue.some((item) => item.status === "uploading");
  const doneCount = queue.filter((item) => item.status === "success").length;
  const failedCount = queue.filter((item) => item.status === "error").length;

  const updateItem = useCallback((key: string, patch: Partial<QueueItem>) => {
    setQueue((previous) =>
      previous.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }, []);

  const enqueue = useCallback(
    (files: File[]) => {
      const selected = files
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, MAX_UPLOAD_COUNT);

      if (selected.length === 0) {
        onError("Please choose image files (JPG, PNG, GIF, WebP, etc.).");
        return;
      }

      const items: QueueItem[] = selected.map((file) => ({
        key: crypto.randomUUID(),
        name: file.name || "image",
        status: "pending",
      }));
      setQueue((previous) => [...previous, ...items]);

      void (async () => {
        for (const [index, file] of selected.entries()) {
          const item = items[index];
          updateItem(item.key, { status: "uploading" });
          try {
            const image = await uploadFileToApi(file);
            updateItem(item.key, { status: "success" });
            onUploaded([image]);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Upload failed.";
            updateItem(item.key, { status: "error", message });
            onError(message);
          }
        }
      })();
    },
    [onError, onUploaded, updateItem],
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) enqueue(files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    enqueue(Array.from(event.dataTransfer.files ?? []));
  };

  const clearFinished = () =>
    setQueue((previous) =>
      previous.filter(
        (item) => item.status === "pending" || item.status === "uploading",
      ),
    );

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
          "vault-card flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-dashed px-6 py-10 text-center transition-colors sm:py-12",
          dragging ? "border-sky/60 bg-sky/[0.08]" : "hover:border-sky/40",
          (disabled || uploading) && "pointer-events-none opacity-60",
        )}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />

        <div className="bg-sky/15 ring-line-subtle grid size-14 place-items-center rounded-full ring-1">
          {uploading ?
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
            Drag &amp; drop photos here, or click to browse
          </p>
          <p className="text-mist text-sm">
            Upload up to {MAX_UPLOAD_COUNT} photos at once · images are stored
            on ImgBB via your API key
          </p>
        </div>

        <button
          type="button"
          className="bg-sky hover:bg-sky/90 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white transition"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}>
          <ImagePlus
            size={16}
            aria-hidden
          />
          Choose images
        </button>
      </div>

      {queue.length > 0 && (
        <ul className="vault-card space-y-2 rounded-2xl p-4 sm:p-6">
          {queue.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.message && (
                  <p className="text-gold truncate text-xs">{item.message}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {item.status === "pending" && (
                  <span className="text-mist text-xs">Queued</span>
                )}
                {item.status === "uploading" && (
                  <Loader2
                    size={16}
                    className="text-sky animate-spin"
                  />
                )}
                {item.status === "success" && (
                  <Check
                    size={16}
                    className="text-leaf"
                  />
                )}
                {item.status === "error" && (
                  <X
                    size={16}
                    className="text-destructive"
                  />
                )}
              </div>
            </li>
          ))}

          {(doneCount > 0 || failedCount > 0) && (
            <li className="flex justify-end pt-1">
              <button
                type="button"
                onClick={clearFinished}
                className="text-mist text-xs underline-offset-2 hover:underline">
                Clear finished ({doneCount + failedCount})
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
};

export default UploadSection;
