import Header from "@/components/Header/Header";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { BackupProvider, BackupToaster } from "@/components/Backup";
import { Toaster } from "@/components/shadcnui/sonner";
import { geistMono, inter, jakarta } from "@/lib/fonts";
import { ReactNode } from "react";
import "./globals.css";


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
