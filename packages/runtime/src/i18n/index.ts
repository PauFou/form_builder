import { useMemo } from "react";
import type { FormSchema, CustomMessages, SupportedLanguage } from "../types";
import { DEFAULT_MESSAGES } from "./messages";

/**
 * Hook to get translated messages for the form
 * Merges default translations with custom messages from form settings
 */
export function useFormTranslations(
  schema: FormSchema,
  overrideLocale?: SupportedLanguage
): CustomMessages {
  return useMemo(() => {
    const defaultLanguage = schema.settings?.defaultLanguage || "en";
    const activeLocale = overrideLocale || defaultLanguage;

    // Get default messages for the language
    const defaultMessages = DEFAULT_MESSAGES[activeLocale] || DEFAULT_MESSAGES.en;

    // Get custom messages for this specific language
    const customMessages = schema.settings?.customMessages?.[activeLocale] || {};

    // Merge custom messages over defaults
    return {
      ...defaultMessages,
      ...customMessages,
    };
  }, [schema.settings?.defaultLanguage, schema.settings?.customMessages, overrideLocale]);
}

/**
 * Interpolate template strings with variables
 * Example: "Number must be {min_number}" with {min_number: 5} => "Number must be 5"
 */
export function interpolate(message: string, variables: Record<string, string | number>): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, message);
}

export { DEFAULT_MESSAGES, SUPPORTED_LANGUAGES } from "./messages";
export type { SupportedLanguage, CustomMessages, LanguageConfig } from "../types";
