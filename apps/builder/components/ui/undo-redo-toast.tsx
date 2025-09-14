"use client";

import { useEffect, useState } from "react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { cn } from "@forms/ui";
import { Undo, Redo } from "lucide-react";

interface ToastMessage {
  id: string;
  type: "undo" | "redo";
  timestamp: number;
}

export function UndoRedoToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const { historyIndex } = useFormBuilderStore();
  const [prevHistoryIndex, setPrevHistoryIndex] = useState(historyIndex);

  useEffect(() => {
    // Detect undo/redo actions by monitoring historyIndex changes
    if (prevHistoryIndex !== historyIndex) {
      const isUndo = historyIndex < prevHistoryIndex;
      const message: ToastMessage = {
        id: `${Date.now()}`,
        type: isUndo ? "undo" : "redo",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, message]);

      // Remove message after 2 seconds
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }, 2000);

      setPrevHistoryIndex(historyIndex);
    }
  }, [historyIndex, prevHistoryIndex]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg",
            "animate-in slide-in-from-bottom-2 fade-in duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-2"
          )}
        >
          {message.type === "undo" ? (
            <>
              <Undo className="h-4 w-4" />
              <span className="text-sm font-medium">Undo</span>
            </>
          ) : (
            <>
              <Redo className="h-4 w-4" />
              <span className="text-sm font-medium">Redo</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
