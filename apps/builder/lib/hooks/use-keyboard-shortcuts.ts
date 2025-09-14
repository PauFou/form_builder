import { useEffect } from "react";

import { useFormBuilderStore } from "../stores/form-builder-store";

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    form,
    selectedBlockId,
    selectedPageId,
    deleteBlock,
    duplicateBlock,
    moveBlock,
  } = useFormBuilderStore();

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
          window.dispatchEvent(
            new CustomEvent("keyboard-action", {
              detail: { type: "delete" },
            })
          );
        }
        return;
      }

      // Duplicate block: Cmd/Ctrl + D
      if (isCmd && e.key === "d" && selectedBlockId) {
        e.preventDefault();
        duplicateBlock(selectedBlockId);
        window.dispatchEvent(
          new CustomEvent("keyboard-action", {
            detail: { type: "duplicate" },
          })
        );
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

      // Reorder blocks with arrow keys
      if (
        selectedBlockId &&
        selectedPageId &&
        form &&
        (e.key === "ArrowUp" || e.key === "ArrowDown")
      ) {
        // Only reorder if not focused on an input
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          const currentPage = form.pages.find((p) => p.id === selectedPageId);
          if (!currentPage) return;

          const blockIndex = currentPage.blocks.findIndex((b) => b.id === selectedBlockId);
          if (blockIndex === -1) return;

          if (e.key === "ArrowUp" && blockIndex > 0) {
            e.preventDefault();
            moveBlock(selectedBlockId, selectedPageId, blockIndex - 1);
            window.dispatchEvent(
              new CustomEvent("keyboard-action", {
                detail: { type: "move-up" },
              })
            );
          } else if (e.key === "ArrowDown" && blockIndex < currentPage.blocks.length - 1) {
            e.preventDefault();
            moveBlock(selectedBlockId, selectedPageId, blockIndex + 1);
            window.dispatchEvent(
              new CustomEvent("keyboard-action", {
                detail: { type: "move-down" },
              })
            );
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, form, selectedBlockId, selectedPageId, deleteBlock, duplicateBlock, moveBlock]);
}
