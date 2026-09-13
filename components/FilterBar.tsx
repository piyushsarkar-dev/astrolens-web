'use client';

import { ArrowDownWideNarrow, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/format';
import type { SortOption, FilterOption } from '@/lib/types';

const SORTS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'name-az', label: 'Name A-Z' },
  { id: 'name-za', label: 'Name Z-A' },
];

const FILTERS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
  { id: 'trash', label: 'Trash' },
];

export function FilterBar({
  sort,
  filter,
  onSort,
  onFilter,
  total,
}: {
  sort: SortOption;
  filter: FilterOption;
  onSort: (s: SortOption) => void;
  onFilter: (f: FilterOption) => void;
  total: number;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentSort = SORTS.find(s => s.id === sort);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => onFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              filter === f.id
                ? 'bg-ink-700/60 text-ink-50 border border-ink-600/50'
                : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/40 border border-transparent'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-ink-300 hidden sm:inline">{total} photos</span>
        <div ref={ref} className="relative">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-200 hover:text-ink-100 hover:bg-ink-800/40 transition-colors"
          >
            <ArrowDownWideNarrow className="w-3.5 h-3.5" />
            {currentSort?.label}
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 glass-panel rounded-lg py-1 min-w-[140px] animate-scale-in">
              {SORTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onSort(s.id); setSortOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-ink-700/60 transition-colors"
                >
                  {s.label}
                  {sort === s.id && <Check className="w-3.5 h-3.5 text-lime" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
