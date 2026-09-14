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
 * ImgBB provides a self-contained `delete_url` returned at upload time, e.g.:
 *   https://ibb.co/27PLGGYf/e66eda992bf77d30c2d01bdca107cfd6
 *
 * To properly delete from ImgBB (powered by Chevereto), we:
 *   1. GET the delete URL with browser headers to obtain the dynamic `auth_token`
 *      and the `CHV.obj.resource` metadata.
 *   2. POST to `https://ibb.co/json` with action="delete", auth_token, and resource
 *      data. ImgBB then responds with HTTP 200 `{ success: { message: "Image deleted" } }`.
 */
export async function deleteImageFromImgbb(
  deleteUrl: string | null | undefined,
  imageId: string,
  _apiKey?: string,
): Promise<void> {
  const stored = deleteUrl?.trim() || null;
  if (!stored) {
    throw new Error(
      "This photo has no ImgBB delete link — it can only be removed from your gallery view.",
    );
  }

  // Full self-authorizing URL (https://ibb.co/<id>/<deletehash>) or bare deletehash
  const isFullUrl = /^https?:\/\//i.test(stored);
  const fullUrl = isFullUrl
    ? stored
    : `https://ibb.co/${encodeURIComponent(imageId)}/${encodeURIComponent(stored)}`;

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  // Step 1: Fetch the delete page to obtain the auth_token and resource metadata
  let pageRes: Response;
  try {
    pageRes = await fetch(fullUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });
  } catch (err) {
    throw new Error(
      `Could not reach ImgBB: ${err instanceof Error ? err.message : "network error"}`,
    );
  }

  // If already 404, it was already deleted on ImgBB
  if (pageRes.status === 404) {
    return;
  }

  const cookies = pageRes.headers.get("set-cookie") || "";
  const html = await pageRes.text();

  if (
    html.includes("Page not found") ||
    html.includes("That page doesn't exist") ||
    html.includes("The requested page cannot be found")
  ) {
    return;
  }

  // Step 2: Parse PF.obj.config.auth_token and CHV.obj.resource
  const authTokenMatch = html.match(/PF\.obj\.config\.auth_token="([^"]+)"/);
  const authToken = authTokenMatch ? authTokenMatch[1] : null;

  const resourceMatch = html.match(/CHV\.obj\.resource=({[^;]+});/);
  let resource: {
    id?: string;
    type?: string;
    url?: string;
    privacy?: string;
    parent_url?: string;
    hash?: string;
    user?: {
      name?: string;
      username?: string;
      id?: string;
      url?: string;
    };
  } | null = null;

  if (resourceMatch) {
    try {
      resource = JSON.parse(resourceMatch[1]);
    } catch {
      resource = null;
    }
  }

  if (!authToken) {
    throw new Error(
      "Could not obtain ImgBB authorization token from delete page.",
    );
  }

  // Step 3: Send POST to https://ibb.co/json to perform real deletion
  const params = new URLSearchParams();
  params.append("auth_token", authToken);
  params.append("action", "delete");
  params.append("delete", resource?.type || "image");
  params.append("from", "resource");
  if (resource?.user?.id) {
    params.append("owner", resource.user.id);
  }
  params.append("deleting[id]", resource?.id || imageId);
  params.append("deleting[type]", resource?.type || "image");
  if (resource?.url) params.append("deleting[url]", resource.url);
  if (resource?.privacy) params.append("deleting[privacy]", resource.privacy);
  if (resource?.parent_url)
    params.append("deleting[parent_url]", resource.parent_url);
  if (resource?.hash) params.append("deleting[hash]", resource.hash);
  if (resource?.user) {
    if (resource.user.name)
      params.append("deleting[user][name]", resource.user.name);
    if (resource.user.username)
      params.append("deleting[user][username]", resource.user.username);
    if (resource.user.id)
      params.append("deleting[user][id]", resource.user.id);
    if (resource.user.url)
      params.append("deleting[user][url]", resource.user.url);
  }

  const deleteRes = await fetch("https://ibb.co/json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": userAgent,
      Referer: fullUrl,
      Origin: "https://ibb.co",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: params.toString(),
  });

  const deleteJson = (await deleteRes.json().catch(() => null)) as {
    status_code?: number;
    success?: { message?: string; code?: number };
    error?: { message?: string; code?: number } | string;
  } | null;

  if (deleteRes.ok && (deleteJson?.status_code === 200 || deleteJson?.success)) {
    return; // Successfully deleted from ImgBB!
  }

  const errMsg =
    typeof deleteJson?.error === "string"
      ? deleteJson.error
      : deleteJson?.error?.message ||
        `ImgBB returned HTTP ${deleteRes.status} when deleting image.`;

  throw new Error(errMsg);
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
