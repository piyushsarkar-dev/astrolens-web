import type { ImageRecord } from "./types";

/**
 * Extracts a human-readable filename from a URL's last path segment.
 * Returns null when the URL is absent or has no usable segment.
 */
function extractFilenameFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const parts = url.split("/");
  const segment = parts[parts.length - 1];
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Produces searchable date tokens from an upload timestamp.
 *
 * Every token is derived from the real `uploadedAt` value — no fabricated
 * dates are ever invented. Returns an empty array when the timestamp is
 * missing or invalid.
 */
function formatDateTokens(timestamp: number): string[] {
  if (!timestamp) return [];
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return [];

  return [
    // e.g. "September 15, 2026"
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    // e.g. "September 2026"
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    }),
    // Full English month name (e.g. "September")
    date.toLocaleString("en-US", { month: "long" }),
    // Short month name (e.g. "Sep")
    date.toLocaleString("en-US", { month: "short" }),
    // Year as a bare string (e.g. "2026")
    String(date.getFullYear()),
  ];
}

/**
 * Collects every piece of real, non-fabricated text from an ImageRecord.
 *
 * Each token below originates from a field that genuinely exists on the
 * record. If a field is absent (undefined / null / empty) it is simply
 * skipped — we never invent data just to make search "appear" to work.
 *
 * @returns An array of searchable string tokens for a single image.
 */
export function collectSearchableText(image: ImageRecord): string[] {
  const tokens: string[] = [];

  // ── Title / custom name ──────────────────────────────────────────────
  if (image.title) tokens.push(image.title);

  // ── Filename (extracted from each stored URL) ─────────────────────────
  for (const url of [image.url, image.displayUrl, image.thumbUrl]) {
    const filename = extractFilenameFromUrl(url);
    if (filename) tokens.push(filename);
  }

  // ── Upload date ───────────────────────────────────────────────────────
  tokens.push(...formatDateTokens(image.uploadedAt));

  // ── Albums ────────────────────────────────────────────────────────────
  for (const album of image.albums ?? []) {
    if (album) tokens.push(album);
  }

  // ── Tags ──────────────────────────────────────────────────────────────
  for (const tag of image.tags ?? []) {
    if (tag) tokens.push(tag);
  }

  // ── EXIF metadata (camera, lens, aperture, shutter, ISO, …) ───────────
  if (image.metadata) {
    for (const value of Object.values(image.metadata)) {
      if (value != null && value !== "") {
        tokens.push(String(value));
      }
    }
  }

  // ── Location (name, country, city, coordinates) ───────────────────────
  if (image.location) {
    for (const value of Object.values(image.location)) {
      if (value != null && value !== "") {
        tokens.push(String(value));
      }
    }
  }

  // ── OCR extracted text ────────────────────────────────────────────────
  if (image.ocrResult) tokens.push(image.ocrResult);

  // ── Detected faces ────────────────────────────────────────────────────
  for (const face of image.detectedFaces ?? []) {
    if (face.name) tokens.push(face.name);
    if (face.ageRange) tokens.push(face.ageRange);
    if (face.expression) tokens.push(face.expression);
  }

  return tokens;
}

/**
 * Returns `true` when *any* token extracted from the image contains the
 * query as a case-insensitive substring.
 *
 * An empty query matches every image (so the gallery is unfiltered when
 * no search term is entered).
 *
 * @param image The image record to test.
 * @param query The raw (untrimmed) search query.
 * @returns `true` if the image matches the query.
 */
export function imageMatchesSearch(image: ImageRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true; // empty query → everything matches

  for (const token of collectSearchableText(image)) {
    if (token.toLowerCase().includes(q)) return true;
  }
  return false;
}

/**
 * Filters an array of images by a search query.
 *
 * The search is a simple case-insensitive substring match across all
 * fields that genuinely exist on each ImageRecord — filename (from stored
 * URLs), title / custom name, upload date, albums, tags, EXIF metadata,
 * location, OCR text, and detected-face names.
 *
 * Returns the full array unfiltered when the query is empty.
 *
 * @param query The search query string.
 * @param images The images to filter.
 * @returns A new array containing only the matching images.
 */
export function searchImages(
  query: string,
  images: ImageRecord[],
): ImageRecord[] {
  if (!query.trim()) return images;
  return images.filter((image) => imageMatchesSearch(image, query));
}

/**
 * Human-readable labels for the primary fields the search covers.
 * These map 1:1 to real ImageRecord fields — no phantom fields.
 */
export const SEARCHABLE_FIELD_LABELS = [
  "filename",
  "custom name",
  "date",
  "album",
  "metadata",
  "location",
] as const;
