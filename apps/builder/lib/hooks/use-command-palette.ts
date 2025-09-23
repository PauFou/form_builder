/**
 * Command Palette hook with state management and command registration
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import type {
  Command,
  CommandGroup,
  CommandPaletteState,
  RecentItem,
  CommandCategory,
} from "../types/command-palette";
import { KEYBOARD_SHORTCUTS } from "../types/command-palette";
import { useWebhookCommands } from "./use-webhook-commands";

const RECENT_ITEMS_KEY = "skemya-recent-items";
const MAX_RECENT_ITEMS = 10;

export function useCommandPalette() {
  const router = useRouter();
  const webhookCommands = useWebhookCommands();
  const [state, setState] = useState<CommandPaletteState>({
    isOpen: false,
    query: "",
    selectedIndex: 0,
    recentItems: [],
  });

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (stored) {
        const recentItems = JSON.parse(stored) as RecentItem[];
        setState((prev) => ({ ...prev, recentItems }));
      }
    } catch (error) {
      console.warn("Failed to load recent items:", error);
    }
  }, []);

  // Save recent items to localStorage
  const saveRecentItems = useCallback((items: RecentItem[]) => {
    try {
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to save recent items:", error);
    }
  }, []);

  // Add item to recent
  const addRecentItem = useCallback(
    (item: Omit<RecentItem, "accessedAt">) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const newItem: RecentItem = { ...item, accessedAt: now };

        // Remove existing item with same id if exists
        const filtered = prev.recentItems.filter((existing) => existing.id !== item.id);

        // Add new item at the beginning and limit to MAX_RECENT_ITEMS
        const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);

        saveRecentItems(updated);
        return { ...prev, recentItems: updated };
      });
    },
    [saveRecentItems]
  );

  // Base commands
  const baseCommands = useMemo(
    (): Command[] => [
      // Navigation
      {
        id: "nav-dashboard",
        title: "Dashboard",
        description: "Go to main dashboard",
        icon: "Home",
        category: "navigation",
        keywords: ["dashboard", "home", "main"],
        shortcut: KEYBOARD_SHORTCUTS.DASHBOARD,
        action: () => {
          router.push("/dashboard");
          addRecentItem({
            id: "dashboard",
            type: "page",
            title: "Dashboard",
            url: "/dashboard",
            icon: "Home",
          });
        },
      },
      {
        id: "nav-forms",
        title: "My Forms",
        description: "View and manage your forms",
        icon: "FileText",
        category: "navigation",
        keywords: ["forms", "list", "manage"],
        shortcut: KEYBOARD_SHORTCUTS.FORMS,
        action: () => {
          router.push("/forms");
          addRecentItem({
            id: "forms",
            type: "page",
            title: "My Forms",
            url: "/forms",
            icon: "FileText",
          });
        },
      },
      {
        id: "nav-templates",
        title: "Templates",
        description: "Browse form templates",
        icon: "Layout",
        category: "navigation",
        keywords: ["templates", "browse", "gallery"],
        shortcut: KEYBOARD_SHORTCUTS.TEMPLATES,
        action: () => {
          router.push("/templates");
          addRecentItem({
            id: "templates",
            type: "page",
            title: "Templates",
            url: "/templates",
            icon: "Layout",
          });
        },
      },
      {
        id: "nav-submissions",
        title: "Submissions",
        description: "View form submissions",
        icon: "Send",
        category: "navigation",
        keywords: ["submissions", "responses", "data"],
        action: () => {
          router.push("/submissions");
          addRecentItem({
            id: "submissions",
            type: "page",
            title: "Submissions",
            url: "/submissions",
            icon: "Send",
          });
        },
      },
      {
        id: "nav-analytics",
        title: "Analytics",
        description: "View analytics and insights",
        icon: "BarChart3",
        category: "navigation",
        keywords: ["analytics", "insights", "stats", "metrics"],
        shortcut: KEYBOARD_SHORTCUTS.ANALYTICS,
        action: () => {
          router.push("/analytics");
          addRecentItem({
            id: "analytics",
            type: "page",
            title: "Analytics",
            url: "/analytics",
            icon: "BarChart3",
          });
        },
      },
      {
        id: "nav-integrations",
        title: "Integrations",
        description: "Manage integrations and webhooks",
        icon: "Zap",
        category: "navigation",
        keywords: ["integrations", "webhooks", "connections"],
        shortcut: KEYBOARD_SHORTCUTS.INTEGRATIONS,
        action: () => {
          router.push("/integrations");
          addRecentItem({
            id: "integrations",
            type: "page",
            title: "Integrations",
            url: "/integrations",
            icon: "Zap",
          });
        },
      },
      {
        id: "nav-webhooks",
        title: "Webhook Management",
        description: "Monitor and manage webhook deliveries",
        icon: "Webhook",
        category: "webhooks",
        keywords: ["webhooks", "deliveries", "monitoring", "redrive"],
        shortcut: KEYBOARD_SHORTCUTS.WEBHOOK_MANAGEMENT,
        action: () => {
          router.push("/webhooks");
          addRecentItem({
            id: "webhooks",
            type: "page",
            title: "Webhook Management",
            url: "/webhooks",
            icon: "Webhook",
          });
        },
      },
      {
        id: "nav-settings",
        title: "Organization Settings",
        description: "Manage organization settings",
        icon: "Settings",
        category: "settings",
        keywords: ["settings", "organization", "team", "billing"],
        shortcut: KEYBOARD_SHORTCUTS.SETTINGS,
        action: () => {
          router.push("/settings");
          addRecentItem({
            id: "settings",
            type: "page",
            title: "Organization Settings",
            url: "/settings",
            icon: "Settings",
          });
        },
      },
      {
        id: "nav-profile",
        title: "Profile",
        description: "Manage your profile and account",
        icon: "User",
        category: "profile",
        keywords: ["profile", "account", "user", "personal"],
        action: () => {
          router.push("/profile");
          addRecentItem({
            id: "profile",
            type: "page",
            title: "Profile",
            url: "/profile",
            icon: "User",
          });
        },
      },

      // Quick Actions
      {
        id: "action-new-form",
        title: "Create New Form",
        description: "Start building a new form",
        icon: "Plus",
        category: "forms",
        keywords: ["new", "create", "form", "build"],
        shortcut: KEYBOARD_SHORTCUTS.NEW_FORM,
        action: () => {
          router.push("/forms/new");
          addRecentItem({
            id: "new-form",
            type: "form",
            title: "Create New Form",
            url: "/forms/new",
            icon: "Plus",
          });
        },
      },
      {
        id: "action-import-form",
        title: "Import Form",
        description: "Import from Typeform or Google Forms",
        icon: "Upload",
        category: "forms",
        keywords: ["import", "typeform", "google forms", "migrate"],
        action: () => {
          router.push("/forms?action=import");
        },
      },

      // Webhook Actions
      {
        id: "webhook-redrive-failed",
        title: "Redrive Failed Webhooks",
        description: "Retry all recent failed webhook deliveries",
        icon: "RefreshCw",
        category: "webhooks",
        keywords: ["redrive", "retry", "failed", "webhooks"],
        shortcut: KEYBOARD_SHORTCUTS.REDRIVE_FAILED,
        action: () => {
          router.push("/webhooks?filter=failed");
        },
      },
      {
        id: "webhook-stats",
        title: "Webhook Statistics",
        description: "View webhook delivery statistics",
        icon: "Activity",
        category: "webhooks",
        keywords: ["stats", "statistics", "webhooks", "monitoring"],
        action: () => {
          router.push("/webhooks");
        },
      },

      // Shortcuts reference
      {
        id: "shortcuts-help",
        title: "Keyboard Shortcuts",
        description: "View all available keyboard shortcuts",
        icon: "Command",
        category: "shortcuts",
        keywords: ["shortcuts", "keyboard", "hotkeys", "help"],
        action: () => {
          // This could open a shortcuts help modal
          console.log("Open shortcuts help");
        },
      },
    ],
    [router, addRecentItem]
  );

  // Combine base commands with webhook commands
  const allCommands = useMemo(() => {
    return [...baseCommands, ...webhookCommands];
  }, [baseCommands, webhookCommands]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!state.query.trim()) {
      return allCommands;
    }

    const query = state.query.toLowerCase().trim();
    return allCommands.filter((command) => {
      const searchFields = [command.title, command.description, ...(command.keywords || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchFields.includes(query);
    });
  }, [allCommands, state.query]);

  // Group commands by category
  const commandGroups = useMemo((): CommandGroup[] => {
    const groups = new Map<string, Command[]>();

    // Add recent items first if no query
    if (!state.query.trim() && state.recentItems.length > 0) {
      const recentCommands: Command[] = state.recentItems.map((item) => ({
        id: `recent-${item.id}`,
        title: item.title,
        description: `Go to ${item.title}`,
        icon: item.icon || "Clock",
        category: "recent" as const,
        keywords: [item.title.toLowerCase()],
        action: () => {
          router.push(item.url);
          addRecentItem(item);
        },
      }));
      groups.set("recent", recentCommands);
    }

    // Group filtered commands
    filteredCommands.forEach((command) => {
      const existing = groups.get(command.category) || [];
      groups.set(command.category, [...existing, command]);
    });

    // Convert to array and sort by priority
    const categoryOrder: CommandCategory[] = [
      "recent",
      "navigation",
      "forms",
      "submissions",
      "webhooks",
      "analytics",
      "integrations",
      "templates",
      "settings",
      "profile",
      "shortcuts",
    ];

    return categoryOrder
      .filter((category) => groups.has(category))
      .map((category) => ({
        category,
        title: getCategoryTitle(category),
        commands: groups.get(category)!,
      }));
  }, [filteredCommands, state.query, state.recentItems, router, addRecentItem]);

  // Open/close handlers
  const open = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true, query: "", selectedIndex: 0 }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, query: "", selectedIndex: 0 }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  // Search handler
  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query, selectedIndex: 0 }));
  }, []);

  // Selection handlers
  const setSelectedIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, selectedIndex: index }));
  }, []);

  // Get total commands count for navigation
  const totalCommands = useMemo(() => {
    return commandGroups.reduce((total, group) => total + group.commands.length, 0);
  }, [commandGroups]);

  // Get currently selected command
  const selectedCommand = useMemo(() => {
    let currentIndex = 0;
    for (const group of commandGroups) {
      if (currentIndex + group.commands.length > state.selectedIndex) {
        return group.commands[state.selectedIndex - currentIndex];
      }
      currentIndex += group.commands.length;
    }
    return null;
  }, [commandGroups, state.selectedIndex]);

  // Register global hotkey
  useHotkeys(
    KEYBOARD_SHORTCUTS.COMMAND_PALETTE.join(","),
    (event) => {
      event.preventDefault();
      toggle();
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"] }
  );

  return {
    isOpen: state.isOpen,
    query: state.query,
    selectedIndex: state.selectedIndex,
    commandGroups,
    selectedCommand,
    totalCommands,
    recentItems: state.recentItems,
    open,
    close,
    toggle,
    setQuery,
    setSelectedIndex,
    addRecentItem,
  };
}

function getCategoryTitle(category: CommandCategory): string {
  const titles: Record<CommandCategory, string> = {
    recent: "Recent",
    navigation: "Navigation",
    forms: "Forms",
    submissions: "Submissions",
    webhooks: "Webhooks",
    settings: "Settings",
    profile: "Profile",
    templates: "Templates",
    integrations: "Integrations",
    analytics: "Analytics",
    shortcuts: "Shortcuts",
  };
  return titles[category];
}
