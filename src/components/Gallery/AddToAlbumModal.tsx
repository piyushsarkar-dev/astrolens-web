"use client";

import { Check, Folder, FolderPlus, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ImageRecord } from "@/lib/types";

type AddToAlbumModalProps = {
  image: ImageRecord;
  availableAlbums?: string[];
  onClose: () => void;
  onUpdateImage: (updated: ImageRecord) => void;
};

export const AddToAlbumModal = ({
  image,
  availableAlbums = [],
  onClose,
  onUpdateImage,
}: AddToAlbumModalProps) => {
  const currentAlbums = image.albums || [];
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Combine known user albums with this photo's albums — no fake presets
  const allAvailableAlbums = Array.from(
    new Set([...currentAlbums, ...availableAlbums]),
  );

  const toggleAlbum = async (albumName: string) => {
    const exists = currentAlbums.includes(albumName);
    const updatedAlbums = exists
      ? currentAlbums.filter((a) => a !== albumName)
      : [...currentAlbums, albumName];

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albums: updatedAlbums }),
      });
      if (!res.ok) throw new Error("Failed to update albums.");
      const json = await res.json();
      if (json.data) {
        onUpdateImage(json.data);
        toast.success(
          exists
            ? `Removed from "${albumName}"`
            : `Added to "${albumName}"!`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating album.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateNewAlbum = async () => {
    const trimmed = newAlbumName.trim();
    if (!trimmed) return;
    if (currentAlbums.includes(trimmed)) {
      toast.info("Photo is already in this album.");
      setNewAlbumName("");
      return;
    }
    await toggleAlbum(trimmed);
    setNewAlbumName("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}>
      <div
        className="w-full max-w-md rounded-3xl bg-vault-low border border-line-subtle p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-foreground"
        onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-sky/15 text-sky">
              <FolderPlus size={20} />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Add to Album
              </h3>
              <p className="text-mist text-xs">Organize your photos</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Album List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {allAvailableAlbums.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-subtle p-6 text-center text-xs text-mist space-y-1">
              <Folder className="mx-auto size-6 text-mist/60" />
              <p className="font-medium text-foreground/80">No albums yet</p>
              <p>Type a name below to create your first album.</p>
            </div>
          ) : (
            allAvailableAlbums.map((albumName) => {
              const isSelected = currentAlbums.includes(albumName);
              return (
                <button
                  key={albumName}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void toggleAlbum(albumName)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium border transition cursor-pointer ${
                    isSelected
                      ? "bg-sky/20 border-sky/40 text-foreground"
                      : "bg-foreground/[0.03] border-line-subtle text-foreground/80 hover:bg-foreground/[0.07]"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Folder
                      size={18}
                      className={isSelected ? "text-sky" : "text-amber-400"}
                    />
                    <span>{albumName}</span>
                  </div>

                  <div
                    className={`grid size-5 place-items-center rounded-full border transition ${
                      isSelected
                        ? "bg-sky border-sky text-white"
                        : "border-line-strong text-transparent"
                    }`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create New Album Input */}
        <div className="pt-2 border-t border-line-subtle space-y-2">
          <p className="text-xs font-semibold text-sky uppercase tracking-wider">
            Create New Album
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateNewAlbum();
                }
              }}
              placeholder="e.g. Vacations, Portfolio..."
              className="flex-1 rounded-xl bg-foreground/[0.05] border border-line-subtle px-3.5 py-2 text-xs text-foreground placeholder:text-mist focus:outline-none focus:border-sky"
            />

            <button
              type="button"
              onClick={handleCreateNewAlbum}
              disabled={!newAlbumName.trim() || isUpdating}
              className="flex items-center gap-1.5 rounded-xl bg-sky px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky/20 hover:bg-sky/90 transition disabled:opacity-50 cursor-pointer">
              <Plus size={14} />
              <span>Create</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
