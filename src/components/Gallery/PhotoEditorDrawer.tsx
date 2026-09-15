"use client";

import {
  Check,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ImageEdits, ImageRecord } from "@/lib/types";

type PhotoEditorDrawerProps = {
  image: ImageRecord;
  edits: ImageEdits;
  onEditsChange: (edits: ImageEdits) => void;
  onClose: () => void;
  onUpdateImage: (updated: ImageRecord) => void;
};

const FILTER_PRESETS: Array<{ id: NonNullable<ImageEdits["filter"]>; label: string }> = [
  { id: "none", label: "Original" },
  { id: "vivid", label: "Vivid" },
  { id: "grayscale", label: "B&W" },
  { id: "sepia", label: "Warm" },
  { id: "cool", label: "Cool" },
];

export const PhotoEditorDrawer = ({
  image,
  edits,
  onEditsChange,
  onClose,
  onUpdateImage,
}: PhotoEditorDrawerProps) => {
  const [saving, setSaving] = useState(false);

  const handleRotate = (delta: number) => {
    const current = edits.rotation || 0;
    const next = (current + delta + 360) % 360;
    onEditsChange({ ...edits, rotation: next });
  };

  const handleFlipH = () => {
    onEditsChange({ ...edits, flipH: !edits.flipH });
  };

  const handleFlipV = () => {
    onEditsChange({ ...edits, flipV: !edits.flipV });
  };

  const handleReset = () => {
    const defaultEdits: ImageEdits = {
      rotation: 0,
      flipH: false,
      flipV: false,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      filter: "none",
    };
    onEditsChange(defaultEdits);
    toast.info("All adjustments reset to default.");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
      });
      if (!res.ok) throw new Error("Failed to save adjustments.");
      const json = await res.json();
      if (json.data) {
        onUpdateImage(json.data);
        toast.success("Photo edits saved successfully!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving edits.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-vault-low/95 backdrop-blur-2xl border-l border-line-subtle shadow-2xl text-foreground animate-in slide-in-from-right duration-200"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-subtle px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-sky/15 text-sky">
            <SlidersHorizontal size={18} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight text-foreground">
              Edit Photo
            </h3>
            <p className="text-mist text-xs">Transform & Tune</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition cursor-pointer"
          title="Close editor">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
        {/* Transform Tools */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky">
            Orientation & Transform
          </p>

          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] p-3 text-foreground border border-line-subtle transition cursor-pointer"
              title="Rotate Left 90°">
              <RotateCcw size={18} />
              <span className="text-[10px] text-mist">-90°</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotate(90)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] p-3 text-foreground border border-line-subtle transition cursor-pointer"
              title="Rotate Right 90°">
              <RotateCw size={18} />
              <span className="text-[10px] text-mist">+90°</span>
            </button>

            <button
              type="button"
              onClick={handleFlipH}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 border transition cursor-pointer ${
                edits.flipH
                  ? "bg-sky/20 border-sky text-sky font-semibold"
                  : "bg-foreground/[0.04] hover:bg-foreground/[0.08] border-line-subtle text-foreground"
              }`}
              title="Flip Horizontal">
              <FlipHorizontal size={18} />
              <span className="text-[10px] text-mist">Flip H</span>
            </button>

            <button
              type="button"
              onClick={handleFlipV}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 border transition cursor-pointer ${
                edits.flipV
                  ? "bg-sky/20 border-sky text-sky font-semibold"
                  : "bg-foreground/[0.04] hover:bg-foreground/[0.08] border-line-subtle text-foreground"
              }`}
              title="Flip Vertical">
              <FlipVertical size={18} />
              <span className="text-[10px] text-mist">Flip V</span>
            </button>
          </div>
        </div>

        {/* Adjustments Sliders */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky">
            Light & Color Adjustments
          </p>

          {/* Brightness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-mist">Brightness</span>
              <span className="text-foreground font-mono">{edits.brightness ?? 100}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={edits.brightness ?? 100}
              onChange={(e) =>
                onEditsChange({ ...edits, brightness: Number(e.target.value) })
              }
              className="w-full accent-sky h-1.5 bg-foreground/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-mist">Contrast</span>
              <span className="text-foreground font-mono">{edits.contrast ?? 100}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={edits.contrast ?? 100}
              onChange={(e) =>
                onEditsChange({ ...edits, contrast: Number(e.target.value) })
              }
              className="w-full accent-sky h-1.5 bg-foreground/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-mist">Saturation</span>
              <span className="text-foreground font-mono">{edits.saturation ?? 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={edits.saturation ?? 100}
              onChange={(e) =>
                onEditsChange({ ...edits, saturation: Number(e.target.value) })
              }
              className="w-full accent-sky h-1.5 bg-foreground/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Filter Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky">
            <Wand2 size={14} />
            <span>Preset Filters</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {FILTER_PRESETS.map((f) => {
              const active = (edits.filter || "none") === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onEditsChange({ ...edits, filter: f.id })}
                  className={`rounded-xl px-3 py-2 text-xs font-medium border transition text-center cursor-pointer ${
                    active
                      ? "bg-sky text-white border-sky shadow-md shadow-sky/20"
                      : "bg-foreground/[0.04] text-foreground/80 border-line-subtle hover:bg-foreground/[0.08]"
                  }`}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-line-subtle p-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-foreground/70 hover:bg-foreground/10 transition cursor-pointer">
          <Undo2 size={15} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full bg-sky px-5 py-2 text-xs font-semibold text-white shadow-md shadow-sky/25 hover:bg-sky/90 transition disabled:opacity-50 cursor-pointer">
          <Check size={15} />
          <span>{saving ? "Saving…" : "Save Changes"}</span>
        </button>
      </div>
    </aside>
  );
};
