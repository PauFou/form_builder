import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "../use-keyboard-shortcuts";
import { useFormBuilderStore } from "../../stores/form-builder-store";

// Mock the store
jest.mock("../../stores/form-builder-store");

describe("useKeyboardShortcuts", () => {
  const mockUndo = jest.fn();
  const mockRedo = jest.fn();
  const mockDeleteBlock = jest.fn();
  const mockDuplicateBlock = jest.fn();
  const mockMoveBlock = jest.fn();
  const mockForm = { 
    id: "test-form", 
    title: "Test", 
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          { id: "block-1", type: "short_text", question: "Question 1" },
          { id: "block-2", type: "short_text", question: "Question 2" },
          { id: "block-3", type: "short_text", question: "Question 3" }
        ]
      }
    ] 
  };

  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();

    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      undo: mockUndo,
      redo: mockRedo,
      form: mockForm,
      selectedBlockId: null,
      selectedPageId: "page-1",
      deleteBlock: mockDeleteBlock,
      duplicateBlock: mockDuplicateBlock,
      moveBlock: mockMoveBlock,
    });

    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    dispatchEventSpy.mockRestore();
  });

  const createKeyboardEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent("keydown", {
      key,
      ...options,
    });
    // Mock preventDefault method
    event.preventDefault = jest.fn();
    return event;
  };

  it("registers keydown event listener on mount", () => {
    renderHook(() => useKeyboardShortcuts());

    expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("removes keydown event listener on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  describe("keyboard shortcuts", () => {
    let handleKeyDown: (e: KeyboardEvent) => void;

    beforeEach(() => {
      renderHook(() => useKeyboardShortcuts());
      handleKeyDown = addEventListenerSpy.mock.calls[0][1];
    });

    describe("undo/redo", () => {
      it("triggers undo on Cmd+Z", () => {
        const event = createKeyboardEvent("z", { metaKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockUndo).toHaveBeenCalled();
        expect(mockRedo).not.toHaveBeenCalled();
      });

      it("triggers undo on Ctrl+Z", () => {
        const event = createKeyboardEvent("z", { ctrlKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockUndo).toHaveBeenCalled();
      });

      it("triggers redo on Cmd+Shift+Z", () => {
        const event = createKeyboardEvent("z", { metaKey: true, shiftKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockRedo).toHaveBeenCalled();
        expect(mockUndo).not.toHaveBeenCalled();
      });

      it("triggers redo on Ctrl+Shift+Z", () => {
        const event = createKeyboardEvent("z", { ctrlKey: true, shiftKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockRedo).toHaveBeenCalled();
      });
    });

    describe("duplicate block", () => {
      it("duplicates selected block on Cmd+D", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-2",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("d", { metaKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockDuplicateBlock).toHaveBeenCalledWith("block-2");
      });

      it("duplicates selected block on Ctrl+D", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-2",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("d", { ctrlKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockDuplicateBlock).toHaveBeenCalledWith("block-2");
      });

      it("does not duplicate when no block is selected", () => {
        const event = createKeyboardEvent("d", { metaKey: true });
        handleKeyDown(event);

        expect(mockDuplicateBlock).not.toHaveBeenCalled();
      });
    });

    describe("delete block", () => {
      it("deletes selected block on Delete key", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-123",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("Delete");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockDeleteBlock).toHaveBeenCalledWith("block-123");
      });

      it("deletes selected block on Backspace key", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-123",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("Backspace");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockDeleteBlock).toHaveBeenCalledWith("block-123");
      });

      it("does not delete when focused on input", () => {
        const event = createKeyboardEvent("Delete");
        Object.defineProperty(event, "target", {
          value: { tagName: "INPUT" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockDeleteBlock).not.toHaveBeenCalled();
      });

      it("does not delete when focused on textarea", () => {
        const event = createKeyboardEvent("Backspace");
        Object.defineProperty(event, "target", {
          value: { tagName: "TEXTAREA" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockDeleteBlock).not.toHaveBeenCalled();
      });

      it("does not delete when no block is selected", () => {
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: null,
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        const event = createKeyboardEvent("Delete");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(mockDeleteBlock).not.toHaveBeenCalled();
      });
    });

    describe("reorder blocks", () => {
      it("moves block up on ArrowUp key", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-2",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("ArrowUp");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockMoveBlock).toHaveBeenCalledWith("block-2", "page-1", 0);
      });

      it("moves block down on ArrowDown key", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-2",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("ArrowDown");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockMoveBlock).toHaveBeenCalledWith("block-2", "page-1", 2);
      });

      it("does not move first block up", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-1",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("ArrowUp");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockMoveBlock).not.toHaveBeenCalled();
      });

      it("does not move last block down", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-3",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("ArrowDown");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockMoveBlock).not.toHaveBeenCalled();
      });

      it("does not reorder when focused on input", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-2",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("ArrowUp");
        Object.defineProperty(event, "target", {
          value: { tagName: "INPUT" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockMoveBlock).not.toHaveBeenCalled();
      });

      it("does not reorder when focused on textarea", () => {
        // Update the mock to include selectedBlockId
        (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
          undo: mockUndo,
          redo: mockRedo,
          form: mockForm,
          selectedBlockId: "block-2",
          selectedPageId: "page-1",
          deleteBlock: mockDeleteBlock,
          duplicateBlock: mockDuplicateBlock,
          moveBlock: mockMoveBlock,
        });

        // Re-render the hook to pick up the new state
        renderHook(() => useKeyboardShortcuts());
        handleKeyDown =
          addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1];

        const event = createKeyboardEvent("ArrowDown");
        Object.defineProperty(event, "target", {
          value: { tagName: "TEXTAREA" },
          writable: true,
        });
        handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockMoveBlock).not.toHaveBeenCalled();
      });

      it("does not reorder when no block is selected", () => {
        const event = createKeyboardEvent("ArrowUp");
        Object.defineProperty(event, "target", {
          value: { tagName: "DIV" },
          writable: true,
        });
        handleKeyDown(event);

        expect(mockMoveBlock).not.toHaveBeenCalled();
      });
    });

    describe("other shortcuts", () => {
      it("logs command palette on Cmd+K", () => {
        const event = createKeyboardEvent("k", { metaKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith("Open command palette");
      });

      it("logs manual save on Cmd+S", () => {
        const event = createKeyboardEvent("s", { metaKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith("Manual save triggered");
      });

      it("dispatches preview toggle event on Cmd+P", () => {
        const event = createKeyboardEvent("p", { metaKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "toggle-preview",
          })
        );
      });

      it("works with Ctrl key instead of Cmd", () => {
        const event = createKeyboardEvent("k", { ctrlKey: true });
        handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith("Open command palette");
      });
    });

    it("ignores non-shortcut keys", () => {
      const event = createKeyboardEvent("a");
      handleKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockUndo).not.toHaveBeenCalled();
      expect(mockRedo).not.toHaveBeenCalled();
      expect(mockDeleteBlock).not.toHaveBeenCalled();
    });

    it("ignores shortcuts without modifier keys", () => {
      const event = createKeyboardEvent("z");
      handleKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockUndo).not.toHaveBeenCalled();
    });
  });

  it("updates event listener when dependencies change", () => {
    const { rerender } = renderHook(() => useKeyboardShortcuts());

    // Update store mock with new functions
    const newUndo = jest.fn();
    const newRedo = jest.fn();
    (useFormBuilderStore as unknown as jest.Mock).mockReturnValue({
      undo: newUndo,
      redo: newRedo,
      form: mockForm,
      selectedBlockId: "new-block",
      selectedPageId: "page-1",
      deleteBlock: mockDeleteBlock,
      duplicateBlock: mockDuplicateBlock,
      moveBlock: mockMoveBlock,
    });

    rerender();

    // Should have removed old and added new listener
    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });
});
