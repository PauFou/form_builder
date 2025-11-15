import { useEffect, useRef } from "react";
import { useFormBuilderStore } from "../stores/form-builder-store";
import { formsApi } from "../api/forms";
import { toast } from "react-hot-toast";

export function useAutoSave(formId: string, enabled: boolean = true) {
  const { form, isDirty, markClean } = useFormBuilderStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<Date>(new Date());
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isDirty || !form || isSavingRef.current) {
      return;
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 2 seconds after last change before saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;

        // Save to backend
        await formsApi.update(formId, {
          title: form.title,
          description: form.description,
          pages: form.pages,
          logic: form.logic,
          theme: form.theme,
          settings: form.settings,
        });

        lastSaveRef.current = new Date();
        markClean();

        // Show subtle success indicator
        const timeSinceLastSave = Date.now() - lastSaveRef.current.getTime();
        if (timeSinceLastSave > 10000) {
          // Only show toast if it's been more than 10 seconds since last save
          toast.success("Form saved", { duration: 1500, position: "bottom-right" });
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
        toast.error("Failed to save form. Please try again.", { duration: 3000 });
      } finally {
        isSavingRef.current = false;
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, form, formId, enabled, markClean]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (isDirty && form && !isSavingRef.current) {
        // Fire and forget save on unmount
        formsApi
          .update(formId, {
            title: form.title,
            description: form.description,
            pages: form.pages,
            logic: form.logic,
            theme: form.theme,
            settings: form.settings,
          })
          .catch((error) => {
            console.error("Failed to save on unmount:", error);
          });
      }
    };
  }, [isDirty, form, formId]);

  return {
    lastSave: lastSaveRef.current,
    isSaving: isSavingRef.current,
  };
}
