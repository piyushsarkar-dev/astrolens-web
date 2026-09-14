"use client";

import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { useBackup } from "./BackupContext";

export const BackupToaster = () => {
  const {
    queue,
    visible,
    currentPreviewUrl,
    overallProgress,
    isBackingUp,
    isCompleted,
    isCancelled,
    isExpanded,
    statusHeadline,
    counterText,
    toggleExpanded,
    stopBackup,
    dismiss,
  } = useBackup();

  if (!visible || queue.length === 0) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Backup progress"
      className="fixed right-4 bottom-4 z-50 w-[calc(100vw-2rem)] max-w-[380px] sm:right-6 sm:bottom-6 sm:max-w-[400px]">
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#1f2023]/95 text-white shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300">
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close backup toast"
          className="absolute top-2.5 right-2.5 z-10 grid size-6 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
          <X size={14} />
        </button>

        {/* Main Card Content */}
        <div className="flex items-center justify-between gap-4 p-4 pb-3.5">
          {/* Left info column */}
          <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
            <div>
              <p className="font-mono text-xs font-medium tracking-wide text-neutral-400">
                {counterText}
              </p>
              <h4 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-white/95">
                {statusHeadline}
              </h4>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-2.5">
              {isBackingUp && (
                <button
                  type="button"
                  onClick={stopBackup}
                  className="rounded-full bg-[#a8c7fa] px-4 py-1.5 text-xs font-semibold text-[#062e6f] transition-colors hover:bg-[#c2e7ff] active:scale-95">
                  Stop
                </button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                  <Check size={13} strokeWidth={2.5} />
                  <span>Done</span>
                </div>
              )}

              {isCancelled && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                  <AlertCircle size={13} strokeWidth={2} />
                  <span>Stopped</span>
                </div>
              )}

              {queue.length > 1 && (
                <button
                  type="button"
                  onClick={toggleExpanded}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-300 transition-colors hover:text-white">
                  <span>{isExpanded ? "Hide" : "Show more"}</span>
                  {isExpanded ?
                    <ChevronUp size={14} />
                  : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Right Thumbnail preview */}
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-neutral-800 shadow-inner">
            {currentPreviewUrl ?
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPreviewUrl}
                alt="Backing up preview"
                className="size-full object-cover transition-opacity duration-200"
              />
            : <div className="grid size-full place-items-center text-white/40">
                <Loader2 size={24} className="animate-spin" />
              </div>
            }

            {/* Micro badge overlay on thumbnail */}
            {isBackingUp && (
              <span className="absolute right-1 bottom-1 grid size-5 place-items-center rounded-full bg-black/60 backdrop-blur-sm">
                <Loader2
                  size={12}
                  className="animate-spin text-[#a8c7fa]"
                />
              </span>
            )}
            {isCompleted && (
              <span className="absolute right-1 bottom-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-black">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </div>
        </div>

        {/* Expandable Queue Items List */}
        {isExpanded && (
          <div className="max-h-52 border-t border-white/10 bg-black/30 px-4 py-2.5 overflow-y-auto">
            <ul className="space-y-2">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="relative size-7 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white/90">
                        {item.name}
                      </p>
                      {item.error ?
                        <p className="truncate text-[11px] text-red-400">
                          {item.error}
                        </p>
                      : item.status === "uploading" ?
                        <p className="text-[11px] text-[#a8c7fa]">
                          {item.progress}%
                        </p>
                      : null}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {item.status === "pending" && (
                      <Clock size={14} className="text-white/40" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2
                        size={14}
                        className="animate-spin text-[#a8c7fa]"
                      />
                    )}
                    {item.status === "success" && (
                      <Check size={14} className="text-emerald-400" />
                    )}
                    {item.status === "error" && (
                      <X size={14} className="text-red-400" />
                    )}
                    {item.status === "cancelled" && (
                      <span className="text-[11px] text-white/40">Stopped</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Real-time Progress Bar running along the bottom edge */}
        <div className="h-1 w-full overflow-hidden bg-white/10">
          <div
            className={`h-full transition-all duration-200 ease-out ${
              isCompleted
                ? "bg-emerald-400"
                : isCancelled
                  ? "bg-amber-400"
                  : "bg-[#a8c7fa]"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, overallProgress))}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
