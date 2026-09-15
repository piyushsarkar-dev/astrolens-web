import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImageRecord } from "./types";
import { collectSearchableText, imageMatchesSearch, searchImages } from "./search";

/**
 * Loads the real seed data from `data/images.json` so that every
 * assertion is validated against genuine records — not hand-typed
 * mocks.
 */
function readImageFixture(): ImageRecord[] {
  const fixturePath = resolve(process.cwd(), "data", "images.json");
  const raw = readFileSync(fixturePath, "utf-8");
  return JSON.parse(raw) as ImageRecord[];
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log("  ✓ " + message);
  } else {
    failed++;
    console.error("  ✗ " + message);
  }
}

const images = readImageFixture();

console.log("=== Search Utility Validation ===\n");

// ── Empty query returns everything ──────────────────────────────
console.log("[Empty query]");
assert(
  searchImages("", images).length === images.length,
  "Empty query returns all images unchanged",
);
assert(
  searchImages("   ", images).length === images.length,
  "Whitespace-only query returns all images",
);

// ── Filename search ──────────────────────────────────────────────
console.log("\n[Filename search]");
const logoResults = searchImages("logo", images);
assert(
  logoResults.length === 2,
  "Search 'logo' finds 2 images (logo + logo Creator imagetologo)",
);
assert(
  logoResults.some((img) => img.id === "6cvGc3mB"),
  "Correct image found via filename 'logo'",
);

const chatResults = searchImages("Chat GPT", images);
assert(
  chatResults.length === 2,
  "Search 'Chat GPT' finds 2 images (two Chat GPT Image files)",
);

// ── Custom name / Title search ───────────────────────────────────
console.log("\n[Custom name / Title search]");
const zodResults = searchImages("Zod", images);
assert(zodResults.length === 1, "Search 'Zod' finds 1 image via title");
assert(
  zodResults[0]?.title === "Terence Stamp General Zod",
  "Correct title matched",
);

const lowerCaseResults = searchImages("terence", images);
assert(
  lowerCaseResults.length === 1,
  "Case-insensitive search 'terence' finds 1 image",
);

// ── Date search ──────────────────────────────────────────────────
console.log("\n[Date search]");
const yearResults = searchImages("2026", images);
assert(yearResults.length === 8, "Search '2026' finds all 8 images");

const monthResults = searchImages("September", images);
assert(monthResults.length === 8, "Search 'September' finds all 8 images");

// ── Album search ─────────────────────────────────────────────────
console.log("\n[Album search]");
const albumResults = searchImages("crt", images);
assert(albumResults.length === 2, "Search 'crt' finds 2 album-tagged images");

const favResults = searchImages("favorites", images);
assert(
  favResults.length === 0,
  "'favorites' substring doesn't match any text field (isFavorite is boolean)",
);

// ── Metadata / Tags search ───────────────────────────────────────
console.log("\n[Metadata search]");
const tagResults = searchImages("high-res", images);
assert(tagResults.length === 1, "Search 'high-res' finds 1 tagged image");

// ── No fabrication ───────────────────────────────────────────────
console.log("\n[No fabrication — missing fields don't match]");
const noAlbumMatch = searchImages("nonexistent-album", images);
assert(noAlbumMatch.length === 0, "Non-existent album returns 0 results (no fake data)");

const noLocationMatch = searchImages("Paris", images);
assert(
  noLocationMatch.length === 0,
  "No image has location data — 'Paris' returns 0 results",
);

const noOcrMatch = searchImages("ocr text", images);
assert(
  noOcrMatch.length === 0,
  "No image has OCR data — 'ocr text' returns 0 results",
);

// ── collectSearchableText correctness ───────────────────────────
console.log("\n[collectSearchableText]");
const logoImage = images.find((img) => img.id === "6cvGc3mB")!;
const logoTokens = collectSearchableText(logoImage);
assert(logoTokens.includes("logo"), "Logo image tokens include 'logo' (title)");
assert(
  logoTokens.some((t) => t.includes("logo.png")),
  "Logo image tokens include 'logo.png' (filename from URL)",
);

const zodImage = images.find((img) => img.id === "0p77s58P")!;
const zodTokens = collectSearchableText(zodImage);
assert(zodTokens.includes("crt"), "Zod image tokens include 'crt' (album name)");

// ── imageMatchesSearch edge cases ───────────────────────────────
console.log("\n[imageMatchesSearch edge cases]");
assert(imageMatchesSearch(logoImage, ""), "Empty query matches any image");
assert(
  !imageMatchesSearch(logoImage, "zzz-nope-zzz"),
  "Non-matching query returns false",
);

// ── Summary ─────────────────────────────────────────────────────
console.log("\n=== Results: " + passed + " passed, " + failed + " failed ===");
if (failed > 0) {
  console.error("VALIDATION FAILED");
  process.exit(1);
} else {
  console.log("All checks passed ✓");
}

