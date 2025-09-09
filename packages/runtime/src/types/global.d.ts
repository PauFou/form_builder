// Global type declarations for form runtime
import { FormRuntime } from "../index";

declare global {
  interface Window {
    FormRuntime: typeof FormRuntime;
    Forms: {
      load: (options: EmbedOptions) => void;
      version: string;
    };
  }
}

interface EmbedOptions {
  formId: string;
  container?: string | HTMLElement;
  mode?: "inline" | "popup" | "drawer";
  theme?: Record<string, string>;
  onReady?: () => void;
  onSubmit?: (data: any) => void;
}

export {};
