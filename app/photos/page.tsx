'use client';

import { useState, useMemo } from 'react';
import { useGallery } from '@/lib/gallery-context';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoViewer } from '@/components/PhotoViewer';
import { FilterBar } from '@/components/FilterBar';
import type { SortOption, FilterOption } from '@/lib/types';

export default function PhotosPage() {
  const { photos, loading, hasMore, sort, filter, setSort, setFilter, loadPhotos } = useGallery();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const visiblePhotos = useMemo(() => photos, [photos]);

  return (
    <div className="max-w-7xl mx-auto">
      <FilterBar
        sort={sort}
        filter={filter}
        onSort={(s: SortOption) => { setSort(s); loadPhotos(true); }}
        onFilter={(f: FilterOption) => { setFilter(f); loadPhotos(true); }}
        total={visiblePhotos.length}
      />

      <PhotoGrid
        photos={visiblePhotos}
        loading={loading}
        onPhotoClick={(i) => setViewerIndex(i)}
        emptyMessage={
          filter === 'trash' ? 'Trash is empty' :
          filter === 'favorites' ? 'No favorites yet' :
          filter === 'recent' ? 'No recent uploads' :
          'No photos yet'
        }
        emptyHint={
          filter === 'trash' ? 'Deleted photos will appear here' :
          filter === 'favorites' ? 'Heart a photo to see it here' :
          'Click Upload to add photos'
        }
        groupByDate={filter !== 'trash'}
      />

      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button onClick={() => loadPhotos(false)} className="btn-outline">
            Load more
          </button>
        </div>
      )}

      {viewerIndex !== null && visiblePhotos[viewerIndex] && (
        <PhotoViewer
          photos={visiblePhotos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  );
}
