import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { GalleryProvider } from '@/lib/gallery-context';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Lumen Vault — Personal Photo Gallery',
  description: 'A clean, modern, personal photo gallery. Upload, organize, and share your photos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <GalleryProvider>
            <AppShell>{children}</AppShell>
          </GalleryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
