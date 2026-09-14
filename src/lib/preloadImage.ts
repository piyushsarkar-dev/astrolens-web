/**
 * High-performance image preloader with in-memory caching.
 * Loads full-resolution images into the browser cache before user clicks.
 */

const preloadedCache = new Set<string>();

export function preloadImage(src: string | null | undefined): Promise<void> {
  if (!src) return Promise.resolve();

  // If already preloaded or currently in memory cache, skip
  if (preloadedCache.has(src)) {
    return Promise.resolve();
  }

  preloadedCache.add(src);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => {
      // Allow retry if failed
      preloadedCache.delete(src);
      resolve();
    };
    img.src = src;
  });
}

export function preloadImages(sources: (string | null | undefined)[]): void {
  for (const src of sources) {
    if (src) void preloadImage(src);
  }
}
