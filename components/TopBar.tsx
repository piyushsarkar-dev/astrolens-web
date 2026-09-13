'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Upload, X } from 'lucide-react';
import { useGallery } from '@/lib/gallery-context';
import { cn } from '@/lib/format';

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/photos': 'Photos',
  '/albums': 'Albums',
  '/favorites': 'Favorites',
  '/trash': 'Trash',
  '/settings': 'Settings',
};

export function TopBar({ onUploadClick }: { onUploadClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { search, setSearch, loadPhotos } = useGallery();
  const [localSearch, setLocalSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        loadPhotos(true);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  const title = TITLES[pathname] || 'Lumen Vault';

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-ink-700/50">
      <div className="flex items-center gap-3 px-4 md:px-8 h-16">
        <h2 className="text-lg font-semibold tracking-tight hidden sm:block">{title}</h2>

        <div className="flex-1 max-w-md mx-auto sm:mx-0 sm:ml-6">
          <div className={cn('relative transition-all', focused && 'scale-[1.01]')}>
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors',
              focused ? 'text-lime' : 'text-ink-300'
            )} />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search photos, albums…"
              className="w-full pl-10 pr-8 py-2.5 text-sm bg-ink-800/50 border border-ink-600/50 rounded-lg focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/10 transition-all placeholder-ink-300"
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(''); setSearch(''); loadPhotos(true); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button onClick={onUploadClick} className="btn-primary shrink-0">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>
    </header>
  );
}
