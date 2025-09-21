import { describe, it, expect, beforeEach } from "@jest/globals";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import type { Form } from "@skemya/contracts";

describe("FormBuilderStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useFormBuilderStore.getState().reset();
  });

  describe("initializeForm", () => {
    it("should initialize a form and set selectedPageId", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [
          { id: "page-1", title: "Page 1", blocks: [] },
          { id: "page-2", title: "Page 2", blocks: [] },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useFormBuilderStore.getState().initializeForm(mockForm);

      const state = useFormBuilderStore.getState();
      expect(state.form).toEqual(mockForm);
      expect(state.selectedPageId).toBe("page-1");
      expect(state.isDirty).toBe(false);
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });
  });

  describe("addBlock", () => {
    it("should add a block to the specified page", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useFormBuilderStore.getState().initializeForm(mockForm);

      const newBlock = {
        id: "block-1",
        type: "short_text" as const,
        question: "What is your name?",
        required: true,
      };

      useFormBuilderStore.getState().addBlock(newBlock, "page-1");

      const state = useFormBuilderStore.getState();
      expect(state.form?.pages[0].blocks).toHaveLength(1);
      expect(state.form?.pages[0].blocks[0]).toEqual(newBlock);
      expect(state.selectedBlockId).toBe("block-1");
      expect(state.isDirty).toBe(true);
    });

    it("should add block at specific index", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [
          {
            id: "page-1",
            title: "Page 1",
            blocks: [
              { id: "block-1", type: "short_text", question: "Q1" },
              { id: "block-2", type: "short_text", question: "Q2" },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useFormBuilderStore.getState().initializeForm(mockForm);

      const newBlock = {
        id: "block-3",
        type: "email" as const,
        question: "Email?",
      };

      useFormBuilderStore.getState().addBlock(newBlock, "page-1", 1);

      const blocks = useFormBuilderStore.getState().form?.pages[0].blocks;
      expect(blocks).toHaveLength(3);
      expect(blocks?.[1].id).toBe("block-3");
    });
  });

  describe("updateBlock", () => {
    it("should update block properties", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [
          {
            id: "page-1",
            title: "Page 1",
            blocks: [{ id: "block-1", type: "short_text", question: "Original question" }],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useFormBuilderStore.getState().initializeForm(mockForm);
      useFormBuilderStore.getState().updateBlock("block-1", {
        question: "Updated question",
        required: true,
        description: "New description",
      });

      const block = useFormBuilderStore.getState().form?.pages[0].blocks[0];
      expect(block?.question).toBe("Updated question");
      expect(block?.required).toBe(true);
      expect(block?.description).toBe("New description");
    });
  });

  describe("deleteBlock", () => {
    it("should remove block from page", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [
          {
            id: "page-1",
            title: "Page 1",
            blocks: [
              { id: "block-1", type: "short_text", question: "Q1" },
              { id: "block-2", type: "short_text", question: "Q2" },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useFormBuilderStore.getState().initializeForm(mockForm);
      useFormBuilderStore.getState().selectBlock("block-1");
      useFormBuilderStore.getState().deleteBlock("block-1");

      const state = useFormBuilderStore.getState();
      expect(state.form?.pages[0].blocks).toHaveLength(1);
      expect(state.form?.pages[0].blocks[0].id).toBe("block-2");
      expect(state.selectedBlockId).toBe(null);
    });
  });

  describe("moveBlock", () => {
    it("should move block between pages", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [
          {
            id: "page-1",
            title: "Page 1",
            blocks: [{ id: "block-1", type: "short_text", question: "Q1" }],
          },
          {
            id: "page-2",
            title: "Page 2",
            blocks: [],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useFormBuilderStore.getState().initializeForm(mockForm);
      useFormBuilderStore.getState().moveBlock("block-1", "page-2", 0);

      const state = useFormBuilderStore.getState();
      expect(state.form?.pages[0].blocks).toHaveLength(0);
      expect(state.form?.pages[1].blocks).toHaveLength(1);
      expect(state.form?.pages[1].blocks[0].id).toBe("block-1");
    });
  });

  describe("undo/redo", () => {
    it("should undo and redo changes", () => {
      const mockForm: Form = {
        id: "1",
        title: "Test Form",
        pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const store = useFormBuilderStore.getState();
      store.initializeForm(mockForm);

      // Make a change
      const newBlock = {
        id: "block-1",
        type: "short_text" as const,
        question: "Test question",
      };
      store.addBlock(newBlock, "page-1");

      // Undo
      store.undo();
      const stateAfterUndo = useFormBuilderStore.getState();
      expect(stateAfterUndo.form?.pages[0].blocks).toHaveLength(0);

      // Redo
      store.redo();
      const stateAfterRedo = useFormBuilderStore.getState();
      expect(stateAfterRedo.form?.pages[0].blocks).toHaveLength(1);
      expect(stateAfterRedo.form?.pages[0].blocks[0].id).toBe("block-1");
    });
  });
});
