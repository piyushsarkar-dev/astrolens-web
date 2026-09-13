'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useGallery } from '@/lib/gallery-context';
import { Home, Images, FolderOpen, Heart, Trash2, Settings, LogOut, ImagePlus } from 'lucide-react';
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

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { albums } = useGallery();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-ink-700/50 bg-ink-900/40 backdrop-blur-xl">
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
          <ImagePlus className="w-5 h-5 text-lime" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Lumen Vault</h1>
          <p className="text-[10px] text-ink-300 uppercase tracking-widest">Personal Gallery</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-ink-700/60 text-ink-50 border border-ink-600/50'
                  : 'text-ink-200 hover:text-ink-50 hover:bg-ink-800/40 border border-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-lime' : 'text-ink-300')} />
              {item.label}
              {item.id === 'albums' && albums.length > 0 && (
                <span className="ml-auto text-xs text-ink-300">{albums.length}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-ink-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-sm font-medium text-ink-100 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile?.name || profile?.email || '?').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-ink-300 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-200 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
