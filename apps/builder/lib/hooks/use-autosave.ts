import { useEffect, useRef } from 'react';
import { useFormBuilderStore } from '../stores/form-builder-store';
import { toast } from 'react-hot-toast';

export function useAutosave(formId: string | null, delay = 1000) {
  const { form, isDirty, markClean } = useFormBuilderStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!formId || !form || !isDirty) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Simulate API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In production, this would be:
        // await api.forms.update(formId, form);
        
        markClean();
        console.log('Form autosaved');
      } catch (error) {
        console.error('Autosave failed:', error);
        toast.error('Failed to save changes');
      }
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, isDirty, formId, delay, markClean]);
}