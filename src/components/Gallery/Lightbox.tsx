"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Heart,
  Info,
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { preloadImage } from "@/lib/preloadImage";
import type { ImageEdits, ImageRecord } from "@/lib/types";
import { AddToAlbumModal } from "./AddToAlbumModal";
import { PhotoDetailsDrawer } from "./PhotoDetailsDrawer";
import { PhotoEditorDrawer } from "./PhotoEditorDrawer";

type LightboxProps = {
  images: ImageRecord[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete?: (image: ImageRecord) => Promise<void>;
  onUpdateImage?: (updated: ImageRecord) => void;
};

export const Lightbox = ({
  images,
  index,
  onClose,
  onNavigate,
  onDelete,
  onUpdateImage,
}: LightboxProps) => {
  const currentRecord = images[index];
  const [image, setImage] = useState<ImageRecord>(currentRecord);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drawers & Modals
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);

  // Local visual edits (rotation, flip, color tuning)
  const [edits, setEdits] = useState<ImageEdits>({
    rotation: currentRecord?.edits?.rotation || 0,
    flipH: currentRecord?.edits?.flipH || false,
    flipV: currentRecord?.edits?.flipV || false,
    brightness: currentRecord?.edits?.brightness ?? 100,
    contrast: currentRecord?.edits?.contrast ?? 100,
    saturation: currentRecord?.edits?.saturation ?? 100,
    filter: currentRecord?.edits?.filter || "none",
  });

  // Sync image record when index changes
  useEffect(() => {
    if (currentRecord) {
      setImage(currentRecord);
      setLoading(true);
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setEdits({
        rotation: currentRecord.edits?.rotation || 0,
        flipH: currentRecord.edits?.flipH || false,
        flipV: currentRecord.edits?.flipV || false,
        brightness: currentRecord.edits?.brightness ?? 100,
        contrast: currentRecord.edits?.contrast ?? 100,
        saturation: currentRecord.edits?.saturation ?? 100,
        filter: currentRecord.edits?.filter || "none",
      });
    }
  }, [currentRecord]);

  const go = useCallback(
    (delta: number) => {
      if (images.length === 0) return;
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      onNavigate((index + delta + images.length) % images.length);
    },
    [images.length, index, onNavigate],
  );

  // Preload adjacent images
  useEffect(() => {
    if (images.length === 0) return;
    const nextImg = images[(index + 1) % images.length];
    const prevImg = images[(index - 1 + images.length) % images.length];
    if (nextImg) void preloadImage(nextImg.displayUrl || nextImg.url);
    if (prevImg) void preloadImage(prevImg.displayUrl || prevImg.url);
  }, [images, index]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.key === "Escape") {
        if (isDetailsOpen) setIsDetailsOpen(false);
        else if (isEditorOpen) setIsEditorOpen(false);
        else if (isAlbumModalOpen) setIsAlbumModalOpen(false);
        else onClose();
      }
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "+" || event.key === "=") handleZoom(0.25);
      if (event.key === "-") handleZoom(-0.25);
      if (event.key === "0") handleResetZoom();
      if (event.key === "f" || event.key === "F") handleToggleFavorite();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [go, onClose, isDetailsOpen, isEditorOpen, isAlbumModalOpen]);

  if (!image) return null;

  const src = image.displayUrl || image.url;

  // Zoom helpers
  const handleZoom = (delta: number) => {
    setZoomScale((prev) => {
      const next = Math.min(4, Math.max(0.5, prev + delta));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    handleZoom(delta);
  };

  // Favorite toggle
  const handleToggleFavorite = async () => {
    if (isFavoriting) return;
    const nextStatus = !image.isFavorite;
    setIsFavoriting(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextStatus }),
      });
      if (!res.ok) throw new Error("Could not update favorite status.");
      const json = await res.json();
      if (json.data) {
        setImage(json.data);
        if (onUpdateImage) onUpdateImage(json.data);
        toast.success(
          nextStatus ? "Added to Favorites!" : "Removed from Favorites",
        );
      }
    } catch {
      toast.error("Failed to toggle favorite.");
    } finally {
      setIsFavoriting(false);
    }
  };

  // Download handler
  const handleDownload = async () => {
    try {
      toast.info("Preparing download…");
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const extension = image.mime.split("/")[1] || "jpg";
      a.download = `${image.title || "photo"}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Download started!");
    } catch {
      // Direct link fallback
      const a = document.createElement("a");
      a.href = src;
      a.target = "_blank";
      a.download = image.title || "photo";
      a.click();
    }
  };

  // Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title || "Astro Lens Photo",
          text: `Check out "${image.title || "this photo"}" on Astro Lens!`,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled or fallback
      }
    }
    // Fallback: copy photo link
    try {
      await navigator.clipboard.writeText(src);
      toast.success("Photo direct link copied to clipboard!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    const confirmed = window.confirm(
      `Delete "${image.title || "this photo"}" permanently?\n\nIt will be removed from ImgBB AND your gallery. This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await onDelete(image);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateRecord = (updated: ImageRecord) => {
    setImage(updated);
    if (onUpdateImage) onUpdateImage(updated);
  };

  // Construct CSS filters and transforms from edits
  const filterStyles = [
    `brightness(${edits.brightness ?? 100}%)`,
    `contrast(${edits.contrast ?? 100}%)`,
    `saturate(${edits.saturation ?? 100}%)`,
    edits.filter === "grayscale" ? "grayscale(100%)" : "",
    edits.filter === "sepia" ? "sepia(70%)" : "",
    edits.filter === "vivid" ? "saturate(140%) contrast(110%)" : "",
    edits.filter === "cool" ? "hue-rotate(15deg) saturate(110%)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const transformStyles = `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale}) rotate(${
    edits.rotation || 0
  }deg) scaleX(${edits.flipH ? -1 : 1}) scaleY(${edits.flipV ? -1 : 1})`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.title || "Photo viewer"}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl animate-in fade-in duration-150 select-none overflow-hidden"
      onClick={onClose}>
      {/* Top Glass Control Bar */}
      <header
        className="relative z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-black/40 px-4 sm:px-6 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}>
        {/* Left: Title & Index */}
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-display truncate text-sm font-semibold text-white sm:text-base max-w-[200px] sm:max-w-xs">
            {image.title || "Untitled Photo"}
          </p>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70">
            {index + 1} / {images.length}
          </span>
        </div>

        {/* Right: Actions Suite */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/[0.05] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => handleZoom(-0.25)}
              disabled={zoomScale <= 0.5}
              className="grid size-7 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Zoom out (-)">
              <ZoomOut size={15} />
            </button>
            <span
              onClick={handleResetZoom}
              className="px-1.5 text-[11px] font-mono font-medium text-white/80 cursor-pointer hover:text-white"
              title="Reset Zoom (100%)">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.25)}
              disabled={zoomScale >= 4}
              className="grid size-7 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Zoom in (+)">
              <ZoomIn size={15} />
            </button>
            {zoomScale !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="grid size-7 place-items-center rounded-full text-sky hover:bg-white/10 transition cursor-pointer"
                title="Reset zoom">
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Favorite */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isFavoriting}
            className={`grid size-9 place-items-center rounded-full border transition cursor-pointer ${
              image.isFavorite
                ? "bg-rose-500/20 border-rose-500/40 text-rose-500"
                : "bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            title={image.isFavorite ? "Unfavorite" : "Favorite (F)"}>
            <Heart
              size={17}
              className={image.isFavorite ? "fill-rose-500" : ""}
            />
          </button>

          {/* Add to Album */}
          <button
            type="button"
            onClick={() => setIsAlbumModalOpen(true)}
            className="grid size-9 place-items-center rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Add to Album">
            <FolderPlus size={17} />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="grid size-9 place-items-center rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Share photo">
            <Share2 size={17} />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="grid size-9 place-items-center rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Download full resolution">
            <Download size={17} />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => {
              setIsEditorOpen((prev) => !prev);
              if (isDetailsOpen) setIsDetailsOpen(false);
            }}
            className={`grid size-9 place-items-center rounded-full border transition cursor-pointer ${
              isEditorOpen
                ? "bg-sky text-white border-sky shadow-lg shadow-sky/20"
                : "bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            title="Edit photo (Rotate, Tune, Filters)">
            <SlidersHorizontal size={17} />
          </button>

          {/* Details / Inspector */}
          <button
            type="button"
            onClick={() => {
              setIsDetailsOpen((prev) => !prev);
              if (isEditorOpen) setIsEditorOpen(false);
            }}
            className={`grid size-9 place-items-center rounded-full border transition cursor-pointer ${
              isDetailsOpen
                ? "bg-sky text-white border-sky shadow-lg shadow-sky/20"
                : "bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            title="View Details (EXIF, GPS, OCR, Faces, Tags)">
            <Info size={17} />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="hidden sm:grid size-9 place-items-center rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Toggle fullscreen">
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="grid size-9 place-items-center rounded-full bg-red-500/20 border border-red-500/30 text-rose-300 hover:bg-red-500 hover:text-white transition disabled:opacity-50 cursor-pointer"
              title="Delete photo permanently">
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}

          <div className="h-5 w-[1px] bg-white/15 mx-1" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white/[0.08] text-white hover:bg-white/20 transition cursor-pointer"
            title="Close viewer (Esc)">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main
        className="relative flex flex-1 w-full items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: zoomScale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}>
        {/* Prev Arrow */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="absolute left-4 z-20 grid size-12 place-items-center rounded-full bg-black/50 border border-white/10 text-white shadow-xl hover:bg-black/80 hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Previous photo (←)">
          <ChevronLeft size={28} />
        </button>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <Loader2 size={36} className="text-sky animate-spin opacity-80" />
          </div>
        )}

        {/* The Clean Single Image Viewport */}
        <div
          className="relative flex items-center justify-center transition-transform duration-75 will-change-transform"
          style={{ transform: transformStyles }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={image.id}
            src={src}
            alt={image.title || "Photo"}
            onLoad={() => setLoading(false)}
            draggable={false}
            style={{ filter: filterStyles }}
            className={`max-h-[82vh] w-auto max-w-[94vw] object-contain transition-opacity duration-150 shadow-2xl rounded-lg ${
              loading ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="absolute right-4 z-20 grid size-12 place-items-center rounded-full bg-black/50 border border-white/10 text-white shadow-xl hover:bg-black/80 hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Next photo (→)">
          <ChevronRight size={28} />
        </button>

        {/* Slide-over Details Drawer */}
        {isDetailsOpen && (
          <PhotoDetailsDrawer
            image={image}
            onClose={() => setIsDetailsOpen(false)}
            onUpdateImage={handleUpdateRecord}
            onOpenAlbumModal={() => setIsAlbumModalOpen(true)}
          />
        )}

        {/* Slide-over Editor Drawer */}
        {isEditorOpen && (
          <PhotoEditorDrawer
            image={image}
            edits={edits}
            onEditsChange={setEdits}
            onClose={() => setIsEditorOpen(false)}
            onUpdateImage={handleUpdateRecord}
          />
        )}

        {/* Add To Album Modal */}
        {isAlbumModalOpen && (
          <AddToAlbumModal
            image={image}
            onClose={() => setIsAlbumModalOpen(false)}
            onUpdateImage={handleUpdateRecord}
          />
        )}
      </main>

      {/* Bottom Bar: Thumbnail Bar or Quick Info */}
      <footer
        className="relative z-20 flex h-11 w-full items-center justify-between border-t border-white/10 bg-black/40 px-6 text-xs text-mist backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <span>
            {image.width} × {image.height} px
          </span>
          <span>·</span>
          <span>{image.mime.split("/")[1]?.toUpperCase() || "IMAGE"}</span>
          {image.isFavorite && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <Heart size={12} className="fill-rose-400" />
                Favorite
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {image.albums && image.albums.length > 0 && (
            <span className="hidden sm:inline-block text-white/70">
              Album: {image.albums.join(", ")}
            </span>
          )}
          <span className="text-[11px] text-white/50">
            Click drag to pan · Scroll to zoom
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Lightbox;
