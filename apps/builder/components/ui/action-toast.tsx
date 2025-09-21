"use client";

import { useEffect, useState } from "react";
import { cn } from "@skemya/ui";
import { Undo, Redo, Copy, Trash2, ArrowUp, ArrowDown, Save, Eye, Command } from "lucide-react";

export interface ActionMessage {
  id: string;
  type:
    | "undo"
    | "redo"
    | "duplicate"
    | "delete"
    | "move-up"
    | "move-down"
    | "save"
    | "preview"
    | "command-palette";
  message?: string;
  timestamp: number;
}

interface ActionToastProps {
  message: ActionMessage | null;
}

const actionConfig = {
  undo: {
    icon: Undo,
    text: "Undo",
    className: "bg-gray-900",
  },
  redo: {
    icon: Redo,
    text: "Redo",
    className: "bg-gray-900",
  },
  duplicate: {
    icon: Copy,
    text: "Block duplicated",
    className: "bg-blue-600",
  },
  delete: {
    icon: Trash2,
    text: "Block deleted",
    className: "bg-red-600",
  },
  "move-up": {
    icon: ArrowUp,
    text: "Block moved up",
    className: "bg-purple-600",
  },
  "move-down": {
    icon: ArrowDown,
    text: "Block moved down",
    className: "bg-purple-600",
  },
  save: {
    icon: Save,
    text: "Form saved",
    className: "bg-green-600",
  },
  preview: {
    icon: Eye,
    text: "Preview toggled",
    className: "bg-indigo-600",
  },
  "command-palette": {
    icon: Command,
    text: "Command palette",
    className: "bg-gray-900",
  },
};

export function ActionToast({ message }: ActionToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  const config = actionConfig[message.type];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-lg",
          "animate-in slide-in-from-bottom-2 fade-in duration-200",
          config.className
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{message.message || config.text}</span>
      </div>
    </div>
  );
}

// Hook to use action toast
export function useActionToast() {
  const [message, setMessage] = useState<ActionMessage | null>(null);

  const showToast = (type: ActionMessage["type"], customMessage?: string) => {
    const newMessage: ActionMessage = {
      id: `${Date.now()}`,
      type,
      message: customMessage,
      timestamp: Date.now(),
    };
    setMessage(newMessage);
  };

  return { message, showToast };
}
