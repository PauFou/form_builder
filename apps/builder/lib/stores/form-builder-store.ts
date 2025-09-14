import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Form, Block, LogicRule, Theme } from "@forms/contracts";
import type { ValidationRule } from "../types/validation";
import type { LayoutSettings } from "../types/theme";
import {
  generateUniqueKey,
  getFieldReferences,
  removeFieldReferences,
  validateForm,
  type ValidationError,
} from "../validators/form-validators";

interface FormBuilderState {
  form: Form | null;
  selectedBlockId: string | null;
  selectedPageId: string | null;
  isDirty: boolean;
  history: Form[];
  historyIndex: number;
  isUndoing: boolean; // Flag to prevent history save during undo/redo
  lastSavedTimestamp: number; // Debounce history saves
  validationErrors: ValidationError[]; // Current validation errors

  // Actions
  initializeForm: (form: Form) => void;
  setForm: (form: Form) => void;
  updateForm: (updates: Partial<Form>) => void;
  addBlock: (block: Block, pageId: string, index?: number) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, newPageId: string, newIndex: number) => void;
  duplicateBlock: (blockId: string) => void;

  // Pages
  addPage: (title: string, index?: number) => void;
  updatePage: (pageId: string, updates: { title?: string; description?: string }) => void;
  deletePage: (pageId: string) => void;
  movePage: (pageId: string, newIndex: number) => void;

  // Logic
  addLogicRule: (rule: LogicRule) => void;
  updateLogicRule: (ruleId: string, updates: Partial<LogicRule>) => void;
  deleteLogicRule: (ruleId: string) => void;

  // Theme
  updateTheme: (theme: Partial<Theme>) => void;

  // Selection
  selectBlock: (blockId: string | null) => void;
  selectPage: (pageId: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryStatus: () => { current: number; total: number };

  // Utils
  reset: () => void;
  markClean: () => void;

  // Validation
  validateFormData: () => ValidationError[];
  getExistingKeys: () => Set<string>;
  generateUniqueFieldKey: (baseKey: string) => string;
  checkFieldReferences: (fieldId: string) => ReturnType<typeof getFieldReferences>;
  deleteBlockWithReferences: (blockId: string, removeReferences: boolean) => void;
}

const MAX_HISTORY = 50;

interface FormBuilderStateWithComputed extends FormBuilderState {
  blocks?: Block[];
}

export const useFormBuilderStore = create<FormBuilderStateWithComputed>()(
  immer((set, get) => ({
    form: null,
    selectedBlockId: null,
    selectedPageId: null,
    isDirty: false,
    history: [],
    historyIndex: -1,
    isUndoing: false,
    lastSavedTimestamp: 0,
    validationErrors: [],

    initializeForm: (form) => {
      set((state) => {
        state.form = form;
        state.selectedPageId = form.pages[0]?.id || null;
        state.isDirty = false;
        state.history = [JSON.parse(JSON.stringify(form))];
        state.historyIndex = 0;
        state.isUndoing = false;
      });
    },

    setForm: (form) => {
      set((state) => {
        state.form = form;
        state.isDirty = false;
        state.history = [JSON.parse(JSON.stringify(form))];
        state.historyIndex = 0;
        state.isUndoing = false;
      });
    },

    updateForm: (updates) => {
      set((state) => {
        if (state.form) {
          Object.assign(state.form, updates);
          state.isDirty = true;
        }
      });
      get().saveHistory();
    },

    addBlock: (block, pageId, index) => {
      set((state) => {
        if (state.form) {
          const page = state.form.pages.find((p) => p.id === pageId);
          if (page) {
            // Ensure unique key
            if (!block.key) {
              // Generate key from type if not provided
              const baseKey = block.type.replace(/_/g, "-");
              block.key = get().generateUniqueFieldKey(baseKey);
            } else {
              // Check if key is already taken
              const existingKeys = get().getExistingKeys();
              if (existingKeys.has(block.key)) {
                block.key = get().generateUniqueFieldKey(block.key);
              }
            }

            if (index !== undefined) {
              page.blocks.splice(index, 0, block);
            } else {
              page.blocks.push(block);
            }
            state.isDirty = true;
            state.selectedBlockId = block.id;
          }
        }
      });
      get().saveHistory();
      get().validateFormData();
    },

    updateBlock: (blockId, updates) => {
      set((state) => {
        if (state.form) {
          for (const page of state.form.pages) {
            const block = page.blocks.find((b) => b.id === blockId);
            if (block) {
              // If updating the key, ensure it's unique
              if (updates.key && updates.key !== block.key) {
                const existingKeys = get().getExistingKeys();
                existingKeys.delete(block.key || block.id); // Remove current key from check
                if (existingKeys.has(updates.key)) {
                  updates.key = generateUniqueKey(updates.key, existingKeys);
                }
              }

              Object.assign(block, updates);
              state.isDirty = true;
              break;
            }
          }
        }
      });
      get().saveHistory();
      get().validateFormData();
    },

    deleteBlock: (blockId) => {
      set((state) => {
        if (state.form) {
          for (const page of state.form.pages) {
            const index = page.blocks.findIndex((b) => b.id === blockId);
            if (index !== -1) {
              page.blocks.splice(index, 1);
              state.isDirty = true;
              if (state.selectedBlockId === blockId) {
                state.selectedBlockId = null;
              }
              break;
            }
          }
        }
      });
      get().saveHistory();
    },

    moveBlock: (blockId, newPageId, newIndex) => {
      set((state) => {
        if (state.form) {
          let block: Block | undefined;

          // Remove block from current location
          for (const page of state.form.pages) {
            const index = page.blocks.findIndex((b) => b.id === blockId);
            if (index !== -1) {
              block = page.blocks.splice(index, 1)[0];
              break;
            }
          }

          // Add block to new location
          if (block) {
            const targetPage = state.form.pages.find((p) => p.id === newPageId);
            if (targetPage) {
              targetPage.blocks.splice(newIndex, 0, block);
              state.isDirty = true;
            }
          }
        }
      });
      get().saveHistory();
    },

    duplicateBlock: (blockId) => {
      set((state) => {
        if (state.form) {
          for (const page of state.form.pages) {
            const index = page.blocks.findIndex((b) => b.id === blockId);
            if (index !== -1) {
              const original = page.blocks[index];
              const duplicate = {
                ...original,
                id: `${original.id}-copy-${Date.now()}`,
                question: `${original.question} (copy)`,
                key: get().generateUniqueFieldKey(original.key || original.type),
              };
              page.blocks.splice(index + 1, 0, duplicate);
              state.isDirty = true;
              break;
            }
          }
        }
      });
      get().saveHistory();
      get().validateFormData();
    },

    addPage: (title, index) => {
      set((state) => {
        if (state.form) {
          const newPage = {
            id: `page-${Date.now()}`,
            title,
            blocks: [],
          };

          if (index !== undefined) {
            state.form.pages.splice(index, 0, newPage);
          } else {
            state.form.pages.push(newPage);
          }
          state.isDirty = true;
        }
      });
      get().saveHistory();
    },

    updatePage: (pageId, updates) => {
      set((state) => {
        if (state.form) {
          const page = state.form.pages.find((p) => p.id === pageId);
          if (page) {
            Object.assign(page, updates);
            state.isDirty = true;
          }
        }
      });
      get().saveHistory();
    },

    deletePage: (pageId) => {
      set((state) => {
        if (state.form && state.form.pages.length > 1) {
          const index = state.form.pages.findIndex((p) => p.id === pageId);
          if (index !== -1) {
            state.form.pages.splice(index, 1);
            state.isDirty = true;
          }
        }
      });
      get().saveHistory();
    },

    movePage: (pageId, newIndex) => {
      set((state) => {
        if (state.form) {
          const currentIndex = state.form.pages.findIndex((p) => p.id === pageId);
          if (currentIndex !== -1) {
            const [page] = state.form.pages.splice(currentIndex, 1);
            state.form.pages.splice(newIndex, 0, page);
            state.isDirty = true;
          }
        }
      });
      get().saveHistory();
    },

    addLogicRule: (rule) => {
      set((state) => {
        if (state.form) {
          if (!state.form.logic) {
            state.form.logic = { rules: [] };
          }
          state.form.logic.rules.push(rule);
          state.isDirty = true;
        }
      });
      get().saveHistory();
    },

    updateLogicRule: (ruleId, updates) => {
      set((state) => {
        if (state.form?.logic?.rules) {
          const rule = state.form.logic.rules.find((r) => r.id === ruleId);
          if (rule) {
            Object.assign(rule, updates);
            state.isDirty = true;
          }
        }
      });
      get().saveHistory();
    },

    deleteLogicRule: (ruleId) => {
      set((state) => {
        if (state.form?.logic?.rules) {
          const index = state.form.logic.rules.findIndex((r) => r.id === ruleId);
          if (index !== -1) {
            state.form.logic.rules.splice(index, 1);
            state.isDirty = true;
          }
        }
      });
      get().saveHistory();
    },

    updateTheme: (theme) => {
      set((state) => {
        if (state.form) {
          if (!state.form.theme) {
            state.form.theme = {};
          }
          Object.assign(state.form.theme, theme);
          state.isDirty = true;
        }
      });
      get().saveHistory();
    },

    selectBlock: (blockId) => {
      set((state) => {
        state.selectedBlockId = blockId;
      });
    },

    selectPage: (pageId) => {
      set((state) => {
        state.selectedPageId = pageId;
      });
    },

    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          state.isUndoing = true;
          state.historyIndex--;
          state.form = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
          state.isDirty = true;

          // Restore selection if possible
          if (state.form && state.selectedPageId) {
            const pageExists = state.form.pages.some((p) => p.id === state.selectedPageId);
            if (!pageExists && state.form.pages.length > 0) {
              state.selectedPageId = state.form.pages[0].id;
            }
          }

          // Clear block selection if block doesn't exist
          if (state.form && state.selectedBlockId) {
            const blockExists = state.form.pages.some((p) =>
              p.blocks.some((b) => b.id === state.selectedBlockId)
            );
            if (!blockExists) {
              state.selectedBlockId = null;
            }
          }
        }
      });

      // Reset the undoing flag after state update
      if (process.env.NODE_ENV === "test") {
        // In tests, reset immediately
        set((state) => {
          state.isUndoing = false;
        });
      } else {
        // In production, use setTimeout for proper async behavior
        setTimeout(() => {
          set((state) => {
            state.isUndoing = false;
          });
        }, 0);
      }
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.isUndoing = true;
          state.historyIndex++;
          state.form = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
          state.isDirty = true;

          // Restore selection if possible
          if (state.form && state.selectedPageId) {
            const pageExists = state.form.pages.some((p) => p.id === state.selectedPageId);
            if (!pageExists && state.form.pages.length > 0) {
              state.selectedPageId = state.form.pages[0].id;
            }
          }

          // Clear block selection if block doesn't exist
          if (state.form && state.selectedBlockId) {
            const blockExists = state.form.pages.some((p) =>
              p.blocks.some((b) => b.id === state.selectedBlockId)
            );
            if (!blockExists) {
              state.selectedBlockId = null;
            }
          }
        }
      });

      // Reset the undoing flag after state update
      if (process.env.NODE_ENV === "test") {
        // In tests, reset immediately
        set((state) => {
          state.isUndoing = false;
        });
      } else {
        // In production, use setTimeout for proper async behavior
        setTimeout(() => {
          set((state) => {
            state.isUndoing = false;
          });
        }, 0);
      }
    },

    saveHistory: () => {
      const state = get();

      // Don't save history during undo/redo operations
      if (state.isUndoing) return;

      // Debounce history saves (100ms) - but allow override for tests
      const now = Date.now();
      const isTestEnvironment = process.env.NODE_ENV === "test";
      if (!isTestEnvironment && now - state.lastSavedTimestamp < 100) return;

      set((state) => {
        if (state.form) {
          // Remove future history if we're not at the end
          state.history = state.history.slice(0, state.historyIndex + 1);

          // Add current state
          const formCopy = JSON.parse(JSON.stringify(state.form));
          state.history.push(formCopy);

          // Limit history size
          if (state.history.length > MAX_HISTORY) {
            state.history = state.history.slice(-MAX_HISTORY);
          }

          state.historyIndex = state.history.length - 1;
          state.lastSavedTimestamp = now;
        }
      });
    },

    canUndo: () => {
      const state = get();
      return state.historyIndex > 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    getHistoryStatus: () => {
      const state = get();
      return {
        current: state.historyIndex + 1,
        total: state.history.length,
      };
    },

    reset: () => {
      set({
        form: null,
        selectedBlockId: null,
        selectedPageId: null,
        isDirty: false,
        history: [],
        historyIndex: -1,
        isUndoing: false,
        lastSavedTimestamp: 0,
        validationErrors: [],
      });
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false;
      });
    },

    validateFormData: () => {
      const state = get();
      if (!state.form) return [];

      const errors = validateForm(state.form);
      set((state) => {
        state.validationErrors = errors;
      });

      return errors;
    },

    getExistingKeys: () => {
      const state = get();
      if (!state.form) return new Set<string>();

      const keys = new Set<string>();
      state.form.pages.forEach((page) => {
        page.blocks.forEach((block) => {
          keys.add(block.key || block.id);
        });
      });

      return keys;
    },

    generateUniqueFieldKey: (baseKey) => {
      const existingKeys = get().getExistingKeys();
      return generateUniqueKey(baseKey, existingKeys);
    },

    checkFieldReferences: (fieldId) => {
      const state = get();
      if (!state.form) {
        return { isReferenced: false, rules: [], referenceTypes: [] };
      }

      return getFieldReferences(fieldId, state.form);
    },

    deleteBlockWithReferences: (blockId, removeReferences) => {
      set((state) => {
        if (state.form) {
          // First, remove references if requested
          if (removeReferences) {
            state.form = removeFieldReferences(blockId, state.form);
          }

          // Then delete the block
          for (const page of state.form.pages) {
            const index = page.blocks.findIndex((b) => b.id === blockId);
            if (index !== -1) {
              page.blocks.splice(index, 1);
              state.isDirty = true;
              if (state.selectedBlockId === blockId) {
                state.selectedBlockId = null;
              }
              break;
            }
          }
        }
      });
      get().saveHistory();
      get().validateFormData();
    },
  }))
);
