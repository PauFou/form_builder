import { useEffect } from "react";

import { useFormBuilderStore } from "../stores/form-builder-store";

export function useKeyboardShortcuts() {
  const { undo, redo, form, selectedBlockId, deleteBlock } = useFormBuilderStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl key check
      const isCmd = e.metaKey || e.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (isCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if (isCmd && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected block: Delete or Backspace
      if (selectedBlockId && (e.key === "Delete" || e.key === "Backspace")) {
        // Only delete if not focused on an input
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          deleteBlock(selectedBlockId);
        }
        return;
      }

      // Command palette: Cmd/Ctrl + K
      if (isCmd && e.key === "k") {
        e.preventDefault();
        // TODO: Open command palette
        console.log("Open command palette");
        return;
      }

      // Save: Cmd/Ctrl + S
      if (isCmd && e.key === "s") {
        e.preventDefault();
        // Autosave handles this, but we can trigger manual save
        console.log("Manual save triggered");
        return;
      }

      // Preview: Cmd/Ctrl + P
      if (isCmd && e.key === "p") {
        e.preventDefault();
        // Emit custom event for preview toggle
        window.dispatchEvent(new CustomEvent("toggle-preview"));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, form, selectedBlockId, deleteBlock]);
}
