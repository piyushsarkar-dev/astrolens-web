import type { Metadata } from "next";
import GalleryPage from "@/components/Gallery/GalleryPage";
import { readImages, sortImagesNewestFirst } from "@/lib/imgbb";

export const metadata: Metadata = {
  title: "Photos — Astro Lens",
  description:
    "A Google Photos-style gallery powered by ImgBB. Upload, browse and sync your photos.",
};

export const dynamic = "force-dynamic";

const HomePage = async () => {
  const images = sortImagesNewestFirst(await readImages());

  return <GalleryPage initialImages={images} />;
};

export default HomePage;
