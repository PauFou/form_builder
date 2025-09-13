import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface GDPRState {
  // Export state
  exportStatus: "idle" | "loading" | "success" | "error";
  exportProgress: number;
  exportError?: string;
  exportData: (userId: string, format: "json" | "csv") => Promise<{ data: any; format: string }>;

  // Deletion state
  deletionStatus: "idle" | "loading" | "success" | "error";
  deletionError?: string;
  deleteData: (userId: string) => Promise<void>;

  // Reset functions
  resetExportStatus: () => void;
  resetDeletionStatus: () => void;
}

export const useGDPRStore = create<GDPRState>()(
  devtools(
    (set) => ({
      // Export state
      exportStatus: "idle",
      exportProgress: 0,
      exportError: undefined,

      exportData: async (userId: string, format: "json" | "csv") => {
        set({ exportStatus: "loading", exportProgress: 0, exportError: undefined });

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            set((state) => ({
              exportProgress: Math.min(state.exportProgress + 10, 90),
            }));
          }, 100);

          // Mock API call
          const response = await fetch(`/api/gdpr/export/${userId}?format=${format}`);

          if (!response.ok) {
            throw new Error("Failed to export data");
          }

          const data = await response.json();

          clearInterval(progressInterval);
          set({ exportStatus: "success", exportProgress: 100 });

          return { data, format };
        } catch (error) {
          set({
            exportStatus: "error",
            exportError: error instanceof Error ? error.message : "Unknown error",
            exportProgress: 0,
          });
          throw error;
        }
      },

      // Deletion state
      deletionStatus: "idle",
      deletionError: undefined,

      deleteData: async (userId: string) => {
        set({ deletionStatus: "loading", deletionError: undefined });

        try {
          // Mock API call
          const response = await fetch(`/api/gdpr/delete/${userId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete data");
          }

          set({ deletionStatus: "success" });
        } catch (error) {
          set({
            deletionStatus: "error",
            deletionError: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },

      // Reset functions
      resetExportStatus: () => {
        set({
          exportStatus: "idle",
          exportProgress: 0,
          exportError: undefined,
        });
      },

      resetDeletionStatus: () => {
        set({
          deletionStatus: "idle",
          deletionError: undefined,
        });
      },
    }),
    {
      name: "gdpr-store",
    }
  )
);
