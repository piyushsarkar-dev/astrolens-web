'use client';

import { useState, useMemo } from 'react';
import { useGallery } from '@/lib/gallery-context';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoViewer } from '@/components/PhotoViewer';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  const { photos, loading, permanentDelete } = useGallery();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [busy, setBusy] = useState(false);

  const trashPhotos = useMemo(() => photos.filter(p => p.is_deleted), [photos]);

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    await permanentDelete(confirmDelete);
    setBusy(false);
    setConfirmDelete(null);
  };

  const handleEmptyTrash = async () => {
    setBusy(true);
    for (const photo of trashPhotos) {
      await permanentDelete(photo.id);
    }
    setBusy(false);
    setConfirmEmpty(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-ink-300" />
            Trash
          </h2>
          <p className="text-sm text-ink-300 mt-0.5">{trashPhotos.length} photos</p>
        </div>
        {trashPhotos.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="btn-danger text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Empty Trash
          </button>
        )}
      </div>

      <PhotoGrid
        photos={trashPhotos}
        loading={loading}
        onPhotoClick={(i) => setViewerIndex(i)}
        emptyMessage="Trash is empty"
        emptyHint="Deleted photos will appear here"
        groupByDate={false}
      />

      {viewerIndex !== null && trashPhotos[viewerIndex] && (
        <PhotoViewer
          photos={trashPhotos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Permanently delete this photo?"
        message="This action cannot be undone. The photo will be removed from ImgBB and your gallery forever."
        confirmLabel="Delete forever"
        danger
        busy={busy}
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={confirmEmpty}
        title={`Empty trash (${trashPhotos.length} photos)?`}
        message="All photos in trash will be permanently deleted. This cannot be undone."
        confirmLabel="Empty trash"
        danger
        busy={busy}
        onConfirm={handleEmptyTrash}
        onCancel={() => setConfirmEmpty(false)}
      />
    </div>
  );
}
