"use client";

import { Check, X } from "lucide-react";
import React from "react";
import type { BackupItemStatus } from "./BackupContext";

type ProgressiveImageCardProps = {
  src: string;
  progress: number; // 0 - 100
  status?: BackupItemStatus;
  onCancel?: () => void;
  className?: string;
  sizeClassName?: string;
  showPercentText?: boolean;
};

export const ProgressiveImageCard = ({
  src,
  progress,
  status = "uploading",
  onCancel,
  className = "",
  sizeClassName = "size-20 sm:size-24",
  showPercentText = true,
}: ProgressiveImageCardProps) => {
  const isDone = status === "success" || progress >= 100;
  const isCancelled = status === "cancelled";
  const isError = status === "error";
  const displayProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-lg ${sizeClassName} ${className}`}>
      {/* Layer 1: Blurry / frosted background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="size-full object-cover filter blur-[7px] brightness-90 scale-105 transition-all duration-200"
      />

      {/* Layer 2: 100% Sharp & Clear image clipped to current progress */}
      <div
        className="absolute inset-0 overflow-hidden transition-[clip-path] duration-75 linear"
        style={{
          clipPath: isDone
            ? "inset(0 0 0 0)"
            : isCancelled || isError
              ? `inset(0 ${100 - displayProgress}% 0 0)`
              : `inset(0 ${100 - displayProgress}% 0 0)`,
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Upload preview"
          className="size-full object-cover"
        />
      </div>

      {/* Vertical dividing indicator line between clear and blurry */}
      {!isDone && !isCancelled && !isError && displayProgress > 0 && displayProgress < 100 && (
        <div
          className="pointer-events-none absolute inset-y-0 w-[1.5px] bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.95)] transition-[left] duration-75 linear"
          style={{ left: `${displayProgress}%` }}
        />
      )}

      {/* Top-Left Circular Close/Cancel button (matches user reference) */}
      {onCancel && !isDone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          aria-label="Cancel upload"
          className="absolute top-1.5 left-1.5 z-20 grid size-5 place-items-center rounded-full bg-white/95 text-neutral-800 shadow-md transition-transform hover:scale-110 active:scale-90">
          <X size={12} strokeWidth={2.8} />
        </button>
      )}

      {/* Big Bold Center Percentage Text (matches user reference) */}
      {showPercentText && !isDone && !isCancelled && !isError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
            {displayProgress}
            <span className="text-xs sm:text-sm font-extrabold ml-0.5">%</span>
          </span>
        </div>
      )}

      {/* Done Checkmark Badge when 100% clear */}
      {isDone && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px] transition-all">
          <span className="grid size-7 place-items-center rounded-full bg-emerald-500 text-black shadow-lg animate-in zoom-in-75 duration-200">
            <Check size={16} strokeWidth={3.5} />
          </span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-950/60">
          <span className="grid size-6 place-items-center rounded-full bg-red-500 text-white shadow-md">
            <X size={14} strokeWidth={3} />
          </span>
        </div>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black shadow">
            Stopped
          </span>
        </div>
      )}
    </div>
  );
};
