import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system", // Default to system theme
      isDark: false,

      setTheme: (theme: Theme) => {
        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove("light", "dark");

        let isDark = false;

        if (theme === "system") {
          // Use system preference
          isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        } else {
          isDark = theme === "dark";
        }

        // Apply theme
        root.classList.add(isDark ? "dark" : "light");

        set({ theme, isDark });
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === "light" ? "dark" : "light";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.setTheme) {
          // Apply theme on page load
          state.setTheme(state.theme);
        }
      },
    }
  )
);
