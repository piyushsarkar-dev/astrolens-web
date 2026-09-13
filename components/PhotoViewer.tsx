'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, Heart, Download, Trash2, Share2,
  FolderPlus, ZoomIn, ZoomOut, Info, Loader2, RotateCw, RotateCcw,
} from 'lucide-react';
import { useGallery } from '@/lib/gallery-context';
import { supabase } from '@/lib/supabase-client';
import { formatBytes, formatDate, cn } from '@/lib/format';
import type { Photo } from '@/lib/types';

export function PhotoViewer({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}) {
  const { toggleFavorite, moveToTrash, permanentDelete, albums, addPhotosToAlbum, updatePhoto } = useGallery();
  const [zoomed, setZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  const photo = photos[index];

  const close = useCallback(() => {
    setZoomed(false);
    setRotation(0);
    setShowInfo(false);
    onClose();
  }, [onClose]);

  const next = useCallback(() => {
    setZoomed(false);
    setRotation(0);
    setFullLoaded(false);
    onNavigate((index + 1) % photos.length);
  }, [index, photos.length, onNavigate]);

  const prev = useCallback(() => {
    setZoomed(false);
    setRotation(0);
    setFullLoaded(false);
    onNavigate((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close, next, prev]);

  useEffect(() => {
    if (photo) {
      setTitleValue(photo.title || '');
      setDescValue(photo.description || '');
    }
  }, [photo?.id]);

  const handleDownload = useCallback(async () => {
    if (!photo) return;
    try {
      const res = await fetch(photo.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename || 'photo';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.image_url, '_blank');
    }
  }, [photo]);

  const handleShare = useCallback(async () => {
    if (!photo) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: photo.title || photo.filename, url: photo.image_url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(photo.image_url);
      } catch { /* clipboard blocked */ }
    }
  }, [photo]);

  const handleDelete = useCallback(async () => {
    if (!photo) return;
    await moveToTrash(photo.id);
    close();
  }, [photo, moveToTrash, close]);

  const saveMeta = useCallback(async () => {
    if (!photo) return;
    setSavingMeta(true);
    const { error } = await supabase
      .from('photos')
      .update({ title: titleValue, description: descValue })
      .eq('id', photo.id);
    if (!error) {
      updatePhoto(photo.id, { title: titleValue, description: descValue });
      setEditingTitle(false);
    }
    setSavingMeta(false);
  }, [photo, titleValue, descValue, updatePhoto]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm text-white/80 truncate">{photo.filename}</p>
          <span className="text-xs text-white/40 shrink-0 hidden sm:inline">
            {index + 1} / {photos.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ViewerButton onClick={() => setZoomed(z => !z)} title={zoomed ? 'Zoom out' : 'Zoom in'}>
            {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </ViewerButton>
          <ViewerButton onClick={() => setRotation(r => r - 90)} title="Rotate left">
            <RotateCcw className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={() => setRotation(r => r + 90)} title="Rotate right">
            <RotateCw className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={() => setShowInfo(s => !s)} title="Info">
            <Info className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={() => toggleFavorite(photo.id, photo.is_favorite)} title="Favorite">
            <Heart className={cn('w-5 h-5', photo.is_favorite && 'text-lime fill-lime')} />
          </ViewerButton>
          <ViewerButton onClick={() => setShowAlbumPicker(true)} title="Add to album">
            <FolderPlus className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={handleShare} title="Share">
            <Share2 className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={handleDownload} title="Download">
            <Download className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={handleDelete} title="Move to trash" danger>
            <Trash2 className="w-5 h-5" />
          </ViewerButton>
          <ViewerButton onClick={close} title="Close">
            <X className="w-5 h-5" />
          </ViewerButton>
        </div>
      </div>

      {/* Image area */}
      <div
        className={cn('flex-1 flex items-center justify-center relative overflow-hidden', zoomed && 'overflow-auto cursor-zoom-in')}
        onClick={(e) => { if (e.target === e.currentTarget && !zoomed) close(); }}
      >
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
          {!fullLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={photo.thumbnail_url}
                alt=""
                className="max-w-full max-h-full object-contain blur-sm opacity-40"
              />
              <Loader2 className="absolute w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}
          <img
            src={photo.display_url}
            alt={photo.title || photo.filename}
            onLoad={() => { setFullLoaded(true); setLoadingFull(false); }}
            className={cn(
              'max-w-full max-h-full object-contain transition-opacity duration-300',
              fullLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease, opacity 0.3s ease',
            }}
          />
        </div>

        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm glass-panel border-l border-white/10 p-5 overflow-y-auto animate-slide-right z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Photo Details</h3>
            <button onClick={() => setShowInfo(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70">
              <X className="w-5 h-5" />
            </button>
          </div>

          {editingTitle ? (
            <div className="space-y-3 mb-4">
              <div>
                <label className="label text-white/60">Title</label>
                <input
                  className="input"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  placeholder="Add a title"
                />
              </div>
              <div>
                <label className="label text-white/60">Description</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  value={descValue}
                  onChange={e => setDescValue(e.target.value)}
                  placeholder="Add a description"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveMeta} disabled={savingMeta} className="btn-primary text-xs">
                  {savingMeta ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditingTitle(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm font-medium text-white">{photo.title || 'Untitled'}</p>
              <p className="text-xs text-white/50 mt-1">{photo.description || 'No description'}</p>
              <button onClick={() => setEditingTitle(true)} className="text-xs text-lime mt-2 hover:underline">
                Edit title & description
              </button>
            </div>
          )}

          <dl className="space-y-2.5 text-sm">
            <InfoRow label="Filename" value={photo.filename} />
            <InfoRow label="Type" value={photo.mime_type || '—'} />
            <InfoRow label="Size" value={formatBytes(photo.file_size)} />
            <InfoRow label="Resolution" value={photo.width && photo.height ? `${photo.width} × ${photo.height}` : '—'} />
            <InfoRow label="Uploaded" value={formatDate(photo.created_at)} />
            <InfoRow label="Favorite" value={photo.is_favorite ? 'Yes' : 'No'} />
          </dl>
        </div>
      )}

      {/* Album picker */}
      {showAlbumPicker && (
        <AlbumPickerModal
          photoId={photo.id}
          albums={albums}
          onAdd={async (albumId) => {
            await addPhotosToAlbum(albumId, [photo.id]);
            setShowAlbumPicker(false);
          }}
          onClose={() => setShowAlbumPicker(false)}
        />
      )}
    </div>
  );
}

function ViewerButton({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors',
        danger ? 'text-white/70 hover:text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'
      )}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/40 text-xs uppercase tracking-wider shrink-0">{label}</dt>
      <dd className="text-white/80 text-sm text-right truncate">{value}</dd>
    </div>
  );
}

function AlbumPickerModal({
  photoId,
  albums,
  onAdd,
  onClose,
}: {
  photoId: string;
  albums: { id: string; name: string }[];
  onAdd: (albumId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-panel rounded-2xl p-5 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-4">Add to Album</h3>
        {albums.length === 0 ? (
          <p className="text-sm text-ink-300">No albums yet. Create one from the Albums page.</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {albums.map(album => (
              <button
                key={album.id}
                onClick={() => onAdd(album.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink-700/60 text-sm transition-colors"
              >
                {album.name}
              </button>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-ghost w-full mt-4">Cancel</button>
      </div>
    </div>
  );
}
