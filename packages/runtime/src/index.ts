// Ultra-lightweight form runtime (<30KB)
export const VERSION = "1.0.0";

// Main exports
export { FormViewer } from "./components/FormViewer";
export { useFormRuntime } from "./hooks";
export { OfflineService } from "./services/offline-service";
export { AnalyticsService } from "./services/analytics-service";
export { useResume, createResumeLink } from "./hooks/use-resume";

// Type exports
export type {
  FormSchema,
  FormSettings,
  Theme,
  BlockType,
  Block,
  ValidationRule,
  LogicRule,
  LogicCondition,
  LogicAction,
  FormState,
  RuntimeConfig,
  FormData,
} from "./types";

export type { AnalyticsEvent, AnalyticsConfig } from "./services/analytics-service";

// Utility exports
export { validateField, shouldShowBlock, formatValue } from "./utils";
export { generateStyles, injectStyles } from "./styles";

// Store exports (for advanced usage)
export { OfflineStore } from "./store";
