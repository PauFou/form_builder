// Ultra-lightweight form runtime (<30KB)
export const VERSION = "1.0.0";

// Main exports
export { FormViewer } from "./components/FormViewer";
export { GridFormViewer } from "./components/GridFormViewer";
export { FormViewerWrapper } from "./components/FormViewerWrapper";
export { ModeSwitcher } from "./components/ModeSwitcher";
export { SaveStatus } from "./components/SaveStatus";
export { ResumeBanner } from "./components/ResumeBanner";
export { FormViewer as FormRenderer } from "./components/FormViewer"; // Alias for compatibility
export { useFormRuntime } from "./hooks";
export { OfflineService } from "./services/offline-service";
export { PartialSaveService } from "./services/partial-save-service";
export { AnalyticsService } from "./services/analytics-service";
export { antiSpamService, AntiSpamService } from "./services/anti-spam-service";
export { useResume, createResumeLink } from "./hooks/use-resume";
export { useAntiSpam } from "./hooks/use-anti-spam";
export { PopoverEmbed, DrawerEmbed, embedStyles } from "./embed-modes";

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
export { ExpressionEngine, evaluate, validateExpression } from "./expression-engine";
export { migrateBlock, migrateFormSchema, needsMigration } from "./migration";

// Store exports (for advanced usage)
export { OfflineStore } from "./store";
