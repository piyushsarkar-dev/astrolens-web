"use client";

import {
  Calendar,
  Camera,
  Check,
  Compass,
  Copy,
  ExternalLink,
  Folder,
  HardDrive,
  Info,
  Layers,
  MapPin,
  Plus,
  Tag,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getResolvedMetadata } from "@/lib/photoMetadata";
import type { ImageRecord } from "@/lib/types";

type PhotoDetailsDrawerProps = {
  image: ImageRecord;
  onClose: () => void;
  onUpdateImage: (updated: ImageRecord) => void;
  onOpenAlbumModal: () => void;
};

export const PhotoDetailsDrawer = ({
  image,
  onClose,
  onUpdateImage,
  onOpenAlbumModal,
}: PhotoDetailsDrawerProps) => {
  const resolved = getResolvedMetadata(image);
  const [newTagInput, setNewTagInput] = useState("");
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [isSavingTag, setIsSavingTag] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleCopyOcr = async () => {
    if (!resolved.ocrText) return;
    try {
      await navigator.clipboard.writeText(resolved.ocrText);
      setCopiedOcr(true);
      toast.success("Extracted text copied to clipboard!");
      setTimeout(() => setCopiedOcr(false), 2000);
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!trimmed) return;
    if (resolved.tags.includes(trimmed)) {
      toast.info("Tag already exists.");
      setNewTagInput("");
      return;
    }

    const updatedTags = [...resolved.tags, trimmed];
    setIsSavingTag(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (!res.ok) throw new Error("Failed to save tag.");
      const json = await res.json();
      if (json.data) {
        onUpdateImage(json.data);
        toast.success(`Tag "${trimmed}" added!`);
      }
      setNewTagInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving tag.");
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = resolved.tags.filter((t) => t !== tagToRemove);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (!res.ok) throw new Error("Failed to remove tag.");
      const json = await res.json();
      if (json.data) {
        onUpdateImage(json.data);
        toast.success(`Tag "${tagToRemove}" removed.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating tags.");
    }
  };

  const hasLocation =
    resolved.location &&
    (resolved.location.name ||
      resolved.location.latitude !== undefined ||
      resolved.location.city);

  const googleMapsUrl =
    resolved.location?.latitude !== undefined &&
    resolved.location?.longitude !== undefined
      ? `https://www.google.com/maps?q=${resolved.location.latitude},${resolved.location.longitude}`
      : null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#141517]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl text-foreground animate-in slide-in-from-right duration-200"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}>
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-sky/15 text-sky">
            <Info size={18} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight text-white">
              Photo Details
            </h3>
            <p className="text-mist text-xs">File details & metadata</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
          title="Close details">
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
        {/* Real File Info Card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium truncate max-w-[240px]">
              {image.title || "Untitled Image"}
            </span>
            <span className="rounded bg-sky/20 px-2 py-0.5 text-[10px] font-semibold text-sky uppercase">
              {image.mime?.split("/")[1] || "JPEG"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-mist border-t border-white/5">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-sky/80" />
              <span>
                {image.width} × {image.height} px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive size={14} className="text-sky/80" />
              <span>{formatFileSize(image.size)}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Calendar size={14} className="text-sky/80" />
              <span>{formatDate(image.uploadedAt)}</span>
            </div>
          </div>
        </div>

        {/* Real EXIF / Camera Section - ONLY IF ACTUALLY PRESENT */}
        {resolved.exif && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
              <Camera size={15} />
              <span>Camera & EXIF</span>
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-2.5 text-xs">
              {resolved.exif.camera && (
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-mist">Camera</span>
                  <span className="text-white font-medium">
                    {resolved.exif.camera}
                  </span>
                </div>
              )}
              {resolved.exif.lens && (
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-mist">Lens</span>
                  <span className="text-white font-medium">
                    {resolved.exif.lens}
                  </span>
                </div>
              )}
              {(resolved.exif.aperture ||
                resolved.exif.shutter ||
                resolved.exif.iso) && (
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5 text-center">
                  {resolved.exif.aperture && (
                    <div className="rounded-xl bg-white/[0.04] p-2">
                      <p className="text-[10px] text-mist">Aperture</p>
                      <p className="font-semibold text-white mt-0.5">
                        {resolved.exif.aperture}
                      </p>
                    </div>
                  )}
                  {resolved.exif.shutter && (
                    <div className="rounded-xl bg-white/[0.04] p-2">
                      <p className="text-[10px] text-mist">Shutter</p>
                      <p className="font-semibold text-white mt-0.5">
                        {resolved.exif.shutter}
                      </p>
                    </div>
                  )}
                  {resolved.exif.iso && (
                    <div className="rounded-xl bg-white/[0.04] p-2">
                      <p className="text-[10px] text-mist">ISO</p>
                      <p className="font-semibold text-white mt-0.5">
                        {resolved.exif.iso}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {resolved.exif.focalLength && (
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-mist">Focal Length</span>
                  <span className="text-white font-medium">
                    {resolved.exif.focalLength}
                  </span>
                </div>
              )}
              {resolved.exif.colorSpace && (
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-mist">Color Space</span>
                  <span className="text-white font-medium">
                    {resolved.exif.colorSpace}
                  </span>
                </div>
              )}
              {resolved.exif.meteringMode && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-mist">Metering</span>
                  <span className="text-white font-medium">
                    {resolved.exif.meteringMode}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real GPS / Location Section - ONLY IF ACTUALLY PRESENT */}
        {hasLocation && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
                <MapPin size={15} />
                <span>Location</span>
              </div>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-sky hover:underline">
                  <span>View Map</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-2.5 text-xs">
              {resolved.location?.name && (
                <div className="flex items-center gap-2 text-white font-medium">
                  <Compass size={14} className="text-sky shrink-0" />
                  <span>{resolved.location.name}</span>
                </div>
              )}
              {resolved.location?.latitude !== undefined && (
                <p className="text-mist text-[11px]">
                  Coordinates: {resolved.location.latitude?.toFixed(4)}°,{" "}
                  {resolved.location.longitude?.toFixed(4)}°
                </p>
              )}
            </div>
          </div>
        )}

        {/* Real OCR Result - ONLY IF ACTUALLY EXTRACTED/PRESENT */}
        {resolved.ocrText && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
                <Copy size={15} />
                <span>Extracted Text (OCR)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyOcr}
                className="inline-flex items-center gap-1 text-[11px] text-sky hover:underline cursor-pointer">
                {copiedOcr ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy text</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5 font-mono text-xs text-white/90 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {resolved.ocrText}
            </div>
          </div>
        )}

        {/* Detected Faces - ONLY IF ACTUALLY PRESENT */}
        {resolved.faces.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
              <User size={15} />
              <span>Detected Faces ({resolved.faces.length})</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {resolved.faces.map((face, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2 text-xs">
                  <span className="grid size-6 place-items-center rounded-full bg-sky/20 text-sky font-bold text-[10px]">
                    {face.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-medium text-white">{face.name}</p>
                    {face.confidence && (
                      <p className="text-[10px] text-mist">
                        {Math.round(face.confidence * 100)}% match
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Tags Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
            <Tag size={15} />
            <span>Tags ({resolved.tags.length})</span>
          </div>

          {resolved.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {resolved.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky/15 px-3 py-1 text-xs font-medium text-sky border border-sky/20">
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="rounded-full hover:bg-sky/30 p-0.5 text-sky transition cursor-pointer"
                    title={`Remove ${t}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mist italic">No tags added yet.</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddTag();
                }
              }}
              placeholder="Add a new tag..."
              className="flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-mist focus:outline-none focus:border-sky"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={isSavingTag || !newTagInput.trim()}
              className="flex items-center gap-1 rounded-xl bg-sky px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky/90 disabled:opacity-50 cursor-pointer">
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* User Album Associations */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
              <Folder size={15} />
              <span>Albums ({resolved.albums.length})</span>
            </div>
            <button
              type="button"
              onClick={onOpenAlbumModal}
              className="inline-flex items-center gap-1 text-[11px] text-sky hover:underline cursor-pointer">
              <Plus size={12} />
              <span>Add to album</span>
            </button>
          </div>

          {resolved.albums.length === 0 ? (
            <p className="text-xs text-mist italic">Not in any album yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resolved.albums.map((alb) => (
                <span
                  key={alb}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <Folder size={13} className="text-amber-400" />
                  <span>{alb}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
