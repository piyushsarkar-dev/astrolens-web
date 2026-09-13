'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGallery } from '@/lib/gallery-context';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoViewer } from '@/components/PhotoViewer';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FolderOpen, Plus, Trash2, Pencil, X, ImageOff } from 'lucide-react';
import { cn } from '@/lib/format';
import type { Album, Photo } from '@/lib/types';

export default function AlbumsPage() {
  const { albums, createAlbum, deleteAlbum, renameAlbum, getAlbumPhotos, loadAlbums } = useGallery();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const openAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setLoadingAlbum(true);
    const p = await getAlbumPhotos(album.id);
    setAlbumPhotos(p);
    setLoadingAlbum(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const { error } = await createAlbum(newName.trim(), newDesc.trim());
    setBusy(false);
    if (!error) {
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    }
  };

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    await renameAlbum(renaming, renameValue.trim());
    setRenaming(null);
    setRenameValue('');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    await deleteAlbum(confirmDelete);
    setBusy(false);
    setConfirmDelete(null);
    if (selectedAlbum?.id === confirmDelete) setSelectedAlbum(null);
  };

  if (selectedAlbum) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="p-2 rounded-lg hover:bg-ink-700/60 text-ink-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">{selectedAlbum.name}</h2>
              <p className="text-sm text-ink-300">{albumPhotos.length} photos</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmDelete(selectedAlbum.id)}
            className="btn-danger text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete album
          </button>
        </div>

        <PhotoGrid
          photos={albumPhotos}
          loading={loadingAlbum}
          onPhotoClick={(i) => setViewerIndex(i)}
          emptyMessage="No photos in this album"
          emptyHint="Add photos from the viewer"
          groupByDate={false}
        />

        {viewerIndex !== null && albumPhotos[viewerIndex] && (
          <PhotoViewer
            photos={albumPhotos}
            index={viewerIndex}
            onClose={() => setViewerIndex(null)}
            onNavigate={setViewerIndex}
          />
        )}

        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete this album?"
          message="The album will be removed but your photos will stay in your gallery."
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Albums</h2>
          <p className="text-sm text-ink-300 mt-0.5">{albums.length} albums</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" />
          New Album
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-ink-800/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-ink-400" />
          </div>
          <p className="text-base font-medium text-ink-100">No albums yet</p>
          <p className="text-sm text-ink-300 mt-1">Create an album to organize your photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {albums.map(album => (
            <div
              key={album.id}
              onClick={() => openAlbum(album)}
              className="group cursor-pointer glass glass-hover rounded-xl overflow-hidden"
            >
              <div className="aspect-square bg-ink-800/40 relative overflow-hidden">
                {album.cover_photo ? (
                  <img
                    src={album.cover_photo.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-ink-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{album.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenaming(album.id); setRenameValue(album.name); }}
                    className="p-1 rounded hover:bg-ink-700 text-ink-300 hover:text-ink-100 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-ink-300 mt-0.5">{album.photo_count ?? 0} photos</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">New Album</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Album name"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <input
                  className="input"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Album description"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreate} disabled={busy || !newName.trim()} className="btn-primary">
                {busy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setRenaming(null)}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">Rename Album</h3>
            <input
              className="input"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setRenaming(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleRename} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
