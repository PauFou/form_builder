"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { SkemyaTheme, skemyaLightTheme, skemyaDarkTheme, themeToCSS } from "./skemya-theme";

interface ThemeContextType {
  theme: SkemyaTheme;
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function SkemyaThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = mode === "light" ? skemyaLightTheme : skemyaDarkTheme;

  useEffect(() => {
    // Check for system preference
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setMode(mediaQuery.matches ? "dark" : "light");

      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        setMode(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  useEffect(() => {
    // Apply theme CSS variables
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const cssVars = themeToCSS(theme);

      // Create or update style element
      let styleEl = document.getElementById("skemya-theme");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "skemya-theme";
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = `:root {\n  ${cssVars}\n}`;

      // Update root CSS variables for backward compatibility
      root.style.setProperty("--primary", theme.colors.primary[500]);
      root.style.setProperty(
        "--primary-foreground",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[1000]
      );
      root.style.setProperty("--secondary", theme.colors.secondary[500]);
      root.style.setProperty(
        "--secondary-foreground",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[1000]
      );
      root.style.setProperty("--accent", theme.colors.accent[500]);
      root.style.setProperty(
        "--accent-foreground",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[1000]
      );
      root.style.setProperty(
        "--background",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[50]
      );
      root.style.setProperty(
        "--foreground",
        theme.mode === "light" ? theme.colors.neutral[900] : theme.colors.neutral[100]
      );
      root.style.setProperty(
        "--muted",
        theme.mode === "light" ? theme.colors.neutral[100] : theme.colors.neutral[800]
      );
      root.style.setProperty(
        "--muted-foreground",
        theme.mode === "light" ? theme.colors.neutral[500] : theme.colors.neutral[400]
      );
      root.style.setProperty(
        "--card",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[100]
      );
      root.style.setProperty(
        "--card-foreground",
        theme.mode === "light" ? theme.colors.neutral[900] : theme.colors.neutral[100]
      );
      root.style.setProperty(
        "--popover",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[100]
      );
      root.style.setProperty(
        "--popover-foreground",
        theme.mode === "light" ? theme.colors.neutral[900] : theme.colors.neutral[100]
      );
      root.style.setProperty(
        "--border",
        theme.mode === "light" ? theme.colors.neutral[200] : theme.colors.neutral[700]
      );
      root.style.setProperty(
        "--input",
        theme.mode === "light" ? theme.colors.neutral[200] : theme.colors.neutral[700]
      );
      root.style.setProperty("--ring", theme.colors.primary[500]);
      root.style.setProperty("--destructive", theme.colors.error[500]);
      root.style.setProperty(
        "--destructive-foreground",
        theme.mode === "light" ? theme.colors.neutral[0] : theme.colors.neutral[100]
      );

      // Update radius
      root.style.setProperty("--radius", theme.borderRadius["2xl"]);
    }
  }, [theme]);

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
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
