"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  COLOR_PRESETS,
  normalizeColorValue,
  type CustomThemeData,
  type ThemeMode,
} from "@/lib/themes";

export type Theme = ThemeMode;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  preset: string;
  customTheme: CustomThemeData | null;
  applyPreset: (presetId: string) => void;
  applyCustomTheme: (custom: CustomThemeData) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  preset: "default",
  customTheme: null,
  applyPreset: () => {},
  applyCustomTheme: () => {},
  resetTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKeyTheme?: string;
  storageKeyPreset?: string;
  storageKeyCustom?: string;
};

const STORAGE_THEME = "astrolens-theme";
const STORAGE_PRESET = "astrolens-preset";
const STORAGE_CUSTOM = "astrolens-custom-theme";
const STORAGE_VARS = "astrolens-theme-vars";

export const ThemeProvider = ({
  children,
  defaultTheme = "dark",
  storageKeyTheme = STORAGE_THEME,
  storageKeyPreset = STORAGE_PRESET,
  storageKeyCustom = STORAGE_CUSTOM,
}: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKeyTheme) as Theme | null;
      if (stored === "dark" || stored === "light") return stored;
    } catch {
      // ignore
    }
    return defaultTheme;
  });

  const [preset, setPresetState] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    try {
      return localStorage.getItem(storageKeyPreset) || "default";
    } catch {
      return "default";
    }
  });

  const [customTheme, setCustomThemeState] = useState<CustomThemeData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKeyCustom);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Track applied CSS variable names so obsolete properties can be cleaned up on theme switch
  const appliedVarsRef = useRef<Set<string>>(new Set());

  // Apply variables to documentElement
  const applyStylesToDom = useCallback(
    (currentMode: Theme, currentPreset: string, currentCustom: CustomThemeData | null) => {
      if (typeof window === "undefined") return;
      const root = document.documentElement;

      // 1. Set mode class
      root.classList.remove("dark", "light");
      root.classList.add(currentMode);

      // Collect CSS variables to apply
      const varsToApply: Record<string, string> = {};

      if (currentPreset === "custom" && currentCustom) {
        const modeVars = currentCustom.vars[currentMode] || {};
        for (const [key, value] of Object.entries(modeVars)) {
          if (value) {
            const cleanKey = key.startsWith("--") ? key : `--${key}`;
            const kebabKey = cleanKey.replace(/([A-Z])/g, "-$1").toLowerCase();
            varsToApply[kebabKey] = normalizeColorValue(value);
          }
        }

        // Bridge tweakcn shadcn tokens directly to Astrolens tokens
        const bg = varsToApply["--background"];
        const fg = varsToApply["--foreground"];
        const card = varsToApply["--card"] || bg;
        const popover = varsToApply["--popover"] || card;
        const muted = varsToApply["--muted"] || bg;
        const mutedFg = varsToApply["--muted-foreground"];
        const border = varsToApply["--border"];
        const primary = varsToApply["--primary"];
        const accent = varsToApply["--accent"];
        const ring = varsToApply["--ring"] || primary;

        if (bg) {
          varsToApply["--canvas"] = bg;
        }
        if (card) {
          varsToApply["--vault-low"] = card;
        }
        if (muted) {
          varsToApply["--vault-lowest"] = muted;
        } else if (bg) {
          varsToApply["--vault-lowest"] = bg;
        }
        if (popover) {
          varsToApply["--vault-high"] = popover;
        } else if (card) {
          varsToApply["--vault-high"] = card;
        }
        if (border) {
          varsToApply["--line-subtle"] = border;
          varsToApply["--line-strong"] = border;
        }
        if (primary) {
          varsToApply["--sky"] = primary;
        } else if (accent) {
          varsToApply["--sky"] = accent;
        }
        if (ring) {
          varsToApply["--ring"] = ring;
        }
        if (mutedFg) {
          varsToApply["--mist"] = mutedFg;
        }
        if (fg) {
          varsToApply["--night"] = fg;
        }
        if (card) {
          varsToApply["--glass"] = `color-mix(in srgb, ${card} 82%, transparent)`;
        } else if (bg) {
          varsToApply["--glass"] = `color-mix(in srgb, ${bg} 82%, transparent)`;
        }
      } else {
        const found = COLOR_PRESETS.find((p) => p.id === currentPreset) || COLOR_PRESETS[0];
        const modeVars = found.vars[currentMode];
        if (modeVars) {
          for (const [key, value] of Object.entries(modeVars)) {
            if (value) {
              const cleanKey = key.startsWith("--") ? key : `--${key}`;
              const kebabKey = cleanKey.replace(/([A-Z])/g, "-$1").toLowerCase();
              varsToApply[kebabKey] = normalizeColorValue(value);
            }
          }

          // Full synchronization between shadcn and Astrolens tokens
          const bg = varsToApply["--background"] || varsToApply["--canvas"];
          const fg = varsToApply["--foreground"] || varsToApply["--night"];
          const card = varsToApply["--card"] || varsToApply["--vault-low"] || bg;
          const popover = varsToApply["--popover"] || varsToApply["--vault-high"] || card;
          const muted = varsToApply["--muted"] || varsToApply["--vault-lowest"] || bg;
          const mutedFg = varsToApply["--muted-foreground"] || varsToApply["--mist"];
          const border = varsToApply["--border"] || varsToApply["--line-subtle"];
          const primary = varsToApply["--primary"] || varsToApply["--sky"];

          if (bg) {
            varsToApply["--background"] = bg;
            varsToApply["--canvas"] = bg;
          }
          if (fg) {
            varsToApply["--foreground"] = fg;
            varsToApply["--night"] = fg;
          }
          if (card) {
            varsToApply["--card"] = card;
            varsToApply["--vault-low"] = card;
          }
          if (muted) {
            varsToApply["--muted"] = muted;
            varsToApply["--vault-lowest"] = muted;
          }
          if (popover) {
            varsToApply["--popover"] = popover;
            varsToApply["--vault-high"] = popover;
          }
          if (border) {
            varsToApply["--border"] = border;
            varsToApply["--line-subtle"] = border;
            if (!varsToApply["--line-strong"]) {
              varsToApply["--line-strong"] = border;
            }
          }
          if (primary) {
            varsToApply["--primary"] = primary;
            varsToApply["--sky"] = primary;
          }
          if (mutedFg) {
            varsToApply["--muted-foreground"] = mutedFg;
            varsToApply["--mist"] = mutedFg;
          }
          if (card && !varsToApply["--glass"]) {
            varsToApply["--glass"] = `color-mix(in srgb, ${card} 82%, transparent)`;
          }
        }
      }

      // Remove obsolete properties from documentElement.style that are not in the new theme
      for (const oldVar of appliedVarsRef.current) {
        if (!(oldVar in varsToApply)) {
          root.style.removeProperty(oldVar);
        }
      }
      appliedVarsRef.current = new Set(Object.keys(varsToApply));

      // Apply to root element style and track active overrides
      for (const [name, val] of Object.entries(varsToApply)) {
        root.style.setProperty(name, val);
      }

      // Persist active vars in localStorage for blocking layout script
      try {
        localStorage.setItem(STORAGE_VARS, JSON.stringify(varsToApply));
      } catch {
        // ignore
      }
    },
    []
  );

  useEffect(() => {
    applyStylesToDom(theme, preset, customTheme);
  }, [theme, preset, customTheme, applyStylesToDom]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(storageKeyTheme, t);
    } catch {
      // ignore
    }
  };

  const applyPreset = (presetId: string) => {
    setPresetState(presetId);
    setCustomThemeState(null);
    try {
      localStorage.setItem(storageKeyPreset, presetId);
      localStorage.removeItem(storageKeyCustom);
    } catch {
      // ignore
    }
  };

  const applyCustomTheme = (custom: CustomThemeData) => {
    setPresetState("custom");
    setCustomThemeState(custom);
    try {
      localStorage.setItem(storageKeyPreset, "custom");
      localStorage.setItem(storageKeyCustom, JSON.stringify(custom));
    } catch {
      // ignore
    }
  };

  const resetTheme = () => {
    applyPreset("default");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        preset,
        customTheme,
        applyPreset,
        applyCustomTheme,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
