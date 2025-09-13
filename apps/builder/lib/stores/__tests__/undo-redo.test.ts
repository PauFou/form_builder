import { renderHook, act } from "@testing-library/react";
import { useFormBuilderStore } from "../form-builder-store";
import type { Form, Block } from "@forms/contracts";

describe("Undo/Redo functionality", () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useFormBuilderStore.getState().reset();
    });
  });

  const createTestForm = (): Form => ({
    id: "test-form",
    title: "Test Form",
    description: "Test Description",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          {
            id: "block-1",
            type: "short_text",
            question: "Question 1",
            required: false,
          },
        ],
      },
    ],
    settings: {
      showProgressBar: true,
      allowBackNavigation: true,
      autoSaveProgress: false,
      language: "en",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  test("should initialize with empty history", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    
    expect(result.current.history).toHaveLength(0);
    expect(result.current.historyIndex).toBe(-1);
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  test("should add form to history on initialization", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  test("should save history when form is modified", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    act(() => {
      result.current.updateForm({ title: "Updated Title" });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo()).toBe(true);
    expect(result.current.canRedo()).toBe(false);
  });

  test("should undo changes", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    act(() => {
      result.current.updateForm({ title: "Updated Title" });
    });

    expect(result.current.form?.title).toBe("Updated Title");

    act(() => {
      result.current.undo();
    });

    expect(result.current.form?.title).toBe("Test Form");
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(true);
  });

  test("should redo changes", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    act(() => {
      result.current.updateForm({ title: "Updated Title" });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(result.current.form?.title).toBe("Updated Title");
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo()).toBe(true);
    expect(result.current.canRedo()).toBe(false);
  });

  test("should limit history to 50 entries", async () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    // Add 60 changes
    for (let i = 0; i < 60; i++) {
      act(() => {
        result.current.updateForm({ title: `Title ${i}` });
      });
    }

    expect(result.current.history).toHaveLength(50);
    expect(result.current.form?.title).toBe("Title 59");
  });

  test("should clear future history when making changes after undo", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    act(() => {
      result.current.updateForm({ title: "Title 1" });
    });

    act(() => {
      result.current.updateForm({ title: "Title 2" });
    });

    expect(result.current.history).toHaveLength(3);

    act(() => {
      result.current.undo();
    });

    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canRedo()).toBe(true);

    act(() => {
      result.current.updateForm({ title: "Title 3" });
    });

    expect(result.current.history).toHaveLength(3); // Original + Title 1 + Title 3
    expect(result.current.form?.title).toBe("Title 3");
    expect(result.current.canRedo()).toBe(false);
  });

  test("should handle block operations with undo/redo", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    const newBlock: Block = {
      id: "block-2",
      type: "email",
      question: "Email Question",
      required: true,
    };

    act(() => {
      result.current.addBlock(newBlock, "page-1");
    });

    expect(result.current.form?.pages[0].blocks).toHaveLength(2);

    act(() => {
      result.current.undo();
    });

    expect(result.current.form?.pages[0].blocks).toHaveLength(1);

    act(() => {
      result.current.redo();
    });

    expect(result.current.form?.pages[0].blocks).toHaveLength(2);
    expect(result.current.form?.pages[0].blocks[1].id).toBe("block-2");
  });

  test("should preserve selection state appropriately during undo/redo", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
      result.current.selectBlock("block-1");
    });

    act(() => {
      result.current.deleteBlock("block-1");
    });

    expect(result.current.selectedBlockId).toBe(null);

    act(() => {
      result.current.undo();
    });

    // Block selection should be cleared after undo since it was deleted
    expect(result.current.selectedBlockId).toBe(null);
    expect(result.current.form?.pages[0].blocks).toHaveLength(1);
  });

  test("should not save history during undo/redo operations", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    act(() => {
      result.current.updateForm({ title: "Title 1" });
    });

    const historyLength = result.current.history.length;

    act(() => {
      result.current.undo();
    });

    // History length should not change during undo
    expect(result.current.history.length).toBe(historyLength);
  });

  test("getHistoryStatus should return correct status", () => {
    const { result } = renderHook(() => useFormBuilderStore());
    const testForm = createTestForm();

    act(() => {
      result.current.initializeForm(testForm);
    });

    let status = result.current.getHistoryStatus();
    expect(status).toEqual({ current: 1, total: 1 });

    act(() => {
      result.current.updateForm({ title: "Title 1" });
    });

    status = result.current.getHistoryStatus();
    expect(status).toEqual({ current: 2, total: 2 });

    act(() => {
      result.current.undo();
    });

    status = result.current.getHistoryStatus();
    expect(status).toEqual({ current: 1, total: 2 });
  });
});