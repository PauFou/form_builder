"use client";

import { useState, useEffect } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@forms/ui";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  Square,
  Star,
  Plus,
  GitBranch,
  Eye,
  Save,
  Play,
  Undo,
  Redo,
  Copy,
  Trash2,
  Clock,
  Link,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import type { Block } from "@forms/contracts";

const blockCommands = [
  { icon: Type, type: "short_text", label: "Add Short Text", category: "blocks" },
  { icon: AlignLeft, type: "long_text", label: "Add Long Text", category: "blocks" },
  { icon: Mail, type: "email", label: "Add Email", category: "blocks" },
  { icon: Phone, type: "phone", label: "Add Phone", category: "blocks" },
  { icon: Hash, type: "number", label: "Add Number", category: "blocks" },
  { icon: Calendar, type: "date", label: "Add Date", category: "blocks" },
  { icon: Clock, type: "time", label: "Add Time", category: "blocks" },
  { icon: Link, type: "url", label: "Add URL", category: "blocks" },
  { icon: ChevronDown, type: "dropdown", label: "Add Dropdown", category: "blocks" },
  { icon: Circle, type: "single_select", label: "Add Single Select", category: "blocks" },
  { icon: Square, type: "multi_select", label: "Add Multi Select", category: "blocks" },
  { icon: Star, type: "rating", label: "Add Rating", category: "blocks" },
];

const actionCommands = [
  { icon: Plus, action: "add_page", label: "Add New Page", category: "actions" },
  { icon: GitBranch, action: "add_logic", label: "Add Logic Rule", category: "actions" },
  { icon: Eye, action: "preview", label: "Preview Form", category: "actions" },
  { icon: Save, action: "save", label: "Save Form", category: "actions" },
  { icon: Play, action: "publish", label: "Publish Form", category: "actions" },
  { icon: Undo, action: "undo", label: "Undo", category: "actions" },
  { icon: Redo, action: "redo", label: "Redo", category: "actions" },
  { icon: Copy, action: "duplicate", label: "Duplicate Selected Block", category: "actions" },
  { icon: Trash2, action: "delete", label: "Delete Selected Block", category: "actions" },
  { icon: ArrowUp, action: "move_up", label: "Move Block Up", category: "actions" },
  { icon: ArrowDown, action: "move_down", label: "Move Block Down", category: "actions" },
];

interface CommandPaletteProps {
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
}

export function CommandPalette({ onSave, onPreview, onPublish }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const {
    form,
    selectedBlockId,
    selectedPageId,
    addBlock,
    addPage,
    addLogicRule,
    duplicateBlock,
    deleteBlock,
    moveBlock,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFormBuilderStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleAddBlock = (type: string) => {
    if (!form || !form.pages.length || !selectedPageId) return;

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: type as Block["type"],
      question: `New ${type.replace("_", " ")} question`,
      required: false,
    };

    addBlock(newBlock, selectedPageId);
    setOpen(false);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "add_page":
        addPage(`Page ${(form?.pages.length || 0) + 1}`);
        break;
      case "add_logic":
        if (selectedBlockId) {
          addLogicRule({
            id: `rule-${Date.now()}`,
            conditions: [
              {
                id: `condition-${Date.now()}`,
                field: selectedBlockId,
                operator: "equals",
                value: "",
              },
            ],
            actions: [],
          });
        }
        break;
      case "preview":
        onPreview?.();
        break;
      case "save":
        onSave?.();
        break;
      case "publish":
        onPublish?.();
        break;
      case "undo":
        undo();
        break;
      case "redo":
        redo();
        break;
      case "duplicate":
        if (selectedBlockId) {
          duplicateBlock(selectedBlockId);
        }
        break;
      case "delete":
        if (selectedBlockId) {
          deleteBlock(selectedBlockId);
        }
        break;
      case "move_up":
        if (selectedBlockId && selectedPageId && form) {
          const currentPage = form.pages.find((p) => p.id === selectedPageId);
          if (currentPage) {
            const blockIndex = currentPage.blocks.findIndex((b) => b.id === selectedBlockId);
            if (blockIndex > 0) {
              moveBlock(selectedBlockId, selectedPageId, blockIndex - 1);
            }
          }
        }
        break;
      case "move_down":
        if (selectedBlockId && selectedPageId && form) {
          const currentPage = form.pages.find((p) => p.id === selectedPageId);
          if (currentPage) {
            const blockIndex = currentPage.blocks.findIndex((b) => b.id === selectedBlockId);
            if (blockIndex < currentPage.blocks.length - 1) {
              moveBlock(selectedBlockId, selectedPageId, blockIndex + 1);
            }
          }
        }
        break;
    }
    setOpen(false);
  };

  const filteredActionCommands = actionCommands.filter((cmd) => {
    if (cmd.action === "undo" && !canUndo()) return false;
    if (cmd.action === "redo" && !canRedo()) return false;
    if ((cmd.action === "duplicate" || cmd.action === "delete") && !selectedBlockId) return false;
    if (cmd.action === "add_logic" && !selectedBlockId) return false;

    // Handle move actions
    if ((cmd.action === "move_up" || cmd.action === "move_down") && !selectedBlockId) return false;
    if (cmd.action === "move_up" && selectedBlockId && selectedPageId && form) {
      const currentPage = form.pages.find((p) => p.id === selectedPageId);
      if (currentPage) {
        const blockIndex = currentPage.blocks.findIndex((b) => b.id === selectedBlockId);
        if (blockIndex <= 0) return false;
      }
    }
    if (cmd.action === "move_down" && selectedBlockId && selectedPageId && form) {
      const currentPage = form.pages.find((p) => p.id === selectedPageId);
      if (currentPage) {
        const blockIndex = currentPage.blocks.findIndex((b) => b.id === selectedBlockId);
        if (blockIndex >= currentPage.blocks.length - 1) return false;
      }
    }

    return true;
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Add Blocks">
          {blockCommands.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem key={command.type} onSelect={() => handleAddBlock(command.type)}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{command.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {filteredActionCommands.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem key={command.action} onSelect={() => handleAction(command.action)}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{command.label}</span>
                {command.action === "preview" && (
                  <span className="ml-auto text-xs text-muted-foreground">⌘P</span>
                )}
                {command.action === "save" && (
                  <span className="ml-auto text-xs text-muted-foreground">⌘S</span>
                )}
                {command.action === "undo" && (
                  <span className="ml-auto text-xs text-muted-foreground">⌘Z</span>
                )}
                {command.action === "redo" && (
                  <span className="ml-auto text-xs text-muted-foreground">⇧⌘Z</span>
                )}
                {command.action === "duplicate" && (
                  <span className="ml-auto text-xs text-muted-foreground">⌘D</span>
                )}
                {command.action === "delete" && (
                  <span className="ml-auto text-xs text-muted-foreground">Delete</span>
                )}
                {command.action === "move_up" && (
                  <span className="ml-auto text-xs text-muted-foreground">↑</span>
                )}
                {command.action === "move_down" && (
                  <span className="ml-auto text-xs text-muted-foreground">↓</span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
