/**
 * Global Command Palette component
 * Provides Cmd+K quick access to navigation and actions
 */

"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, Input, Badge, Separator } from "@skemya/ui";
import {
  Search,
  Command as CommandIcon,
  ArrowRight,
  Clock,
  Zap,
  FileText,
  Send,
  Webhook,
  Settings,
  User,
  Layout,
  BarChart3,
  Home,
  Plus,
  Upload,
  RefreshCw,
  Activity,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Shield,
} from "lucide-react";
import { useCommandPalette } from "../../lib/hooks/use-command-palette";
import { cn } from "../../lib/utils";
import type { Command, CommandGroup } from "../../lib/types/command-palette";

const ICON_MAP = {
  Home,
  FileText,
  Layout,
  Send,
  BarChart3,
  Zap,
  Webhook,
  Settings,
  User,
  Clock,
  CommandIcon,
  Plus,
  Upload,
  RefreshCw,
  Activity,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Shield,
} as const;

function CommandPaletteItem({
  command,
  isSelected,
  onClick,
}: {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
}) {
  const IconComponent = ICON_MAP[command.icon as keyof typeof ICON_MAP] || CommandIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all duration-150",
        "hover:bg-muted/50 active:bg-muted",
        isSelected && "bg-primary/10 border border-primary/20",
        command.disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "font-medium text-sm truncate",
              isSelected ? "text-foreground" : "text-foreground"
            )}
          >
            {command.title}
          </p>
          {command.badge && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {command.badge}
            </Badge>
          )}
        </div>
        {command.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{command.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {command.shortcut && (
          <div className="hidden sm:flex items-center gap-1">
            {command.shortcut.map((key, index) => (
              <kbd
                key={index}
                className="px-2 py-1 text-xs font-mono bg-muted rounded border text-muted-foreground"
              >
                {key.replace("cmd", "⌘").replace("ctrl", "Ctrl").replace("shift", "⇧")}
              </kbd>
            ))}
          </div>
        )}
        <ArrowRight
          className={cn(
            "w-4 h-4 transition-colors",
            isSelected ? "text-primary" : "text-muted-foreground/50"
          )}
        />
      </div>
    </motion.div>
  );
}

function CommandPaletteGroup({
  group,
  selectedIndex,
  onCommandClick,
  startIndex,
}: {
  group: CommandGroup;
  selectedIndex: number;
  onCommandClick: (command: Command) => void;
  startIndex: number;
}) {
  return (
    <div className="py-2">
      <div className="px-4 py-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {group.title}
        </h3>
      </div>
      <div className="space-y-1 px-2">
        {group.commands.map((command, index) => (
          <CommandPaletteItem
            key={command.id}
            command={command}
            isSelected={selectedIndex === startIndex + index}
            onClick={() => onCommandClick(command)}
          />
        ))}
      </div>
    </div>
  );
}

export function CommandPalette() {
  const {
    isOpen,
    query,
    selectedIndex,
    commandGroups,
    selectedCommand,
    totalCommands,
    close,
    setQuery,
    setSelectedIndex,
  } = useCommandPalette();

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex(Math.min(selectedIndex + 1, totalCommands - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedCommand && !selectedCommand.disabled) {
            selectedCommand.action();
            close();
          }
          break;
        case "Escape":
          event.preventDefault();
          close();
          break;
      }
    },
    [selectedIndex, totalCommands, selectedCommand, setSelectedIndex, close]
  );

  const handleCommandClick = useCallback(
    (command: Command) => {
      if (!command.disabled) {
        command.action();
        close();
      }
    },
    [close]
  );

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      const input = document.querySelector("[data-command-palette-input]") as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" onKeyDown={handleKeyDown}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex flex-col max-h-[80vh]"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                data-command-palette-input
                placeholder="Search for commands, pages, or actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus:ring-0 text-base bg-transparent placeholder:text-muted-foreground"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border text-muted-foreground">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Commands List */}
            <div className="flex-1 overflow-y-auto">
              {commandGroups.length > 0 ? (
                <div className="py-2">
                  {commandGroups.map((group, groupIndex) => {
                    const startIndex = currentIndex;
                    currentIndex += group.commands.length;

                    return (
                      <div key={group.category}>
                        <CommandPaletteGroup
                          group={group}
                          selectedIndex={selectedIndex}
                          onCommandClick={handleCommandClick}
                          startIndex={startIndex}
                        />
                        {groupIndex < commandGroups.length - 1 && <Separator className="my-2" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-8 h-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No commands found for "{query}"</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try searching for pages, forms, or actions
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span>Powered by</span>
                <CommandIcon className="w-3 h-3" />
                <span className="font-medium">⌘K</span>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}
