import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { useFormBuilderStore } from "../stores/form-builder-store";

interface AutosaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useAutosave(formId: string | null, delay = 1000) {
  const { form, isDirty, markClean } = useFormBuilderStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [status, setStatus] = useState<AutosaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  useEffect(() => {
    if (!formId || !form || !isDirty) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      setStatus((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        // Simulate API call - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        // In production, this would be:
        // await api.forms.update(formId, form);

        const savedAt = new Date();
        markClean();
        setStatus((prev) => ({
          ...prev,
          isSaving: false,
          lastSaved: savedAt,
          error: null,
        }));
        console.log("Form autosaved");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
        console.error("Autosave failed:", error);
        setStatus((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));
        toast.error("Failed to save changes");
      }
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, isDirty, formId, delay, markClean]);

  return status;
}
