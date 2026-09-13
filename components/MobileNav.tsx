'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Images, FolderOpen, Heart, Trash2, Settings } from 'lucide-react';
import { cn } from '@/lib/format';
import type { GalleryPage } from '@/lib/types';

const NAV: { id: GalleryPage; label: string; icon: typeof Home; href: string }[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'photos', label: 'Photos', icon: Images, href: '/photos' },
  { id: 'albums', label: 'Albums', icon: FolderOpen, href: '/albums' },
  { id: 'favorites', label: 'Favorites', icon: Heart, href: '/favorites' },
  { id: 'trash', label: 'Trash', icon: Trash2, href: '/trash' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-ink-700/50">
      <div className="flex items-center justify-around px-1 py-1.5 no-scrollbar overflow-x-auto">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors shrink-0',
                active ? 'text-lime' : 'text-ink-300'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
