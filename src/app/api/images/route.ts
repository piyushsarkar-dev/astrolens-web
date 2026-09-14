import { NextRequest, NextResponse } from "next/server";
import {
  addImage,
  IMGBB_KEY_MISSING_ERROR,
  IMGBB_LOGIN_REQUIRED_ERROR,
  readImages,
  sortImagesNewestFirst,
  uploadImageToImgbb,
} from "@/lib/imgbb";
import { createClient } from "@/lib/supabase/server";
import type { ImageRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/svg+xml",
]);

export async function GET() {
  try {
    // Logged-out visitors see NO photos — login wall.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: [] });
    }
    const images = sortImagesNewestFirst(await readImages(user.id));
    return NextResponse.json({ data: images });
  } catch {
    return NextResponse.json(
      { error: "Failed to load the image gallery." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1) Login required — uploads are per-account.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: IMGBB_LOGIN_REQUIRED_ERROR }, { status: 401 });
    }

    // 2) Each user uploads with their OWN ImgBB key saved in their profile.
    const { data: profile } = await supabase
      .from("profiles")
      .select("imgbb_api_key")
      .eq("id", user.id)
      .maybeSingle();
    const userKey = (profile?.imgbb_api_key as string | null)?.trim() || null;
    if (!userKey) {
      return NextResponse.json({ error: IMGBB_KEY_MISSING_ERROR }, { status: 400 });
    }

    const formData = await request.formData();
    const files = formData
      .getAll("file")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No image file was provided." },
        { status: 400 },
      );
    }

    const uploaded: ImageRecord[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const filename = file.name || "image";
      const mime = file.type || "image/octet-stream";

      if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
        errors.push(`"${filename}": unsupported type "${mime}".`);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const image = await uploadImageToImgbb(
          {
            buffer,
            mime,
            name: filename,
          },
          userKey,
        );
        await addImage(image, user.id);
        uploaded.push({ ...image, ownerId: user.id });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "upload failed";
        errors.push(`"${filename}": ${message}`);
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "None of the images could be uploaded.", errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        data: uploaded,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
