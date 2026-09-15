export type ThemeMode = "dark" | "light";

export type ThemeVars = {
  sky: string;
  primary: string;
  primaryForeground?: string;
  ring: string;
  accent?: string;
  accentForeground?: string;
  sidebarPrimary?: string;
  chart1?: string;
  // Dynamic surfaces and borders
  background?: string;
  canvas?: string;
  card?: string;
  cardForeground?: string;
  vaultLow?: string;
  vaultLowest?: string;
  vaultHigh?: string;
  border?: string;
  lineSubtle?: string;
  lineStrong?: string;
  glass?: string;
  mist?: string;
  foreground?: string;
  popover?: string;
  secondary?: string;
  muted?: string;
  mutedForeground?: string;
  // Optional extra overrides from tweakcn
  [key: string]: string | undefined;
};

export type PresetTheme = {
  id: string;
  name: string;
  description: string;
  accentHex: string;
  accentHexLight: string;
  previewBgDark: string;
  previewBgLight: string;
  vars: {
    dark: ThemeVars;
    light: ThemeVars;
  };
};

export const COLOR_PRESETS: PresetTheme[] = [
  {
    id: "default",
    name: "Astro Sky",
    description: "Signature celestial blue",
    accentHex: "#1e88e5",
    accentHexLight: "#1668d9",
    previewBgDark: "#0b0f17",
    previewBgLight: "#f0f5fb",
    vars: {
      dark: {
        background: "#0b0f17",
        canvas: "#0b0f17",
        card: "#111622",
        cardForeground: "#e2e8f0",
        vaultLow: "#111622",
        vaultLowest: "#0d111a",
        vaultHigh: "#171f30",
        border: "rgba(30, 136, 229, 0.16)",
        lineSubtle: "rgba(30, 136, 229, 0.16)",
        lineStrong: "rgba(30, 136, 229, 0.3)",
        sky: "#1e88e5",
        primary: "#1e88e5",
        primaryForeground: "#ffffff",
        ring: "rgba(30, 136, 229, 0.4)",
        accent: "#1e88e5",
        sidebarPrimary: "#1e88e5",
        chart1: "#1e88e5",
        glass: "rgba(17, 22, 34, 0.82)",
        mist: "rgba(226, 232, 240, 0.6)",
        foreground: "#e2e8f0",
        popover: "#111622",
        secondary: "#171f30",
        muted: "#0d111a",
        mutedForeground: "rgba(226, 232, 240, 0.6)",
      },
      light: {
        background: "#f0f5fb",
        canvas: "#f0f5fb",
        card: "#ffffff",
        cardForeground: "#0f172a",
        vaultLow: "#ffffff",
        vaultLowest: "#e4ecf7",
        vaultHigh: "#d8e4f3",
        border: "rgba(22, 104, 217, 0.14)",
        lineSubtle: "rgba(22, 104, 217, 0.14)",
        lineStrong: "rgba(22, 104, 217, 0.26)",
        sky: "#1668d9",
        primary: "#1668d9",
        primaryForeground: "#ffffff",
        ring: "rgba(22, 104, 217, 0.3)",
        accent: "#1668d9",
        sidebarPrimary: "#1668d9",
        chart1: "#1668d9",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#64748b",
        foreground: "#0f172a",
        popover: "#ffffff",
        secondary: "#e4ecf7",
        muted: "#e4ecf7",
        mutedForeground: "#64748b",
      },
    },
  },
  {
    id: "rose",
    name: "Rose Quartz",
    description: "Romantic rose pink glow",
    accentHex: "#f43f5e",
    accentHexLight: "#e11d48",
    previewBgDark: "#13090e",
    previewBgLight: "#fff1f4",
    vars: {
      dark: {
        background: "#13090e",
        canvas: "#13090e",
        card: "#1c0e15",
        cardForeground: "#fce7ef",
        vaultLow: "#1c0e15",
        vaultLowest: "#160a10",
        vaultHigh: "#27131e",
        border: "rgba(244, 63, 94, 0.2)",
        lineSubtle: "rgba(244, 63, 94, 0.2)",
        lineStrong: "rgba(244, 63, 94, 0.35)",
        sky: "#f43f5e",
        primary: "#f43f5e",
        primaryForeground: "#ffffff",
        ring: "rgba(244, 63, 94, 0.4)",
        accent: "#f43f5e",
        sidebarPrimary: "#f43f5e",
        chart1: "#f43f5e",
        glass: "rgba(28, 14, 21, 0.82)",
        mist: "rgba(252, 231, 239, 0.6)",
        foreground: "#fce7ef",
        popover: "#1c0e15",
        secondary: "#27131e",
        muted: "#160a10",
        mutedForeground: "rgba(252, 231, 239, 0.6)",
      },
      light: {
        background: "#fff1f4",
        canvas: "#fff1f4",
        card: "#ffffff",
        cardForeground: "#240a12",
        vaultLow: "#ffffff",
        vaultLowest: "#ffe4e9",
        vaultHigh: "#fecdd7",
        border: "rgba(244, 63, 94, 0.16)",
        lineSubtle: "rgba(244, 63, 94, 0.16)",
        lineStrong: "rgba(244, 63, 94, 0.3)",
        sky: "#e11d48",
        primary: "#e11d48",
        primaryForeground: "#ffffff",
        ring: "rgba(225, 29, 72, 0.3)",
        accent: "#e11d48",
        sidebarPrimary: "#e11d48",
        chart1: "#e11d48",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#9f1239",
        foreground: "#240a12",
        popover: "#ffffff",
        secondary: "#ffe4e9",
        muted: "#ffe4e9",
        mutedForeground: "#9f1239",
      },
    },
  },
  {
    id: "violet",
    name: "Astral Violet",
    description: "Deep Catppuccin lilac & mauve",
    accentHex: "#a855f7",
    accentHexLight: "#9333ea",
    previewBgDark: "#110b1a",
    previewBgLight: "#faf5ff",
    vars: {
      dark: {
        background: "#110b1a",
        canvas: "#110b1a",
        card: "#1a1127",
        cardForeground: "#f3e8ff",
        vaultLow: "#1a1127",
        vaultLowest: "#140d20",
        vaultHigh: "#26183a",
        border: "rgba(168, 85, 247, 0.2)",
        lineSubtle: "rgba(168, 85, 247, 0.2)",
        lineStrong: "rgba(168, 85, 247, 0.35)",
        sky: "#a855f7",
        primary: "#a855f7",
        primaryForeground: "#ffffff",
        ring: "rgba(168, 85, 247, 0.4)",
        accent: "#a855f7",
        sidebarPrimary: "#a855f7",
        chart1: "#a855f7",
        glass: "rgba(26, 17, 39, 0.82)",
        mist: "rgba(243, 232, 255, 0.6)",
        foreground: "#f3e8ff",
        popover: "#1a1127",
        secondary: "#26183a",
        muted: "#140d20",
        mutedForeground: "rgba(243, 232, 255, 0.6)",
      },
      light: {
        background: "#faf5ff",
        canvas: "#faf5ff",
        card: "#ffffff",
        cardForeground: "#1e0e2e",
        vaultLow: "#ffffff",
        vaultLowest: "#f3e8ff",
        vaultHigh: "#e9d5ff",
        border: "rgba(168, 85, 247, 0.16)",
        lineSubtle: "rgba(168, 85, 247, 0.16)",
        lineStrong: "rgba(168, 85, 247, 0.3)",
        sky: "#9333ea",
        primary: "#9333ea",
        primaryForeground: "#ffffff",
        ring: "rgba(147, 51, 234, 0.3)",
        accent: "#9333ea",
        sidebarPrimary: "#9333ea",
        chart1: "#9333ea",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#6b21a8",
        foreground: "#1e0e2e",
        popover: "#ffffff",
        secondary: "#f3e8ff",
        muted: "#f3e8ff",
        mutedForeground: "#6b21a8",
      },
    },
  },
  {
    id: "amber",
    name: "Sunset Amber",
    description: "Warm golden hour glow",
    accentHex: "#f59e0b",
    accentHexLight: "#d97706",
    previewBgDark: "#130f08",
    previewBgLight: "#fffbeb",
    vars: {
      dark: {
        background: "#130f08",
        canvas: "#130f08",
        card: "#1d160c",
        cardForeground: "#fef3c7",
        vaultLow: "#1d160c",
        vaultLowest: "#16110a",
        vaultHigh: "#2a2012",
        border: "rgba(245, 158, 11, 0.2)",
        lineSubtle: "rgba(245, 158, 11, 0.2)",
        lineStrong: "rgba(245, 158, 11, 0.35)",
        sky: "#f59e0b",
        primary: "#f59e0b",
        primaryForeground: "#121316",
        ring: "rgba(245, 158, 11, 0.4)",
        accent: "#f59e0b",
        sidebarPrimary: "#f59e0b",
        chart1: "#f59e0b",
        glass: "rgba(29, 22, 12, 0.82)",
        mist: "rgba(254, 243, 199, 0.6)",
        foreground: "#fef3c7",
        popover: "#1d160c",
        secondary: "#2a2012",
        muted: "#16110a",
        mutedForeground: "rgba(254, 243, 199, 0.6)",
      },
      light: {
        background: "#fffbeb",
        canvas: "#fffbeb",
        card: "#ffffff",
        cardForeground: "#271803",
        vaultLow: "#ffffff",
        vaultLowest: "#fef3c7",
        vaultHigh: "#fde68a",
        border: "rgba(245, 158, 11, 0.16)",
        lineSubtle: "rgba(245, 158, 11, 0.16)",
        lineStrong: "rgba(245, 158, 11, 0.3)",
        sky: "#d97706",
        primary: "#d97706",
        primaryForeground: "#ffffff",
        ring: "rgba(217, 119, 6, 0.3)",
        accent: "#d97706",
        sidebarPrimary: "#d97706",
        chart1: "#d97706",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#92400e",
        foreground: "#271803",
        popover: "#ffffff",
        secondary: "#fef3c7",
        muted: "#fef3c7",
        mutedForeground: "#92400e",
      },
    },
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    description: "Vibrant botanical emerald",
    accentHex: "#10b981",
    accentHexLight: "#059669",
    previewBgDark: "#08130d",
    previewBgLight: "#f0fdf4",
    vars: {
      dark: {
        background: "#08130d",
        canvas: "#08130d",
        card: "#0e1d15",
        cardForeground: "#ecfdf5",
        vaultLow: "#0e1d15",
        vaultLowest: "#0b1710",
        vaultHigh: "#152c20",
        border: "rgba(16, 185, 129, 0.2)",
        lineSubtle: "rgba(16, 185, 129, 0.2)",
        lineStrong: "rgba(16, 185, 129, 0.35)",
        sky: "#10b981",
        primary: "#10b981",
        primaryForeground: "#ffffff",
        ring: "rgba(16, 185, 129, 0.4)",
        accent: "#10b981",
        sidebarPrimary: "#10b981",
        chart1: "#10b981",
        glass: "rgba(14, 29, 21, 0.82)",
        mist: "rgba(236, 253, 245, 0.6)",
        foreground: "#ecfdf5",
        popover: "#0e1d15",
        secondary: "#152c20",
        muted: "#0b1710",
        mutedForeground: "rgba(236, 253, 245, 0.6)",
      },
      light: {
        background: "#f0fdf4",
        canvas: "#f0fdf4",
        card: "#ffffff",
        cardForeground: "#062315",
        vaultLow: "#ffffff",
        vaultLowest: "#dcfce7",
        vaultHigh: "#bbf7d0",
        border: "rgba(16, 185, 129, 0.16)",
        lineSubtle: "rgba(16, 185, 129, 0.16)",
        lineStrong: "rgba(16, 185, 129, 0.3)",
        sky: "#059669",
        primary: "#059669",
        primaryForeground: "#ffffff",
        ring: "rgba(5, 150, 105, 0.3)",
        accent: "#059669",
        sidebarPrimary: "#059669",
        chart1: "#059669",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#047857",
        foreground: "#062315",
        popover: "#ffffff",
        secondary: "#dcfce7",
        muted: "#dcfce7",
        mutedForeground: "#047857",
      },
    },
  },
  {
    id: "cyan",
    name: "Nord Cyan",
    description: "Arctic frost & clear cyan",
    accentHex: "#06b6d4",
    accentHexLight: "#0891b2",
    previewBgDark: "#071216",
    previewBgLight: "#ecfeff",
    vars: {
      dark: {
        background: "#071216",
        canvas: "#071216",
        card: "#0d1c23",
        cardForeground: "#ecfeff",
        vaultLow: "#0d1c23",
        vaultLowest: "#0a161b",
        vaultHigh: "#142a34",
        border: "rgba(6, 182, 212, 0.2)",
        lineSubtle: "rgba(6, 182, 212, 0.2)",
        lineStrong: "rgba(6, 182, 212, 0.35)",
        sky: "#06b6d4",
        primary: "#06b6d4",
        primaryForeground: "#0b0c0e",
        ring: "rgba(6, 182, 212, 0.4)",
        accent: "#06b6d4",
        sidebarPrimary: "#06b6d4",
        chart1: "#06b6d4",
        glass: "rgba(13, 28, 35, 0.82)",
        mist: "rgba(236, 254, 255, 0.6)",
        foreground: "#ecfeff",
        popover: "#0d1c23",
        secondary: "#142a34",
        muted: "#0a161b",
        mutedForeground: "rgba(236, 254, 255, 0.6)",
      },
      light: {
        background: "#ecfeff",
        canvas: "#ecfeff",
        card: "#ffffff",
        cardForeground: "#08232c",
        vaultLow: "#ffffff",
        vaultLowest: "#cffafe",
        vaultHigh: "#a5f3fc",
        border: "rgba(6, 182, 212, 0.16)",
        lineSubtle: "rgba(6, 182, 212, 0.16)",
        lineStrong: "rgba(6, 182, 212, 0.3)",
        sky: "#0891b2",
        primary: "#0891b2",
        primaryForeground: "#ffffff",
        ring: "rgba(8, 145, 178, 0.3)",
        accent: "#0891b2",
        sidebarPrimary: "#0891b2",
        chart1: "#0891b2",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#0e7490",
        foreground: "#08232c",
        popover: "#ffffff",
        secondary: "#cffafe",
        muted: "#cffafe",
        mutedForeground: "#0e7490",
      },
    },
  },
  {
    id: "ruby",
    name: "Ruby Crimson",
    description: "Bold cinematic crimson",
    accentHex: "#ef4444",
    accentHexLight: "#dc2626",
    previewBgDark: "#140809",
    previewBgLight: "#fff1f2",
    vars: {
      dark: {
        background: "#140809",
        canvas: "#140809",
        card: "#1e0d0f",
        cardForeground: "#fef2f2",
        vaultLow: "#1e0d0f",
        vaultLowest: "#17090b",
        vaultHigh: "#2d1316",
        border: "rgba(239, 68, 68, 0.2)",
        lineSubtle: "rgba(239, 68, 68, 0.2)",
        lineStrong: "rgba(239, 68, 68, 0.35)",
        sky: "#ef4444",
        primary: "#ef4444",
        primaryForeground: "#ffffff",
        ring: "rgba(239, 68, 68, 0.4)",
        accent: "#ef4444",
        sidebarPrimary: "#ef4444",
        chart1: "#ef4444",
        glass: "rgba(30, 13, 15, 0.82)",
        mist: "rgba(254, 242, 242, 0.6)",
        foreground: "#fef2f2",
        popover: "#1e0d0f",
        secondary: "#2d1316",
        muted: "#17090b",
        mutedForeground: "rgba(254, 242, 242, 0.6)",
      },
      light: {
        background: "#fff1f2",
        canvas: "#fff1f2",
        card: "#ffffff",
        cardForeground: "#230709",
        vaultLow: "#ffffff",
        vaultLowest: "#ffe4e6",
        vaultHigh: "#fecdd3",
        border: "rgba(239, 68, 68, 0.16)",
        lineSubtle: "rgba(239, 68, 68, 0.16)",
        lineStrong: "rgba(239, 68, 68, 0.3)",
        sky: "#dc2626",
        primary: "#dc2626",
        primaryForeground: "#ffffff",
        ring: "rgba(220, 38, 38, 0.3)",
        accent: "#dc2626",
        sidebarPrimary: "#dc2626",
        chart1: "#dc2626",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#b91c1c",
        foreground: "#230709",
        popover: "#ffffff",
        secondary: "#ffe4e6",
        muted: "#ffe4e6",
        mutedForeground: "#b91c1c",
      },
    },
  },
  {
    id: "slate",
    name: "Obsidian Slate",
    description: "Monochrome stealth & silver",
    accentHex: "#cbd5e1",
    accentHexLight: "#475569",
    previewBgDark: "#0d0f12",
    previewBgLight: "#f8fafc",
    vars: {
      dark: {
        background: "#0d0f12",
        canvas: "#0d0f12",
        card: "#15181e",
        cardForeground: "#f1f5f9",
        vaultLow: "#15181e",
        vaultLowest: "#101317",
        vaultHigh: "#1f232b",
        border: "rgba(148, 163, 184, 0.18)",
        lineSubtle: "rgba(148, 163, 184, 0.18)",
        lineStrong: "rgba(148, 163, 184, 0.3)",
        sky: "#cbd5e1",
        primary: "#e2e8f0",
        primaryForeground: "#0f172a",
        ring: "rgba(203, 213, 225, 0.4)",
        accent: "#cbd5e1",
        sidebarPrimary: "#cbd5e1",
        chart1: "#cbd5e1",
        glass: "rgba(21, 24, 30, 0.82)",
        mist: "rgba(241, 245, 249, 0.6)",
        foreground: "#f1f5f9",
        popover: "#15181e",
        secondary: "#1f232b",
        muted: "#101317",
        mutedForeground: "rgba(241, 245, 249, 0.6)",
      },
      light: {
        background: "#f8fafc",
        canvas: "#f8fafc",
        card: "#ffffff",
        cardForeground: "#0f172a",
        vaultLow: "#ffffff",
        vaultLowest: "#f1f5f9",
        vaultHigh: "#e2e8f0",
        border: "rgba(71, 85, 105, 0.16)",
        lineSubtle: "rgba(71, 85, 105, 0.16)",
        lineStrong: "rgba(71, 85, 105, 0.3)",
        sky: "#475569",
        primary: "#334155",
        primaryForeground: "#ffffff",
        ring: "rgba(71, 85, 105, 0.3)",
        accent: "#475569",
        sidebarPrimary: "#475569",
        chart1: "#475569",
        glass: "rgba(255, 255, 255, 0.82)",
        mist: "#475569",
        foreground: "#0f172a",
        popover: "#ffffff",
        secondary: "#f1f5f9",
        muted: "#f1f5f9",
        mutedForeground: "#475569",
      },
    },
  },
];

export type CustomThemeData = {
  name: string;
  sourceUrl?: string;
  vars: {
    dark: Record<string, string>;
    light: Record<string, string>;
  };
};

/**
 * Ensures color values from tweakcn or custom CSS (like bare "240 10% 3.9%")
 * are wrapped in hsl(...) so modern CSS and Tailwind v4 render them correctly.
 */
export function normalizeColorValue(val: string): string {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("oklch") ||
    trimmed.startsWith("oklab") ||
    trimmed.startsWith("color(") ||
    trimmed.endsWith("px") ||
    trimmed.endsWith("rem") ||
    trimmed.endsWith("em")
  ) {
    return trimmed;
  }
  // Check if it matches space-separated HSL channels: e.g. "240 10% 3.9%" or "222.2 84% 4.9%"
  if (/^[\d.]+(?:deg)?\s+[\d.]+%?\s+[\d.]+%?(?:\s*\/\s*[\d.]+%?)?$/.test(trimmed)) {
    return `hsl(${trimmed})`;
  }
  return trimmed;
}

/**
 * Parses CSS text from tweakcn (e.g. :root { ... } .dark { ... })
 * into light and dark key-value variable maps.
 */
export function parseTweakcnCss(cssText: string): {
  dark: Record<string, string>;
  light: Record<string, string>;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  function extractDeclarations(block: string, target: Record<string, string>) {
    const declRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = declRegex.exec(block)) !== null) {
      const varName = match[1].trim();
      const value = normalizeColorValue(match[2].trim());
      target[varName] = value;
    }
  }

  // Support multiple selector styles: :root, html, [data-theme="light"], .dark, [data-theme="dark"]
  const rootMatches = cssText.matchAll(/(?::root|html(?![.\w])|\[data-theme=["']?light["']?\])\s*\{([^}]+)\}/gi);
  for (const m of rootMatches) {
    if (m[1]) extractDeclarations(m[1], light);
  }

  const darkMatches = cssText.matchAll(/(?:\.dark|\[data-theme=["']?dark["']?\])\s*\{([^}]+)\}/gi);
  for (const m of darkMatches) {
    if (m[1]) extractDeclarations(m[1], dark);
  }

  // If no :root or .dark blocks were explicitly found, parse the whole snippet as declarations for both
  if (Object.keys(light).length === 0 && Object.keys(dark).length === 0) {
    extractDeclarations(cssText, light);
    extractDeclarations(cssText, dark);
  }

  return { light, dark };
}

/**
 * Extracts CSS variables from tweakcn JSON object
 */
export function parseTweakcnJson(json: Record<string, unknown> | null | undefined): {
  dark: Record<string, string>;
  light: Record<string, string>;
  name?: string;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const name = typeof json?.name === "string" ? json.name : "Tweakcn Theme";

  const rawStyles =
    (json?.styles as Record<string, unknown> | undefined) ||
    ((json?.themeState as Record<string, unknown> | undefined)?.styles as Record<string, unknown> | undefined) ||
    (json?.cssVars as Record<string, unknown> | undefined);

  if (rawStyles) {
    if (rawStyles.light && typeof rawStyles.light === "object") {
      for (const [k, v] of Object.entries(rawStyles.light as Record<string, unknown>)) {
        const cleanKey = k.startsWith("--") ? k.slice(2) : k;
        if (typeof v === "string") light[cleanKey] = normalizeColorValue(v);
      }
    }
    if (rawStyles.dark && typeof rawStyles.dark === "object") {
      for (const [k, v] of Object.entries(rawStyles.dark as Record<string, unknown>)) {
        const cleanKey = k.startsWith("--") ? k.slice(2) : k;
        if (typeof v === "string") dark[cleanKey] = normalizeColorValue(v);
      }
    }
  }

  return { light, dark, name };
}
