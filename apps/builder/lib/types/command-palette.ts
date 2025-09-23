/**
 * Command Palette types and interfaces
 */

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  keywords?: string[];
  category: CommandCategory;
  action: () => void | Promise<void>;
  shortcut?: readonly string[];
  disabled?: boolean;
  badge?: string;
}

export interface CommandGroup {
  category: CommandCategory;
  title: string;
  commands: Command[];
}

export type CommandCategory =
  | "navigation"
  | "forms"
  | "submissions"
  | "webhooks"
  | "settings"
  | "profile"
  | "templates"
  | "integrations"
  | "analytics"
  | "recent"
  | "shortcuts";

export interface RecentItem {
  id: string;
  type: "form" | "submission" | "template" | "webhook" | "page";
  title: string;
  url: string;
  accessedAt: string;
  icon?: string;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  recentItems: RecentItem[];
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  shortcut?: readonly string[];
  category: CommandCategory;
}

// Predefined shortcuts for common actions
export const KEYBOARD_SHORTCUTS = {
  // Global
  COMMAND_PALETTE: ["cmd+k", "ctrl+k"],
  SEARCH: ["cmd+shift+f", "ctrl+shift+f"],
  NEW_FORM: ["cmd+n", "ctrl+n"],

  // Navigation
  DASHBOARD: ["cmd+1", "ctrl+1"],
  FORMS: ["cmd+2", "ctrl+2"],
  TEMPLATES: ["cmd+3", "ctrl+3"],
  SUBMISSIONS: ["cmd+4", "ctrl+4"],
  ANALYTICS: ["cmd+5", "ctrl+5"],
  INTEGRATIONS: ["cmd+6", "ctrl+6"],
  SETTINGS: ["cmd+,", "ctrl+,"],

  // Actions
  SAVE: ["cmd+s", "ctrl+s"],
  UNDO: ["cmd+z", "ctrl+z"],
  REDO: ["cmd+shift+z", "ctrl+shift+z"],
  COPY: ["cmd+c", "ctrl+c"],
  PASTE: ["cmd+v", "ctrl+v"],

  // Webhooks
  WEBHOOK_MANAGEMENT: ["cmd+shift+w", "ctrl+shift+w"],
  REDRIVE_FAILED: ["cmd+shift+r", "ctrl+shift+r"],
} as const;

export const COMMAND_CATEGORIES: Record<CommandCategory, { title: string; icon: string }> = {
  navigation: { title: "Navigation", icon: "Compass" },
  forms: { title: "Forms", icon: "FileText" },
  submissions: { title: "Submissions", icon: "Send" },
  webhooks: { title: "Webhooks", icon: "Webhook" },
  settings: { title: "Settings", icon: "Settings" },
  profile: { title: "Profile", icon: "User" },
  templates: { title: "Templates", icon: "Layout" },
  integrations: { title: "Integrations", icon: "Zap" },
  analytics: { title: "Analytics", icon: "BarChart3" },
  recent: { title: "Recent", icon: "Clock" },
  shortcuts: { title: "Shortcuts", icon: "Command" },
};
