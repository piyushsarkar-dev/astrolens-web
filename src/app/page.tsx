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

type HomePageProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  // ?view=favorites|recents|hidden is used by the header / settings links.
  const params = await searchParams;
  const rawView = params.view;
  const initialView = Array.isArray(rawView) ? rawView[0] : rawView;

  // Server-side: only the logged-in user's own photos.
  // Logged out → empty gallery (client shows the login wall).
  let initialImages: ImageRecord[] = [];
  // true/false = the server confirmed the session; undefined = unknown.
  let initialUser: boolean | undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    initialUser = Boolean(user);
    if (user) {
      initialImages = sortImagesNewestFirst(await readImages(user.id));
    }
  } catch {
    initialImages = [];
  }

  return (
    <GalleryPage
      initialImages={initialImages}
      initialView={initialView}
      initialUser={initialUser}
    />
  );
};

export default HomePage;
