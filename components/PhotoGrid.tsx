'use client';

import { useMemo } from 'react';
import { PhotoCard } from './PhotoCard';
import { groupByMonth } from '@/lib/format';
import type { Photo } from '@/lib/types';

export function PhotoGrid({
  photos,
  loading,
  onPhotoClick,
  emptyMessage = 'No photos yet',
  emptyHint = 'Upload photos to get started',
  groupByDate = true,
}: {
  photos: Photo[];
  loading: boolean;
  onPhotoClick: (index: number) => void;
  emptyMessage?: string;
  emptyHint?: string;
  groupByDate?: boolean;
}) {
  const groups = useMemo(() => (groupByDate ? groupByMonth(photos) : [{ label: '', items: photos }]), [photos, groupByDate]);

  if (loading && photos.length === 0) {
    return <GridSkeleton />;
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ink-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.284 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.284 0l2.909 2.909M3.75 3.75h16.5a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z" />
          </svg>
        </div>
        <p className="text-base font-medium text-ink-100">{emptyMessage}</p>
        <p className="text-sm text-ink-300 mt-1">{emptyHint}</p>
      </div>
    );
  }

  let runningIndex = 0;
  return (
    <div className="space-y-8">
      {groups.map(group => {
        const startIndex = runningIndex;
        runningIndex += group.items.length;
        return (
          <div key={group.label || 'all'}>
            {group.label && (
              <h3 className="text-sm font-medium text-ink-200 mb-3 sticky top-0 z-10 bg-ink-950/80 backdrop-blur-sm py-2 -mx-1 px-1">
                {group.label}
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {group.items.map((photo, i) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => onPhotoClick(startIndex + i)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="skeleton rounded-xl aspect-square"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}
