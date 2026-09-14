import { NextResponse } from "next/server";
import { syncImages } from "@/lib/imgbb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const images = await syncImages();
    return NextResponse.json({ data: images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync with ImgBB failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
