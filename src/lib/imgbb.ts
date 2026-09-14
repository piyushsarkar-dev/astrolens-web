import { promises as fs } from "node:fs";
import path from "node:path";
import type { ImageRecord } from "./types";

const IMGBB_API_BASE = "https://api.imgbb.com/1";
const IMGBB_MAX_FILE_SIZE = 32 * 1024 * 1024; // 32 MB per ImgBB docs

const STORE_FILE = path.join(process.cwd(), "data", "images.json");

export const IMGBB_KEY_MISSING_ERROR =
  "No ImgBB API key found for your account. Open your Profile page and save your personal ImgBB API key first (get one at https://api.imgbb.com).";

export const IMGBB_LOGIN_REQUIRED_ERROR =
  "Please log in to upload photos. Each account uses its own personal ImgBB API key.";

export const IMGBB_MAX_FILE_SIZE_ERROR =
  "Image exceeds the 32 MB limit allowed by ImgBB.";

// Legacy server-wide fallback (optional). Per-user profile keys take priority.
export function getServerFallbackApiKey(): string | null {
  const key = process.env.IMGBB_API_KEY?.trim();
  return key || null;
}

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
  // ImgBB returns a self-contained `delete_url` like
  //   https://ibb.co/c3VRs4x/b3072de2f5287a39f81c7dec3cd8a236
  // A plain GET on that exact URL deletes the image (no API key needed).
  if (!deleteUrl || deleteUrl === "undefined") return null;
  return deleteUrl;
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
  apiKey?: string,
): Promise<ImageRecord> {
  const key = apiKey?.trim() || getImgbbApiKey();

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

/**
 * Delete an image from ImgBB.
 *
 * ImgBB never documents this. The only thing that works is a plain GET on the
 * `delete_url` it returns at upload time, e.g.:
 *   https://ibb.co/c3VRs4x/b3072de2f5287a39f81c7dec3cd8a236
 * That URL is self-authorizing, so:
 *   - no `key=` query param is needed (passing it yields "Invalid API action"),
 *   - the host must be `ibb.co/<id>/<deletehash>`, NOT api.imgbb.com (which
 *     answers "Invalid API v1 key").
 *
 * For older registry rows that only stored the bare `deletehash` (no full URL),
 * we rebuild the delete URL as `https://ibb.co/{imageId}/{deletehash}`.
 */
export async function deleteImageFromImgbb(
  deleteUrl: string | null | undefined,
  imageId: string,
  apiKey?: string,
): Promise<void> {
  const stored = deleteUrl?.trim() || null;
  if (!stored) {
    throw new Error(
      "This photo has no ImgBB delete link — it can only be removed from your gallery view.",
    );
  }

  // Full self-authorizing URL (https://ibb.co/<id>/<deletehash>) — or just the
  // bare deletehash for registry rows written by older versions of the app.
  const isFullUrl = /^https?:\/\//i.test(stored);
  const hash = isFullUrl ? stored.split("/").filter(Boolean).at(-1) ?? "" : stored;
  const fullUrl = isFullUrl
    ? stored
    : `https://ibb.co/${encodeURIComponent(imageId)}/${encodeURIComponent(stored)}`;

  const attempts: string[] = [fullUrl];
  if (apiKey) {
    // Fallback endpoint used by several ImgBB integrations.
    attempts.push(
      `${IMGBB_API_BASE}/delete/${encodeURIComponent(hash)}?key=${encodeURIComponent(apiKey)}`,
    );
  }

  let lastError = "";
  for (const url of attempts) {
    try {
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      if (response.ok) return; // 302 → 200 success page / 200 JSON
      let detail = "";
      try {
        const json = (await response.json()) as
          | { error?: { message?: string } | string }
          | null;
        detail =
          typeof json?.error === "string" ? json.error : json?.error?.message ?? "";
      } catch {
        detail = (await response.text().catch(() => "")).slice(0, 160);
      }
      lastError = detail || `HTTP ${response.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "network error";
    }
  }

  throw new Error(
    lastError || "ImgBB refused to delete this photo. Please try again.",
  );
}

// ---------------------------------------------------------------------------
// Local registry — records every image uploaded through this app so the
// gallery keeps showing "old" photos. The public ImgBB API v1 only documents
// the upload endpoint, so this file is the sync source of truth. When ImgBB
// exposes a list endpoint we merge it in (see syncImages below).
// Each record carries `ownerId` (Supabase user id) so "/" only shows the
// logged-in user's own photos. `null` = legacy photo from before accounts.
// ---------------------------------------------------------------------------

export async function readImages(ownerId?: string | null): Promise<ImageRecord[]> {
  let images: ImageRecord[] = [];
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    images = Array.isArray(parsed) ? (parsed as ImageRecord[]) : [];
  } catch {
    return [];
  }
  if (ownerId === undefined) return images;
  return images.filter((item) => (item.ownerId ?? null) === (ownerId ?? null));
}

async function writeImages(images: ImageRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(
    STORE_FILE,
    JSON.stringify(images, null, 2) + "\n",
    "utf8",
  );
}

export async function addImage(
  image: ImageRecord,
  ownerId?: string | null,
): Promise<ImageRecord> {
  const owned: ImageRecord =
    ownerId === undefined ? image : { ...image, ownerId: ownerId ?? null };
  const images = await readImages();
  const existingIndex = images.findIndex((item) => item.id === owned.id);
  if (existingIndex >= 0) {
    // Never let one user steal another user's photo record.
    const existing = images[existingIndex];
    if (
      existing.ownerId != null &&
      owned.ownerId != null &&
      existing.ownerId !== owned.ownerId
    ) {
      return existing;
    }
    images[existingIndex] = owned;
  } else {
    images.unshift(owned);
  }
  await writeImages(images);
  return owned;
}

export async function getImageById(
  id: string,
  ownerId?: string | null,
): Promise<ImageRecord | null> {
  const images = await readImages(ownerId);
  const slug = id.toLowerCase();
  return (
    images.find((item) => item.id.toLowerCase() === slug) ||
    images.find((item) => item.displayUrl.toLowerCase().endsWith(`/${slug}`)) ||
    null
  );
}

/** Remove an image record from the registry (after deleting on ImgBB). */
export async function removeImage(
  id: string,
  ownerId?: string | null,
): Promise<void> {
  const all = await readImages();
  const kept = all.filter(
    (item) =>
      !(
        item.id.toLowerCase() === id.toLowerCase() &&
        (ownerId === undefined || (item.ownerId ?? null) === (ownerId ?? null))
      ),
  );
  await writeImages(kept);
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
export async function syncImages(
  apiKey?: string,
  ownerId?: string | null,
): Promise<ImageRecord[]> {
  const registry = await readImages(ownerId);
  let remote: ImageRecord[] = [];

  try {
    const key = apiKey?.trim() || getServerFallbackApiKey() || getImgbbApiKey();
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
          .filter((item) => item.id && item.url)
          .map((item) =>
            ownerId === undefined ? item : { ...item, ownerId: ownerId ?? null },
          );
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
    // Persist merged list without leaking other users' photos:
    // keep all records of OTHER owners untouched, rewrite only our scope.
    if (ownerId === undefined) {
      await writeImages(merged);
    } else {
      const all = await readImages();
      const others = all.filter(
        (item) => (item.ownerId ?? null) !== (ownerId ?? null),
      );
      await writeImages([...merged, ...others]);
    }
  }

  return sortImagesNewestFirst(merged);
}
