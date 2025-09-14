import { useEffect } from "react";
import { useFormBuilderStore } from "../stores/form-builder-store";

interface UseUndoRedoShortcutsOptions {
  onSave?: () => void;
  onPreview?: () => void;
}

export function useUndoRedoShortcuts(options?: UseUndoRedoShortcutsOptions) {
  const { undo, redo, canUndo, canRedo } = useFormBuilderStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Don't handle shortcuts while typing
      if (isTyping) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (modifierKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((modifierKey && e.shiftKey && e.key === "z") || (modifierKey && e.key === "y")) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }

      // Save: Cmd/Ctrl + S
      if (modifierKey && e.key === "s") {
        e.preventDefault();
        options?.onSave?.();
      }

      // Preview: Cmd/Ctrl + P
      if (modifierKey && e.key === "p") {
        e.preventDefault();
        options?.onPreview?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo, options]);
}
