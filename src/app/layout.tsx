import type { Metadata } from "next";
import Header from "@/components/Header/Header";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { BackupProvider, BackupToaster } from "@/components/Backup";
import { Toaster } from "@/components/shadcnui/sonner";
import { geistMono, inter, jakarta } from "@/lib/fonts";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Astro Lens - Private Photo Vault",
  description: "Secure, private cloud storage and vault for your photography and memories.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  openGraph: {
    title: "Astro Lens - Private Photo Vault",
    description: "Secure, private cloud storage and vault for your photography and memories.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Astro Lens - Private Photo Vault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Astro Lens - Private Photo Vault",
    description: "Secure, private cloud storage and vault for your photography and memories.",
    images: ["/og-image.png"],
  },
};


type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: Readonly<RootLayoutProps>) => {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute={"class"}
          defaultTheme="dark"
          enableSystem={false}>
          <AuthProvider>
            <BackupProvider>
              <Header />

              <main className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
                {children}
              </main>

              <Toaster />
              <BackupToaster />
            </BackupProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
