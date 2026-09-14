import type { Metadata } from "next";
import GalleryPage from "@/components/Gallery/GalleryPage";
import { readImages, sortImagesNewestFirst } from "@/lib/imgbb";
import { createClient } from "@/lib/supabase/server";
import type { ImageRecord } from "@/lib/types";

export const metadata: Metadata = {
  title: "Photos — Astro Lens",
  description:
    "A Google Photos-style gallery powered by ImgBB. Upload, browse and sync your photos.",
};

export const dynamic = "force-dynamic";

const HomePage = async () => {
  // Server-side: only the logged-in user's own photos.
  // Logged out → empty gallery (client shows the login wall).
  let initialImages: ImageRecord[] = [];
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      initialImages = sortImagesNewestFirst(await readImages(user.id));
    }
  } catch {
    initialImages = [];
  }

  return <GalleryPage initialImages={initialImages} />;
};

export default HomePage;
