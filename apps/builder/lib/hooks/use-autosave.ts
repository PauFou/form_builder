import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { formsApi } from "../api/forms";
import { useFormBuilderStore } from "../stores/form-builder-store";

interface AutosaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

const AUTOSAVE_DELAY = 2000; // 2 seconds
const MIN_SAVE_INTERVAL = 1000; // 1 second minimum between saves

export function useAutosave(formId: string | null, delay = AUTOSAVE_DELAY) {
  const { form, isDirty, markClean } = useFormBuilderStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveAttemptRef = useRef<number>(0);
  const [status, setStatus] = useState<AutosaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const performSave = useCallback(async () => {
    // Prevent saving too frequently
    const now = Date.now();
    if (now - lastSaveAttemptRef.current < MIN_SAVE_INTERVAL) {
      return;
    }
    lastSaveAttemptRef.current = now;

    if (!formId || !form || !isDirty) return;

    setStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      // Save to API
      await formsApi.update(formId, {
        title: form.title,
        description: form.description,
        pages: form.pages,
        theme: form.theme,
        logic: form.logic,
        settings: form.settings,
      });

      const savedAt = new Date();
      markClean();
      setStatus({
        isSaving: false,
        lastSaved: savedAt,
        error: null,
      });

      // Show success feedback sparingly
      if (!status.lastSaved || Date.now() - status.lastSaved.getTime() > 10000) {
        toast.success("Changes saved", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
      console.error("Autosave failed:", error);
      setStatus((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      toast.error("Failed to save changes", {
        duration: 4000,
        position: "bottom-right",
      });
    }
  }, [form, isDirty, formId, markClean, status.lastSaved]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  useEffect(() => {
    if (!formId || !form || !isDirty) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(performSave, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, isDirty, formId, delay, performSave]);

  // Save on window blur or before unload
  useEffect(() => {
    const handleBlur = () => {
      if (isDirty) {
        saveNow();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        saveNow();
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, saveNow]);

  return {
    ...status,
    saveNow,
  };
}
