import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Form, Block, LogicRule, Theme } from '@forms/contracts';

interface FormBuilderState {
  form: Form | null;
  selectedBlockId: string | null;
  selectedPageId: string | null;
  isDirty: boolean;
  history: Form[];
  historyIndex: number;

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

  // History
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  // Utils
  reset: () => void;
  markClean: () => void;
}

const MAX_HISTORY = 50;

export const useFormBuilderStore = create<FormBuilderState>()(
  immer((set, get) => ({
    form: null,
    selectedBlockId: null,
    selectedPageId: null,
    isDirty: false,
    history: [],
    historyIndex: -1,

    initializeForm: (form) => {
      set((state) => {
        state.form = form;
        state.selectedPageId = form.pages[0]?.id || null;
        state.isDirty = false;
        state.history = [form];
        state.historyIndex = 0;
      });
    },

    setForm: (form) => {
      set((state) => {
        state.form = form;
        state.isDirty = false;
        state.history = [form];
        state.historyIndex = 0;
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
          const page = state.form.pages.find(p => p.id === pageId);
          if (page) {
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
    },

    updateBlock: (blockId, updates) => {
      set((state) => {
        if (state.form) {
          for (const page of state.form.pages) {
            const block = page.blocks.find(b => b.id === blockId);
            if (block) {
              Object.assign(block, updates);
              state.isDirty = true;
              break;
            }
          }
        }
      });
      get().saveHistory();
    },

    deleteBlock: (blockId) => {
      set((state) => {
        if (state.form) {
          for (const page of state.form.pages) {
            const index = page.blocks.findIndex(b => b.id === blockId);
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
            const index = page.blocks.findIndex(b => b.id === blockId);
            if (index !== -1) {
              block = page.blocks.splice(index, 1)[0];
              break;
            }
          }
          
          // Add block to new location
          if (block) {
            const targetPage = state.form.pages.find(p => p.id === newPageId);
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
            const index = page.blocks.findIndex(b => b.id === blockId);
            if (index !== -1) {
              const original = page.blocks[index];
              const duplicate = {
                ...original,
                id: `${original.id}-copy-${Date.now()}`,
                question: `${original.question} (copy)`,
              };
              page.blocks.splice(index + 1, 0, duplicate);
              state.isDirty = true;
              break;
            }
          }
        }
      });
      get().saveHistory();
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
          const page = state.form.pages.find(p => p.id === pageId);
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
          const index = state.form.pages.findIndex(p => p.id === pageId);
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
          const currentIndex = state.form.pages.findIndex(p => p.id === pageId);
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
        if (state.form?.logic) {
          const rule = state.form.logic.rules.find(r => r.id === ruleId);
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
        if (state.form?.logic) {
          const index = state.form.logic.rules.findIndex(r => r.id === ruleId);
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

    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.form = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
          state.isDirty = true;
        }
      });
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.form = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
          state.isDirty = true;
        }
      });
    },

    saveHistory: () => {
      set((state) => {
        if (state.form) {
          // Remove future history if we're not at the end
          state.history = state.history.slice(0, state.historyIndex + 1);
          
          // Add current state
          state.history.push(JSON.parse(JSON.stringify(state.form)));
          
          // Limit history size
          if (state.history.length > MAX_HISTORY) {
            state.history = state.history.slice(-MAX_HISTORY);
          }
          
          state.historyIndex = state.history.length - 1;
        }
      });
    },

    reset: () => {
      set({
        form: null,
        selectedBlockId: null,
        selectedPageId: null,
        isDirty: false,
        history: [],
        historyIndex: -1,
      });
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false;
      });
    },
  }))
);