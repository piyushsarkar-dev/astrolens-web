'use client';

import { useState, useMemo } from 'react';
import { useGallery } from '@/lib/gallery-context';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoViewer } from '@/components/PhotoViewer';

export default function FavoritesPage() {
  const { photos, loading } = useGallery();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const favorites = useMemo(() => photos.filter(p => p.is_favorite && !p.is_deleted), [photos]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Favorites</h2>
        <p className="text-sm text-ink-300 mt-0.5">{favorites.length} photos</p>
      </div>

      <PhotoGrid
        photos={favorites}
        loading={loading}
        onPhotoClick={(i) => setViewerIndex(i)}
        emptyMessage="No favorites yet"
        emptyHint="Heart a photo to see it here"
        groupByDate={true}
      />

      {viewerIndex !== null && favorites[viewerIndex] && (
        <PhotoViewer
          photos={favorites}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  );
}
