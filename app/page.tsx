'use client';

import { useState, useMemo } from 'react';
import { useGallery } from '@/lib/gallery-context';
import { useAuth } from '@/lib/auth-context';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoViewer } from '@/components/PhotoViewer';
import { Upload, Images, FolderOpen, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { photos, albums, loading } = useGallery();
  const { profile } = useAuth();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const activePhotos = useMemo(() => photos.filter(p => !p.is_deleted).slice(0, 12), [photos]);
  const favoritesCount = useMemo(() => photos.filter(p => p.is_favorite && !p.is_deleted).length, [photos]);
  const totalCount = useMemo(() => photos.filter(p => !p.is_deleted).length, [photos]);

  const stats = [
    { label: 'Photos', value: totalCount, icon: Images, href: '/photos' },
    { label: 'Albums', value: albums.length, icon: FolderOpen, href: '/albums' },
    { label: 'Favorites', value: favoritesCount, icon: Heart, href: '/favorites' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <p className="text-ink-300 text-sm mb-1">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight">{profile?.name || 'User'}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="glass glass-hover rounded-xl p-4 md:p-5 group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Icon className="w-4 h-4 text-lime" />
                <span className="text-xs text-ink-300 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl md:text-3xl font-semibold tabular-nums">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Photos</h2>
          <Link href="/photos" className="text-xs text-ink-300 hover:text-lime flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <PhotoGrid
          photos={activePhotos}
          loading={loading}
          onPhotoClick={(i) => setViewerIndex(i)}
          groupByDate={false}
          emptyMessage="No photos yet"
          emptyHint="Click Upload to add your first photos"
        />
      </div>

      {viewerIndex !== null && activePhotos[viewerIndex] && (
        <PhotoViewer
          photos={activePhotos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  );
}
