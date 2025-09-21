"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useTheme } from "next-themes";
import { SkemyaTheme, skemyaLightTheme, skemyaDarkTheme } from "./skemya-theme";

interface ThemeContextType {
  theme: SkemyaTheme;
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function SkemyaThemeProvider({ children }: { children: ReactNode }) {
  // Use next-themes hook to get the current theme
  const { theme: nextTheme, setTheme } = useTheme();

  // Derive mode from next-themes
  const mode = nextTheme === "dark" ? "dark" : "light";
  const theme = mode === "light" ? skemyaLightTheme : skemyaDarkTheme;

  // Note: We're removing the CSS variable manipulation from here
  // The CSS variables should be defined statically in globals.css
  // This prevents the flash of unstyled content

  const setMode = (newMode: "light" | "dark") => {
    setTheme(newMode);
  };

  const toggleMode = () => {
    setTheme(mode === "light" ? "dark" : "light");
  };

  const value: ThemeContextType = {
    theme,
    mode,
    setMode,
    toggleMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSkemyaTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useSkemyaTheme must be used within a SkemyaThemeProvider");
  }
  return context;
}
