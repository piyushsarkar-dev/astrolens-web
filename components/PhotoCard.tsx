'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/format';
import type { Photo } from '@/lib/types';

export function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const aspect = photo.width && photo.height
    ? `${photo.width} / ${photo.height}`
    : '1 / 1';

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-ink-800/40 border border-ink-700/30 transition-all duration-300 hover:border-ink-500/50 hover:shadow-2xl hover:shadow-black/40"
      style={{ aspectRatio: aspect }}
    >
      {!loaded && !errored && (
        <div className="absolute inset-0 skeleton" />
      )}

      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-800">
          <span className="text-xs text-ink-400">Failed to load</span>
        </div>
      ) : (
        <img
          src={photo.thumbnail_url}
          alt={photo.title || photo.filename}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-all duration-500',
            loaded ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0'
          )}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {photo.is_favorite && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-lime fill-lime" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-xs text-white/90 truncate font-medium">
          {photo.title || photo.filename}
        </p>
      </div>
    </div>
  );
}
