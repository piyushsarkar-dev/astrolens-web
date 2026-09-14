"use client";

import {
  Folder,
  FolderPlus,
  Heart,
  Images,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type SidebarView =
  | { type: "all" }
  | { type: "favorites" }
  | { type: "album"; name: string };

type AppSidebarProps = {
  activeView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  allPhotosCount: number;
  favoritesCount: number;
  albums: Array<{ name: string; count: number }>;
  onCreateAlbum: (name: string) => void;
};

export const AppSidebar = ({
  activeView,
  onSelectView,
  allPhotosCount,
  favoritesCount,
  albums,
  onCreateAlbum,
}: AppSidebarProps) => {
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumInput, setNewAlbumInput] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAlbumInput.trim();
    if (!trimmed) return;
    if (albums.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`Album "${trimmed}" already exists.`);
      setIsCreatingAlbum(false);
      setNewAlbumInput("");
      onSelectView({ type: "album", name: trimmed });
      return;
    }
    onCreateAlbum(trimmed);
    setNewAlbumInput("");
    setIsCreatingAlbum(false);
    onSelectView({ type: "album", name: trimmed });
    toast.success(`Album "${trimmed}" created!`);
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 self-start space-y-6">
      {/* Main Nav Items (shadcn style) */}
      <nav className="space-y-1">
        {/* All Photos */}
        <button
          type="button"
          onClick={() => onSelectView({ type: "all" })}
          className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer ${
            activeView.type === "all"
              ? "bg-foreground/[0.08] text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
          }`}>
          <div className="flex items-center gap-3">
            <Images
              size={18}
              className={activeView.type === "all" ? "text-sky" : ""}
            />
            <span>Photos</span>
          </div>
          <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {allPhotosCount}
          </span>
        </button>

        {/* Favorites */}
        <button
          type="button"
          onClick={() => onSelectView({ type: "favorites" })}
          className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer ${
            activeView.type === "favorites"
              ? "bg-rose-500/10 text-rose-400 font-semibold shadow-sm"
              : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
          }`}>
          <div className="flex items-center gap-3">
            <Heart
              size={18}
              className={
                activeView.type === "favorites"
                  ? "text-rose-500 fill-rose-500"
                  : "text-rose-400/80"
              }
            />
            <span>Favorites</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              activeView.type === "favorites"
                ? "bg-rose-500/20 text-rose-400"
                : "bg-foreground/[0.06] text-muted-foreground"
            }`}>
            {favoritesCount}
          </span>
        </button>
      </nav>

      {/* Albums Section */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between px-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Albums
          </span>
          <button
            type="button"
            onClick={() => setIsCreatingAlbum((prev) => !prev)}
            className="grid size-6 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground transition cursor-pointer"
            title="Create new album">
            <Plus size={15} />
          </button>
        </div>

        {/* Create Album Form */}
        {isCreatingAlbum && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-2 rounded-xl bg-foreground/[0.03] border border-border/50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              autoFocus
              value={newAlbumInput}
              onChange={(e) => setNewAlbumInput(e.target.value)}
              placeholder="Album title..."
              className="w-full rounded-lg bg-background border border-border px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingAlbum(false);
                  setNewAlbumInput("");
                }}
                className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-foreground/[0.06]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newAlbumInput.trim()}
                className="rounded-lg bg-sky px-2.5 py-1 text-[11px] font-semibold text-white transition disabled:opacity-40">
                Create
              </button>
            </div>
          </form>
        )}

        {/* Album List */}
        <div className="space-y-0.5">
          {albums.length === 0 && !isCreatingAlbum ? (
            <div className="px-3.5 py-3 text-xs text-muted-foreground/70 italic">
              No albums created yet.
            </div>
          ) : (
            albums.map((album) => {
              const isSelected =
                activeView.type === "album" && activeView.name === album.name;
              return (
                <button
                  key={album.name}
                  type="button"
                  onClick={() =>
                    onSelectView({ type: "album", name: album.name })
                  }
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-foreground/[0.08] text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                  }`}>
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder
                      size={15}
                      className={isSelected ? "text-sky" : "text-amber-400"}
                    />
                    <span className="truncate">{album.name}</span>
                  </div>
                  <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                    {album.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
