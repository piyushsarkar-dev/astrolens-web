"use client";

import { Heart, Loader2, SquareX, Trash2, X } from "lucide-react";

type AstroSelectionBarProps = {
  /** How many photos are currently selected. */
  selectedCount: number;
  /** Total photos available in the current view (for "Select all"). */
  totalCount: number;
  /** True while a bulk action is talking to the server. */
  isBusy: boolean;
  onFavoriteSelected: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExitSelectMode: () => void;
};

export const AstroSelectionBar = ({
  selectedCount,
  totalCount,
  isBusy,
  onFavoriteSelected,
  onDeleteSelected,
  onSelectAll,
  onClearSelection,
  onExitSelectMode,
}: AstroSelectionBarProps) => {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="border-sky/30 bg-sky/[0.08] animate-in fade-in slide-in-from-top-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-xs text-foreground/80">
      <div className="flex items-center gap-3">
        <span className="text-sky font-semibold">{selectedCount} selected</span>
        <span className="text-foreground/25">|</span>
        <button
          type="button"
          onClick={onSelectAll}
          disabled={allSelected || totalCount === 0}
          className="font-medium text-foreground/60 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
          Select all {totalCount > 0 ? `(${totalCount})` : ""}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          className="font-medium text-foreground/60 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onFavoriteSelected}
          disabled={isBusy || selectedCount === 0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line-subtle bg-foreground/[0.04] px-3 py-1.5 font-medium transition hover:bg-foreground/[0.09] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
          {isBusy ?
            <Loader2
              size={13}
              className="animate-spin"
            />
          : <Heart
              size={13}
              className="text-[#ff2a6d]"
            />
          }
          <span>Favorite</span>
        </button>

        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={isBusy || selectedCount === 0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40">
          {isBusy ?
            <Loader2
              size={13}
              className="animate-spin"
            />
          : <Trash2 size={13} />}
          <span>Delete</span>
        </button>

        <span className="text-foreground/20">|</span>

        <button
          type="button"
          onClick={onExitSelectMode}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line-subtle bg-foreground/[0.04] px-3 py-1.5 font-medium transition hover:bg-foreground/[0.09] hover:text-foreground"
          title="Exit select mode">
          <SquareX size={13} />
          <span>Done</span>
        </button>

        <button
          type="button"
          onClick={onExitSelectMode}
          className="grid size-7 cursor-pointer place-items-center rounded-lg text-foreground/40 transition hover:bg-foreground/10 hover:text-foreground"
          title="Exit select mode">
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
