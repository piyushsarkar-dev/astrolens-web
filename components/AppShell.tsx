'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useGallery } from '@/lib/gallery-context';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';
import { UploadPanel } from './UploadPanel';
import { AuthScreen } from './AuthScreen';
import { LoadingScreen } from './LoadingScreen';
import type { GalleryPage } from '@/lib/types';

const PUBLIC_ROUTES = ['/auth', '/reset'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { loadPhotos, loadAlbums } = useGallery();
  const pathname = usePathname();
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r));

  useEffect(() => {
    if (user && !isPublic) {
      loadPhotos(true);
      loadAlbums();
    }
  }, [user, isPublic, loadPhotos, loadAlbums]);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace('/auth');
    }
  }, [loading, user, isPublic, router]);

  if (loading && !isPublic) return <LoadingScreen />;
  if (!user && !isPublic) return <AuthScreen />;
  if (isPublic) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-ink-950 text-ink-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <TopBar onUploadClick={() => setUploadOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
      <MobileNav />
      <UploadPanel open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
