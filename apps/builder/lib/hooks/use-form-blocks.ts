import { useFormBuilderStore } from "../stores/form-builder-store";
import { useMemo } from "react";
import type { Block } from "@forms/contracts";

export function useFormBlocks(): Block[] {
  const form = useFormBuilderStore((state) => state.form);

  return useMemo(() => {
    if (!form) return [];
    return form.pages.flatMap((page) => page.blocks);
  }, [form]);
}
