"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  COLOR_PRESETS,
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
            const varName = key.startsWith("--") ? key : `--${key}`;
            varsToApply[varName] = value;
          }
        }
        // If tweakcn defined primary or accent, link --sky to it if not specified
        if (!varsToApply["--sky"]) {
          if (varsToApply["--primary"]) varsToApply["--sky"] = varsToApply["--primary"];
          else if (varsToApply["--accent"]) varsToApply["--sky"] = varsToApply["--accent"];
        }
      } else {
        const found = COLOR_PRESETS.find((p) => p.id === currentPreset) || COLOR_PRESETS[0];
        const modeVars = found.vars[currentMode];
        if (modeVars) {
          varsToApply["--sky"] = modeVars.sky;
          varsToApply["--primary"] = modeVars.primary;
          if (modeVars.primaryForeground) {
            varsToApply["--primary-foreground"] = modeVars.primaryForeground;
          }
          varsToApply["--ring"] = modeVars.ring;
          if (modeVars.accent) varsToApply["--accent"] = modeVars.accent;
          if (modeVars.sidebarPrimary) varsToApply["--sidebar-primary"] = modeVars.sidebarPrimary;
          if (modeVars.chart1) varsToApply["--chart-1"] = modeVars.chart1;
        }
      }

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
