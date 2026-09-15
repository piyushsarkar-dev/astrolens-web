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
    previewBgDark: "#121316",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#1e88e5",
        primary: "#1e88e5",
        primaryForeground: "#ffffff",
        ring: "rgba(30, 136, 229, 0.4)",
        accent: "#1e88e5",
        sidebarPrimary: "#1e88e5",
        chart1: "#1e88e5",
      },
      light: {
        sky: "#1668d9",
        primary: "#1668d9",
        primaryForeground: "#ffffff",
        ring: "rgba(22, 104, 217, 0.3)",
        accent: "#1668d9",
        sidebarPrimary: "#1668d9",
        chart1: "#1668d9",
      },
    },
  },
  {
    id: "rose",
    name: "Rose Quartz",
    description: "Romantic rose pink glow",
    accentHex: "#f43f5e",
    accentHexLight: "#e11d48",
    previewBgDark: "#161214",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#f43f5e",
        primary: "#f43f5e",
        primaryForeground: "#ffffff",
        ring: "rgba(244, 63, 94, 0.4)",
        accent: "#f43f5e",
        sidebarPrimary: "#f43f5e",
        chart1: "#f43f5e",
      },
      light: {
        sky: "#e11d48",
        primary: "#e11d48",
        primaryForeground: "#ffffff",
        ring: "rgba(225, 29, 72, 0.3)",
        accent: "#e11d48",
        sidebarPrimary: "#e11d48",
        chart1: "#e11d48",
      },
    },
  },
  {
    id: "violet",
    name: "Astral Violet",
    description: "Deep Catppuccin lilac & mauve",
    accentHex: "#a855f7",
    accentHexLight: "#9333ea",
    previewBgDark: "#141118",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#a855f7",
        primary: "#a855f7",
        primaryForeground: "#ffffff",
        ring: "rgba(168, 85, 247, 0.4)",
        accent: "#a855f7",
        sidebarPrimary: "#a855f7",
        chart1: "#a855f7",
      },
      light: {
        sky: "#9333ea",
        primary: "#9333ea",
        primaryForeground: "#ffffff",
        ring: "rgba(147, 51, 234, 0.3)",
        accent: "#9333ea",
        sidebarPrimary: "#9333ea",
        chart1: "#9333ea",
      },
    },
  },
  {
    id: "amber",
    name: "Sunset Amber",
    description: "Warm golden hour glow",
    accentHex: "#f59e0b",
    accentHexLight: "#d97706",
    previewBgDark: "#161410",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#f59e0b",
        primary: "#f59e0b",
        primaryForeground: "#121316",
        ring: "rgba(245, 158, 11, 0.4)",
        accent: "#f59e0b",
        sidebarPrimary: "#f59e0b",
        chart1: "#f59e0b",
      },
      light: {
        sky: "#d97706",
        primary: "#d97706",
        primaryForeground: "#ffffff",
        ring: "rgba(217, 119, 6, 0.3)",
        accent: "#d97706",
        sidebarPrimary: "#d97706",
        chart1: "#d97706",
      },
    },
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    description: "Vibrant botanical emerald",
    accentHex: "#10b981",
    accentHexLight: "#059669",
    previewBgDark: "#101613",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#10b981",
        primary: "#10b981",
        primaryForeground: "#ffffff",
        ring: "rgba(16, 185, 129, 0.4)",
        accent: "#10b981",
        sidebarPrimary: "#10b981",
        chart1: "#10b981",
      },
      light: {
        sky: "#059669",
        primary: "#059669",
        primaryForeground: "#ffffff",
        ring: "rgba(5, 150, 105, 0.3)",
        accent: "#059669",
        sidebarPrimary: "#059669",
        chart1: "#059669",
      },
    },
  },
  {
    id: "cyan",
    name: "Nord Cyan",
    description: "Arctic frost & clear cyan",
    accentHex: "#06b6d4",
    accentHexLight: "#0891b2",
    previewBgDark: "#0f1618",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#06b6d4",
        primary: "#06b6d4",
        primaryForeground: "#0b0c0e",
        ring: "rgba(6, 182, 212, 0.4)",
        accent: "#06b6d4",
        sidebarPrimary: "#06b6d4",
        chart1: "#06b6d4",
      },
      light: {
        sky: "#0891b2",
        primary: "#0891b2",
        primaryForeground: "#ffffff",
        ring: "rgba(8, 145, 178, 0.3)",
        accent: "#0891b2",
        sidebarPrimary: "#0891b2",
        chart1: "#0891b2",
      },
    },
  },
  {
    id: "ruby",
    name: "Ruby Crimson",
    description: "Bold cinematic crimson",
    accentHex: "#ef4444",
    accentHexLight: "#dc2626",
    previewBgDark: "#181112",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#ef4444",
        primary: "#ef4444",
        primaryForeground: "#ffffff",
        ring: "rgba(239, 68, 68, 0.4)",
        accent: "#ef4444",
        sidebarPrimary: "#ef4444",
        chart1: "#ef4444",
      },
      light: {
        sky: "#dc2626",
        primary: "#dc2626",
        primaryForeground: "#ffffff",
        ring: "rgba(220, 38, 38, 0.3)",
        accent: "#dc2626",
        sidebarPrimary: "#dc2626",
        chart1: "#dc2626",
      },
    },
  },
  {
    id: "slate",
    name: "Obsidian Slate",
    description: "Monochrome stealth & silver",
    accentHex: "#94a3b8",
    accentHexLight: "#475569",
    previewBgDark: "#131416",
    previewBgLight: "#ffffff",
    vars: {
      dark: {
        sky: "#cbd5e1",
        primary: "#e2e8f0",
        primaryForeground: "#0f172a",
        ring: "rgba(203, 213, 225, 0.4)",
        accent: "#94a3b8",
        sidebarPrimary: "#cbd5e1",
        chart1: "#94a3b8",
      },
      light: {
        sky: "#475569",
        primary: "#334155",
        primaryForeground: "#ffffff",
        ring: "rgba(71, 85, 105, 0.3)",
        accent: "#475569",
        sidebarPrimary: "#475569",
        chart1: "#475569",
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
 * Parses CSS text from tweakcn (e.g. :root { ... } .dark { ... })
 * into light and dark key-value variable maps.
 */
export function parseTweakcnCss(cssText: string): {
  dark: Record<string, string>;
  light: Record<string, string>;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  // Extract blocks like :root { ... } and .dark { ... }
  const rootMatch = cssText.match(/(?::root|html(?![.\w]))\s*\{([^}]+)\}/i);
  const darkMatch = cssText.match(/\.dark\s*\{([^}]+)\}/i);

  function extractDeclarations(block: string, target: Record<string, string>) {
    const declRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = declRegex.exec(block)) !== null) {
      const varName = match[1].trim();
      const value = match[2].trim();
      target[varName] = value;
    }
  }

  if (rootMatch && rootMatch[1]) {
    extractDeclarations(rootMatch[1], light);
  }

  if (darkMatch && darkMatch[1]) {
    extractDeclarations(darkMatch[1], dark);
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
export function parseTweakcnJson(json: any): {
  dark: Record<string, string>;
  light: Record<string, string>;
  name?: string;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  let name = json?.name || "Tweakcn Theme";

  const styles = json?.styles || json?.themeState?.styles || json?.cssVars;

  if (styles) {
    if (styles.light) {
      for (const [k, v] of Object.entries(styles.light)) {
        const cleanKey = k.startsWith("--") ? k.slice(2) : k;
        if (typeof v === "string") light[cleanKey] = v;
      }
    }
    if (styles.dark) {
      for (const [k, v] of Object.entries(styles.dark)) {
        const cleanKey = k.startsWith("--") ? k.slice(2) : k;
        if (typeof v === "string") dark[cleanKey] = v;
      }
    }
  }

  return { light, dark, name };
}
