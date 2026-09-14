import { promises as fs } from "node:fs";
import path from "node:path";
import type { ImageRecord } from "./types";

const IMGBB_API_BASE = "https://api.imgbb.com/1";
const IMGBB_MAX_FILE_SIZE = 32 * 1024 * 1024; // 32 MB per ImgBB docs

const STORE_FILE = path.join(process.cwd(), "data", "images.json");

export const IMGBB_KEY_MISSING_ERROR =
  "ImgBB API key is not configured. Add IMGBB_API_KEY to your .env.local file " +
  "(get a key at https://imgbb.com/account/api).";

export const IMGBB_MAX_FILE_SIZE_ERROR =
  "Image exceeds the 32 MB limit allowed by ImgBB.";

export function getImgbbApiKey(): string {
  const key = process.env.IMGBB_API_KEY?.trim();
  if (!key) {
    throw new Error(IMGBB_KEY_MISSING_ERROR);
  }
  return key;
}

type ImgbbImageData = {
  id: string;
  title?: string;
  url_viewer?: string;
  url?: string;
  display_url?: string;
  width?: string | number;
  height?: string | number;
  size?: string | number;
  time?: string | number;
  expiration?: string | number;
  image?: {
    filename?: string;
    name?: string;
    mime?: string;
    extension?: string;
    url?: string;
  };
  thumb?: {
    filename?: string;
    name?: string;
    mime?: string;
    extension?: string;
    url?: string;
  };
  delete_url?: string | null;
};

type ImgbbUploadResponse = {
  data?: ImgbbImageData;
  success?: boolean;
  status?: number;
  error?: { message?: string; code?: number } | string;
};

export function extractDeleteToken(
  deleteUrl: string | null | undefined,
): string | null {
  if (!deleteUrl || deleteUrl === "undefined") return null;
  const segments = deleteUrl.split("/").filter(Boolean);
  const token = segments.at(-1);
  return token && token.length > 6 ? token : null;
}

export function normalizeImgbbImage(data: ImgbbImageData): ImageRecord {
  const now = Date.now();
  const timeSeconds = Number(data.time) || Math.floor(now / 1000);
  const uploadedAt = timeSeconds > 1e12 ? timeSeconds : timeSeconds * 1000;
  const expirationSeconds = Number(data.expiration) || 0;
  const mainUrl = data.url || data.display_url || "";

  return {
    id: data.id,
    title: data.title || data.image?.name || "Untitled",
    url: mainUrl,
    displayUrl: data.display_url || mainUrl,
    thumbUrl: data.thumb?.url || data.display_url || mainUrl,
    width: Number(data.width) || 0,
    height: Number(data.height) || 0,
    size: Number(data.size) || 0,
    mime: data.image?.mime || "image/unknown",
    deleteToken: extractDeleteToken(data.delete_url),
    uploadedAt,
    expiresAt:
      expirationSeconds > 0 ? uploadedAt + expirationSeconds * 1000 : null,
    source: "imgbb",
    managed: Boolean(data.delete_url),
  };
}

export type UploadFile = {
  buffer: Buffer;
  mime: string;
  name: string;
};

export async function uploadImageToImgbb(
  file: UploadFile,
): Promise<ImageRecord> {
  const key = getImgbbApiKey();

  if (file.buffer.byteLength > IMGBB_MAX_FILE_SIZE) {
    throw new Error(IMGBB_MAX_FILE_SIZE_ERROR);
  }

  const formData = new FormData();
  formData.append("image", file.buffer.toString("base64"));
  if (file.name) {
    formData.append("name", file.name.replace(/\.[^.]+$/, ""));
  }

  const response = await fetch(
    `${IMGBB_API_BASE}/upload?key=${encodeURIComponent(key)}`,
    { method: "POST", body: formData },
  );

  let json: ImgbbUploadResponse;
  try {
    json = (await response.json()) as ImgbbUploadResponse;
  } catch {
    throw new Error(
      `ImgBB returned an invalid response (HTTP ${response.status}).`,
    );
  }

  if (!response.ok || !json?.success || !json.data) {
    const message =
      typeof json?.error === "string" ? json.error : json?.error?.message;
    throw new Error(
      message || `ImgBB upload failed (HTTP ${response.status}).`,
    );
  }

  const image = normalizeImgbbImage(json.data);
  if (!image.url) {
    throw new Error("ImgBB did not return an image URL.");
  }
  return image;
}

// ---------------------------------------------------------------------------
// Local registry — records every image uploaded through this app so the
// gallery keeps showing "old" photos. The public ImgBB API v1 only documents
// the upload endpoint, so this file is the sync source of truth. When ImgBB
// exposes a list endpoint we merge it in (see syncImages below).
// ---------------------------------------------------------------------------

export async function readImages(): Promise<ImageRecord[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImageRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeImages(images: ImageRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(
    STORE_FILE,
    JSON.stringify(images, null, 2) + "\n",
    "utf8",
  );
}

export async function addImage(image: ImageRecord): Promise<ImageRecord> {
  const images = await readImages();
  const existingIndex = images.findIndex((item) => item.id === image.id);
  if (existingIndex >= 0) {
    images[existingIndex] = image;
  } else {
    images.unshift(image);
  }
  await writeImages(images);
  return image;
}

export async function getImageById(id: string): Promise<ImageRecord | null> {
  const images = await readImages();
  const slug = id.toLowerCase();
  return (
    images.find((item) => item.id.toLowerCase() === slug) ||
    images.find((item) => item.displayUrl.toLowerCase().endsWith(`/${slug}`)) ||
    null
  );
}

export function sortImagesNewestFirst(images: ImageRecord[]): ImageRecord[] {
  return [...images].sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0));
}

/**
 * Best-effort sync: tries the (undocumented) ImgBB image-list endpoint and
 * merges anything it returns into the local registry. When ImgBB has no such
 * endpoint (the public API v1 only documents upload), it gracefully falls back
 * to the local registry of previously uploaded images.
 */
export async function syncImages(): Promise<ImageRecord[]> {
  const registry = await readImages();
  let remote: ImageRecord[] = [];

  try {
    const key = getImgbbApiKey();
    const response = await fetch(
      `${IMGBB_API_BASE}/images?key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );

    if (response.ok) {
      const json: unknown = await response.json();
      const list =
        Array.isArray(json) ? json : (json as { data?: unknown })?.data;
      if (Array.isArray(list)) {
        remote = list
          .filter(
            (item): item is ImgbbImageData =>
              Boolean(item) && typeof item === "object",
          )
          .map(normalizeImgbbImage)
          .filter((item) => item.id && item.url);
      }
    }
  } catch {
    // ImgBB does not publicly expose a list endpoint; fall back to registry.
    remote = [];
  }

  const byId = new Map<string, ImageRecord>();
  for (const image of [...remote, ...registry]) {
    byId.set(image.id, image);
  }
  const merged = [...byId.values()];

  if (remote.length > 0 && merged.length !== registry.length) {
    await writeImages(merged);
  }

  return sortImagesNewestFirst(merged);
}
