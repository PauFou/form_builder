"use client";

import { useEffect } from "react";
import { useThemeStore } from "../../lib/stores/theme-store";

export function ThemeInitializer() {
  const { setTheme, theme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on mount
    setTheme(theme);
  }, [setTheme, theme]);

  return null;
}