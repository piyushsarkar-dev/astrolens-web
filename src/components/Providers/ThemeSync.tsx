"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useTheme } from "@/components/Providers/ThemeProvider";
import type { CustomThemeData } from "@/lib/themes";

export const ThemeSync = () => {
  const { user } = useAuth();
  const { applyPreset, applyCustomTheme, preset } = useTheme();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || user.id === syncedUserIdRef.current) return;
    syncedUserIdRef.current = user.id;

    const userPreset = user.user_metadata?.theme_preset as string | undefined;
    const userCustom = user.user_metadata?.custom_theme as CustomThemeData | undefined;

    if (userPreset === "custom" && userCustom) {
      applyCustomTheme(userCustom);
    } else if (userPreset && userPreset !== preset) {
      applyPreset(userPreset);
    }
  }, [user, preset, applyPreset, applyCustomTheme]);

  return null;
};
