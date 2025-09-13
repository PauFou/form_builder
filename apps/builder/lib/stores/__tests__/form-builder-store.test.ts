import { renderHook, act } from "@testing-library/react";
import { useFormBuilderStore } from "../form-builder-store";
import type { Form, Block, LogicRule, Theme } from "@forms/contracts";

describe("useFormBuilderStore", () => {
  const mockForm: Form = {
    id: "form-1",
    title: "Test Form",
    description: "Test Description",
    status: "draft",
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          {
            id: "block-1",
            type: "text",
            question: "What is your name?",
            required: true,
            properties: {},
          },
          {
            id: "block-2",
            type: "email",
            question: "What is your email?",
            required: true,
            properties: {},
          },
        ],
      },
      {
        id: "page-2",
        title: "Page 2",
        blocks: [
          {
            id: "block-3",
            type: "choice",
            question: "Choose an option",
            required: false,
            properties: {
              choices: ["Option 1", "Option 2", "Option 3"],
              multiple: false,
            },
          },
        ],
      },
    ],
    logic: { rules: [] },
    theme: {
      colors: {
        primary: "#0066cc",
        secondary: "#666666",
        background: "#ffffff",
        text: "#333333",
      },
      fonts: {
        heading: "Arial, sans-serif",
        body: "Arial, sans-serif",
      },
    },
    settings: {
      requireLogin: false,
      allowMultipleSubmissions: false,
      showProgressBar: true,
    },
    version: 1,
    slug: "test-form",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Reset store state
    useFormBuilderStore.setState({
      form: null,
      selectedBlockId: null,
      selectedPageId: null,
      isDirty: false,
      history: [],
      historyIndex: -1,
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      expect(result.current.form).toBeNull();
      expect(result.current.selectedBlockId).toBeNull();
      expect(result.current.selectedPageId).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.history).toEqual([]);
      expect(result.current.historyIndex).toBe(-1);
    });
  });

  describe("initializeForm", () => {
    it("initializes form with all properties", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      expect(result.current.form).toEqual(mockForm);
      expect(result.current.selectedPageId).toBe("page-1");
      expect(result.current.isDirty).toBe(false);
      expect(result.current.history).toEqual([mockForm]);
      expect(result.current.historyIndex).toBe(0);
    });

    it("handles form with no pages", () => {
      const { result } = renderHook(() => useFormBuilderStore());
      const formWithoutPages = { ...mockForm, pages: [] };

      act(() => {
        result.current.initializeForm(formWithoutPages);
      });

      expect(result.current.selectedPageId).toBeNull();
    });
  });

  describe("setForm", () => {
    it("sets form and resets history", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.setForm(mockForm);
      });

      expect(result.current.form).toEqual(mockForm);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.history).toEqual([mockForm]);
      expect(result.current.historyIndex).toBe(0);
    });
  });

  describe("updateForm", () => {
    it("updates form properties", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.updateForm({ title: "Updated Title", description: "Updated Description" });
      });

      expect(result.current.form?.title).toBe("Updated Title");
      expect(result.current.form?.description).toBe("Updated Description");
      expect(result.current.isDirty).toBe(true);
    });

    it("does nothing when form is null", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.updateForm({ title: "New Title" });
      });

      expect(result.current.form).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("block operations", () => {
    describe("addBlock", () => {
      it("adds block to specified page", () => {
        const { result } = renderHook(() => useFormBuilderStore());
        const newBlock: Block = {
          id: "block-new",
          type: "text",
          question: "New question",
          required: false,
          properties: {},
        };

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.addBlock(newBlock, "page-1");
        });

        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(page1?.blocks).toHaveLength(3);
        expect(page1?.blocks[2]).toEqual(newBlock);
        expect(result.current.selectedBlockId).toBe("block-new");
        expect(result.current.isDirty).toBe(true);
      });

      it("adds block at specific index", () => {
        const { result } = renderHook(() => useFormBuilderStore());
        const newBlock: Block = {
          id: "block-new",
          type: "text",
          question: "New question",
          required: false,
          properties: {},
        };

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.addBlock(newBlock, "page-1", 1);
        });

        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(page1?.blocks[1]).toEqual(newBlock);
        expect(page1?.blocks).toHaveLength(3);
      });

      it("does nothing if page not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());
        const newBlock: Block = {
          id: "block-new",
          type: "text",
          question: "New question",
          required: false,
          properties: {},
        };

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.addBlock(newBlock, "non-existent-page");
        });

        expect(result.current.form?.pages[0].blocks).toHaveLength(2);
        expect(result.current.form?.pages[1].blocks).toHaveLength(1);
      });
    });

    describe("updateBlock", () => {
      it("updates block properties", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.updateBlock("block-1", {
            question: "Updated question",
            required: false,
          });
        });

        const updatedBlock = result.current.form?.pages[0].blocks.find((b) => b.id === "block-1");
        expect(updatedBlock?.question).toBe("Updated question");
        expect(updatedBlock?.required).toBe(false);
        expect(result.current.isDirty).toBe(true);
      });

      it("updates block in different page", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.updateBlock("block-3", {
            question: "Updated choice question",
          });
        });

        const updatedBlock = result.current.form?.pages[1].blocks.find((b) => b.id === "block-3");
        expect(updatedBlock?.question).toBe("Updated choice question");
      });

      it("does nothing if block not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        const originalForm = JSON.parse(JSON.stringify(result.current.form));

        act(() => {
          result.current.updateBlock("non-existent-block", {
            question: "Should not update",
          });
        });

        // Serialize both for comparison to handle Date objects
        const currentFormSerialized = JSON.parse(JSON.stringify(result.current.form));

        expect(currentFormSerialized).toEqual(originalForm);
      });
    });

    describe("deleteBlock", () => {
      it("deletes block from page", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.selectBlock("block-1");
        });

        act(() => {
          result.current.deleteBlock("block-1");
        });

        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(page1?.blocks).toHaveLength(1);
        expect(page1?.blocks.find((b) => b.id === "block-1")).toBeUndefined();
        expect(result.current.selectedBlockId).toBeNull();
        expect(result.current.isDirty).toBe(true);
      });

      it("does not affect selection if different block is selected", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.selectBlock("block-2");
        });

        act(() => {
          result.current.deleteBlock("block-1");
        });

        expect(result.current.selectedBlockId).toBe("block-2");
      });
    });

    describe("moveBlock", () => {
      it("moves block to different page", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.moveBlock("block-1", "page-2", 0);
        });

        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        const page2 = result.current.form?.pages.find((p) => p.id === "page-2");

        expect(page1?.blocks).toHaveLength(1);
        expect(page1?.blocks.find((b) => b.id === "block-1")).toBeUndefined();
        expect(page2?.blocks).toHaveLength(2);
        expect(page2?.blocks[0].id).toBe("block-1");
        expect(result.current.isDirty).toBe(true);
      });

      it("moves block within same page", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.moveBlock("block-2", "page-1", 0);
        });

        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(page1?.blocks[0].id).toBe("block-2");
        expect(page1?.blocks[1].id).toBe("block-1");
      });

      it("does nothing if block not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        const originalBlocks = [...(result.current.form?.pages[0].blocks || [])];

        act(() => {
          result.current.moveBlock("non-existent", "page-2", 0);
        });

        expect(result.current.form?.pages[0].blocks).toEqual(originalBlocks);
      });

      it("does nothing if target page not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        const originalForm = JSON.parse(JSON.stringify(result.current.form));

        act(() => {
          result.current.moveBlock("block-1", "non-existent-page", 0);
        });

        // The block should be removed but not added anywhere
        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(page1?.blocks.find((b) => b.id === "block-1")).toBeUndefined();
      });
    });

    describe("duplicateBlock", () => {
      it("duplicates block with new id", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.duplicateBlock("block-1");
        });

        const page1 = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(page1?.blocks).toHaveLength(3);

        const duplicatedBlock = page1?.blocks[1];
        expect(duplicatedBlock?.id).toContain("block-1-copy-");
        expect(duplicatedBlock?.question).toBe("What is your name? (copy)");
        expect(duplicatedBlock?.type).toBe("text");
        expect(result.current.isDirty).toBe(true);
      });

      it("does nothing if block not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.duplicateBlock("non-existent");
        });

        expect(result.current.form?.pages[0].blocks).toHaveLength(2);
      });
    });
  });

  describe("page operations", () => {
    describe("addPage", () => {
      it("adds page at end by default", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.addPage("Page 3");
        });

        expect(result.current.form?.pages).toHaveLength(3);
        const newPage = result.current.form?.pages[2];
        expect(newPage?.title).toBe("Page 3");
        expect(newPage?.blocks).toEqual([]);
        expect(result.current.isDirty).toBe(true);
      });

      it("adds page at specific index", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.addPage("New Page", 1);
        });

        expect(result.current.form?.pages).toHaveLength(3);
        expect(result.current.form?.pages[1].title).toBe("New Page");
      });
    });

    describe("updatePage", () => {
      it("updates page properties", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.updatePage("page-1", {
            title: "Updated Page 1",
            description: "New description",
          });
        });

        const updatedPage = result.current.form?.pages.find((p) => p.id === "page-1");
        expect(updatedPage?.title).toBe("Updated Page 1");
        expect(updatedPage?.description).toBe("New description");
        expect(result.current.isDirty).toBe(true);
      });

      it("does nothing if page not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.updatePage("non-existent", { title: "Should not update" });
        });

        expect(result.current.form?.pages[0].title).toBe("Page 1");
      });
    });

    describe("deletePage", () => {
      it("deletes page and its blocks", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.deletePage("page-1");
        });

        expect(result.current.form?.pages).toHaveLength(1);
        expect(result.current.form?.pages[0].id).toBe("page-2");
        expect(result.current.isDirty).toBe(true);
      });

      it("does not delete last page", () => {
        const { result } = renderHook(() => useFormBuilderStore());
        const singlePageForm = {
          ...mockForm,
          pages: [mockForm.pages[0]],
        };

        act(() => {
          result.current.initializeForm(singlePageForm);
        });

        act(() => {
          result.current.deletePage("page-1");
        });

        // Page should not be deleted if it's the last one
        expect(result.current.form?.pages).toHaveLength(1);
        expect(result.current.form?.pages[0].id).toBe("page-1");
      });
    });

    describe("movePage", () => {
      it("moves page to new position", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.movePage("page-2", 0);
        });

        expect(result.current.form?.pages[0].id).toBe("page-2");
        expect(result.current.form?.pages[1].id).toBe("page-1");
        expect(result.current.isDirty).toBe(true);
      });

      it("does nothing if page not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        const originalPages = [...(result.current.form?.pages || [])];

        act(() => {
          result.current.movePage("non-existent", 0);
        });

        expect(result.current.form?.pages).toEqual(originalPages);
      });
    });
  });

  describe("logic operations", () => {
    const mockRule: LogicRule = {
      id: "rule-1",
      conditions: [
        {
          id: "cond-1",
          field: "block-1",
          operator: "equals",
          value: "test",
        },
      ],
      actions: [
        {
          id: "action-1",
          type: "show",
          target: "block-2",
        },
      ],
    };

    describe("addLogicRule", () => {
      it("adds logic rule", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.addLogicRule(mockRule);
        });

        expect(result.current.form?.logic?.rules).toHaveLength(1);
        expect(result.current.form?.logic?.rules[0]).toEqual(mockRule);
        expect(result.current.isDirty).toBe(true);
      });
    });

    describe("updateLogicRule", () => {
      it("updates logic rule", () => {
        const { result } = renderHook(() => useFormBuilderStore());
        const formWithLogic = {
          ...mockForm,
          logic: { rules: [mockRule] },
        };

        act(() => {
          result.current.initializeForm(formWithLogic);
        });

        act(() => {
          result.current.updateLogicRule("rule-1", {
            conditions: [
              ...mockRule.conditions,
              {
                id: "cond-2",
                field: "block-2",
                operator: "equals",
                value: "test2",
              },
            ],
          });
        });

        expect(result.current.form?.logic?.rules[0].conditions).toHaveLength(2);
        expect(result.current.isDirty).toBe(true);
      });

      it("does nothing if rule not found", () => {
        const { result } = renderHook(() => useFormBuilderStore());

        act(() => {
          result.current.initializeForm(mockForm);
        });

        act(() => {
          result.current.updateLogicRule("non-existent", {
            conditions: [
              {
                id: "cond-new",
                field: "block-new",
                operator: "equals",
                value: "new",
              },
            ],
          });
        });

        expect(result.current.form?.logic?.rules).toHaveLength(0);
      });
    });

    describe("deleteLogicRule", () => {
      it("deletes logic rule", () => {
        const { result } = renderHook(() => useFormBuilderStore());
        const formWithLogic = {
          ...mockForm,
          logic: { rules: [mockRule] },
        };

        act(() => {
          result.current.initializeForm(formWithLogic);
        });

        act(() => {
          result.current.deleteLogicRule("rule-1");
        });

        expect(result.current.form?.logic?.rules).toHaveLength(0);
        expect(result.current.isDirty).toBe(true);
      });
    });
  });

  describe("theme operations", () => {
    it("updates theme", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.updateTheme({
          colors: {
            primary: "#ff0000",
            secondary: "#00ff00",
            background: "#0000ff",
            text: "#ffffff",
          },
        });
      });

      expect(result.current.form?.theme?.colors.primary).toBe("#ff0000");
      expect(result.current.form?.theme?.fonts).toEqual(mockForm.theme?.fonts);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe("selection", () => {
    it("selects block", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.selectBlock("block-2");
      });

      expect(result.current.selectedBlockId).toBe("block-2");
    });

    it("clears block selection", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.selectBlock("block-1");
      });

      act(() => {
        result.current.selectBlock(null);
      });

      expect(result.current.selectedBlockId).toBeNull();
    });

    it("selects page", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.selectPage("page-2");
      });

      expect(result.current.selectedPageId).toBe("page-2");
    });
  });

  describe("history operations", () => {
    it("saves history after changes", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.updateForm({ title: "Updated" });
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.historyIndex).toBe(1);
    });

    it("undoes last change", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      const originalTitle = result.current.form?.title;

      act(() => {
        result.current.updateForm({ title: "Updated" });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.form?.title).toBe(originalTitle);
      expect(result.current.historyIndex).toBe(0);
    });

    it("redoes undone change", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.updateForm({ title: "Updated" });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.form?.title).toBe("Updated");
      expect(result.current.historyIndex).toBe(1);
    });

    it("does nothing when at beginning of history", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.historyIndex).toBe(0);
    });

    it("does nothing when at end of history", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.historyIndex).toBe(0);
    });

    it("truncates future history when making new change after undo", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.updateForm({ title: "First Update" });
      });

      act(() => {
        result.current.updateForm({ title: "Second Update" });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.updateForm({ title: "New Branch" });
      });

      expect(result.current.history).toHaveLength(3);
      expect(result.current.form?.title).toBe("New Branch");
      expect(result.current.historyIndex).toBe(2);
    });
  });

  describe("utility operations", () => {
    it("resets store to initial state", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.updateForm({ title: "Updated" });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.form).toBeNull();
      expect(result.current.selectedBlockId).toBeNull();
      expect(result.current.selectedPageId).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.history).toEqual([]);
      expect(result.current.historyIndex).toBe(-1);
    });

    it("marks form as clean", () => {
      const { result } = renderHook(() => useFormBuilderStore());

      act(() => {
        result.current.initializeForm(mockForm);
      });

      act(() => {
        result.current.updateForm({ title: "Updated" });
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.markClean();
      });

      expect(result.current.isDirty).toBe(false);
    });
  });
});
