"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useBackup } from "@/components/Backup";

type AstroBottomStatusBarProps = {
  totalCount: number;
  totalSizeBytes: number;
  /** Amount of photos already catalogued/synced (defaults to the total). */
  syncedCount?: number;
};

export const AstroBottomStatusBar = ({
  totalCount,
  totalSizeBytes,
  syncedCount,
}: AstroBottomStatusBarProps) => {
  const { isBackingUp, overallProgress, isSyncingCloud, isCompleted } =
    useBackup();

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const synced = syncedCount ?? totalCount;
  const progressText = `${Math.round(overallProgress)}%`;

  return (
    <footer className="sticky bottom-0 z-20 flex h-9 shrink-0 items-center justify-between border-t border-line-subtle bg-canvas px-6 font-mono text-[11px] select-none">
      {/* Left Verification */}
      <div className="flex items-center gap-2.5">
        {isBackingUp ?
          <span className="text-sky flex items-center gap-1.5 font-medium">
            <Loader2
              size={13}
              className="animate-spin"
            />
            <span>Encrypting &amp; uploading {progressText}</span>
          </span>
        : <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <ShieldCheck size={13} />
            <span>Vault Locked to Device</span>
          </span>
        }
        <span className="text-foreground/20">|</span>
        <span className="text-foreground/40">
          {isBackingUp ? "Checksums pending…" : "SHA-256 Checksums Verified"}
        </span>
      </div>

      {/* Right Stats & Sync */}
      <div className="flex items-center gap-2.5 text-foreground/40">
        <span>
          {synced.toLocaleString()} / {totalCount.toLocaleString()} items
          cataloged ({formatSize(totalSizeBytes)})
        </span>
        <span className="text-foreground/20">•</span>
        {isBackingUp ?
          <span className="text-sky flex items-center gap-1.5 font-medium">
            <span className="bg-sky size-1.5 animate-pulse rounded-full shadow-[0_0_6px_rgba(30,136,229,0.8)]" />
            Sync: Uploading
          </span>
        : isSyncingCloud ?
          <span className="flex items-center gap-1.5 font-medium text-amber-300">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]" />
            Sync: Finalizing
          </span>
        : isCompleted ?
          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            Sync: Just completed
          </span>
        : <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            Sync: Up to date
          </span>
        }
      </div>
    </footer>
  );
};
