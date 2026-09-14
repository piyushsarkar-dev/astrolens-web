import { NextRequest, NextResponse } from "next/server";
import {
  addImage,
  getImgbbApiKey,
  readImages,
  sortImagesNewestFirst,
  uploadImageToImgbb,
} from "@/lib/imgbb";
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
    const images = sortImagesNewestFirst(await readImages());
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
    // Fail fast with a clear message when the server-side key is missing.
    getImgbbApiKey();

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
        const image = await uploadImageToImgbb({
          buffer,
          mime,
          name: filename,
        });
        await addImage(image);
        uploaded.push(image);
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
