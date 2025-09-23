/**
 * Command Palette Provider
 * Provides global access to command palette functionality
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
import { CommandPalette } from "../ui/command-palette";
import { useCommandPalette } from "../../lib/hooks/use-command-palette";
import type { Command, CommandGroup, RecentItem } from "../../lib/types/command-palette";

interface CommandPaletteContextType {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commandGroups: CommandGroup[];
  selectedCommand: Command | null;
  totalCommands: number;
  recentItems: RecentItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  addRecentItem: (item: Omit<RecentItem, "accessedAt">) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const commandPalette = useCommandPalette();

  return (
    <CommandPaletteContext.Provider value={commandPalette}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPaletteContext must be used within CommandPaletteProvider");
  }
  return context;
}

// Hook for external components to trigger command palette
export function useCommandPaletteTrigger() {
  const { open, close, toggle, addRecentItem } = useCommandPaletteContext();

  return {
    openCommandPalette: open,
    closeCommandPalette: close,
    toggleCommandPalette: toggle,
    addRecentItem,
  };
}
