"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { formsApi } from "../../../lib/api/forms";
import { THEME_PRESETS, THEME_CATEGORIES, ThemePreset, ThemeCategory } from "./theme-presets";
import type { DesignSettings } from "./DesignPanel";
import type { Form } from "@skemya/contracts";

interface ThemeGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "gallery" | "my-forms";

// Convert form theme to ThemePreset format
function formToThemePreset(form: Form): ThemePreset | null {
  const theme = form.theme as Partial<DesignSettings> | undefined;
  if (!theme?.colors) return null;

  return {
    id: `form-${form.id}`,
    name: form.title,
    description: `Theme from "${form.title}"`,
    category: "professional",
    designSettings: {
      colors: {
        background: theme.colors?.background || "#ffffff",
        questions: theme.colors?.questions || "#1a1a1a",
        answers: theme.colors?.answers || "#374151",
        buttons: theme.colors?.buttons || "#4f46e5",
        buttonText: theme.colors?.buttonText || "#ffffff",
        starRating: theme.colors?.starRating || "#f59e0b",
      },
      alignment: theme.alignment || "left",
      font: theme.font || "Inter",
      fontSize: theme.fontSize || "medium",
      cornerStyle: theme.cornerStyle || "normal",
      backgroundImage: theme.backgroundImage || null,
      logo: theme.logo || null,
    },
  };
}

// Mini form preview component for theme cards
function ThemeCardPreview({ theme }: { theme: ThemePreset }) {
  const { designSettings } = theme;
  const cornerRadius =
    designSettings.cornerStyle === "very_rounded"
      ? "12px"
      : designSettings.cornerStyle === "rounded"
        ? "8px"
        : designSettings.cornerStyle === "normal"
          ? "4px"
          : "0px";

  return (
    <div
      className="w-full aspect-[4/3] p-2 sm:p-3 flex flex-col justify-center items-center gap-1.5 sm:gap-2"
      style={{
        backgroundColor: designSettings.colors.background,
        fontFamily: designSettings.font,
      }}
    >
      {/* Mini title */}
      <div
        className="text-[8px] sm:text-[10px] font-medium text-center leading-tight truncate w-full px-1"
        style={{ color: designSettings.colors.questions }}
      >
        What's your name?
      </div>
      {/* Mini input */}
      <div
        className="w-full h-3 sm:h-4 border-b-2"
        style={{ borderColor: designSettings.colors.answers }}
      >
        <span
          className="text-[6px] sm:text-[8px] opacity-40"
          style={{ color: designSettings.colors.answers }}
        >
          Type here...
        </span>
      </div>
      {/* Mini button */}
      <div
        className="px-2 sm:px-3 py-0.5 sm:py-1 text-[6px] sm:text-[8px] font-medium mt-0.5 sm:mt-1"
        style={{
          backgroundColor: designSettings.colors.buttons,
          color: designSettings.colors.buttonText,
          borderRadius: cornerRadius,
        }}
      >
        Continue
      </div>
    </div>
  );
}

// Full preview component for selected theme
function ThemeFullPreview({ theme }: { theme: ThemePreset }) {
  const { designSettings } = theme;
  const cornerRadius =
    designSettings.cornerStyle === "very_rounded"
      ? "16px"
      : designSettings.cornerStyle === "rounded"
        ? "8px"
        : designSettings.cornerStyle === "normal"
          ? "4px"
          : "0px";

  const fontSizeScale =
    designSettings.fontSize === "small" ? 0.85 : designSettings.fontSize === "large" ? 1.15 : 1;

  const alignmentClass =
    designSettings.alignment === "left"
      ? "text-left"
      : designSettings.alignment === "right"
        ? "text-right"
        : "text-center";

  return (
    <div
      className="w-full h-full min-h-[200px] sm:min-h-[280px] p-4 sm:p-8 flex flex-col justify-center rounded border border-gray-200"
      style={{
        backgroundColor: designSettings.colors.background,
        fontFamily: designSettings.font,
      }}
    >
      <div className={cn("space-y-4 sm:space-y-6 max-w-md mx-auto w-full", alignmentClass)}>
        {/* Title */}
        <h2
          className="leading-tight text-lg sm:text-[28px]"
          style={{
            color: designSettings.colors.questions,
            fontFamily: designSettings.font,
            fontWeight: 400,
          }}
        >
          What's your name?
        </h2>

        {/* Description */}
        <p
          className="text-xs sm:text-sm"
          style={{
            color: designSettings.colors.questions,
            fontFamily: designSettings.font,
            opacity: 0.75,
          }}
        >
          We'd love to get to know you better
        </p>

        {/* Input */}
        <div
          className="w-full py-2 sm:py-3 border-b-2"
          style={{ borderColor: designSettings.colors.answers }}
        >
          <span
            className="opacity-30 text-sm sm:text-base"
            style={{
              color: designSettings.colors.answers,
              fontFamily: designSettings.font,
            }}
          >
            Type your answer here...
          </span>
        </div>

        {/* Button */}
        <div
          className={cn(
            "flex",
            designSettings.alignment === "left"
              ? "justify-start"
              : designSettings.alignment === "right"
                ? "justify-end"
                : "justify-center"
          )}
        >
          <button
            className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium shadow-sm"
            style={{
              backgroundColor: designSettings.colors.buttons,
              color: designSettings.colors.buttonText,
              fontFamily: designSettings.font,
              borderRadius: cornerRadius,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Theme grid component - renders the same for both tabs
function ThemeGrid({
  themes,
  selectedTheme,
  onSelect,
  isLoading,
  error,
  emptyMessage,
  emptySubMessage,
}: {
  themes: ThemePreset[];
  selectedTheme: ThemePreset;
  onSelect: (theme: ThemePreset) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptySubMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
        <p className="text-sm">{emptyMessage || "No themes found"}</p>
        {emptySubMessage && <p className="text-xs text-gray-400 mt-2">{emptySubMessage}</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme)}
          className={cn(
            "rounded overflow-hidden border-2 transition-all hover:shadow-md",
            selectedTheme.id === theme.id
              ? "border-indigo-500 shadow-md"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <ThemeCardPreview theme={theme} />
          <div className="px-1.5 sm:px-2 py-1.5 sm:py-2 bg-white border-t border-gray-100">
            <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">
              {theme.name}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ThemeGalleryModal({ isOpen, onClose }: ThemeGalleryModalProps) {
  const { form, updateTheme } = useFormBuilderStore();
  const [activeTab, setActiveTab] = useState<TabType>("gallery");
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // My Forms state
  const [userForms, setUserForms] = useState<Form[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);

  // Preload Google Fonts for all themes
  useEffect(() => {
    if (isOpen) {
      const fonts = Array.from(new Set(THEME_PRESETS.map((t) => t.designSettings.font)));
      const fontsToLoad = fonts.filter((f) => f !== "Inter");
      const fontFamilies = fontsToLoad.map((f) => f.replace(/ /g, "+")).join("&family=");

      if (fontFamilies) {
        const linkId = "google-fonts-themes";
        if (!document.getElementById(linkId)) {
          const link = document.createElement("link");
          link.id = linkId;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
          document.head.appendChild(link);
        }
      }
    }
  }, [isOpen]);

  // Fetch user forms when "My Forms" tab is selected
  useEffect(() => {
    if (isOpen && activeTab === "my-forms" && userForms.length === 0 && !isLoadingForms) {
      setIsLoadingForms(true);
      setFormsError(null);

      formsApi
        .list({})
        .then((data) => {
          // Filter out current form and forms without themes
          const formsWithThemes = data.forms.filter(
            (f) => f.id !== form?.id && f.theme && (f.theme as Partial<DesignSettings>).colors
          );
          setUserForms(formsWithThemes);
        })
        .catch((err) => {
          console.error("Failed to fetch forms:", err);
          setFormsError("Failed to load your forms");
        })
        .finally(() => {
          setIsLoadingForms(false);
        });
    }
  }, [isOpen, activeTab, form?.id, userForms.length, isLoadingForms]);

  // Convert user forms to theme presets
  const userFormThemes = useMemo(() => {
    return userForms.map((f) => formToThemePreset(f)).filter((t): t is ThemePreset => t !== null);
  }, [userForms]);

  // Filter themes based on category and search
  const filteredThemes = useMemo(() => {
    return THEME_PRESETS.filter((theme) => {
      const matchesCategory = activeCategory === "all" || theme.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Filter user form themes based on search
  const filteredUserThemes = useMemo(() => {
    if (searchQuery === "") return userFormThemes;
    return userFormThemes.filter(
      (theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userFormThemes, searchQuery]);

  const handleApplyTheme = () => {
    updateTheme({
      colors: selectedTheme.designSettings.colors,
      alignment: selectedTheme.designSettings.alignment,
      font: selectedTheme.designSettings.font,
      fontSize: selectedTheme.designSettings.fontSize,
      cornerStyle: selectedTheme.designSettings.cornerStyle,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative bg-white rounded shadow-xl w-full max-w-5xl h-[95vh] sm:h-[85vh] overflow-hidden flex flex-col">
        {/* Header with centered Tabs */}
        <div className="relative flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
          {/* Tabs - centered */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded">
            <button
              onClick={() => setActiveTab("gallery")}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors",
                activeTab === "gallery"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab("my-forms")}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors",
                activeTab === "my-forms"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              My Forms
            </button>
          </div>

          {/* Close button - absolute positioned */}
          <button
            onClick={onClose}
            className="absolute right-3 sm:right-4 p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search & Categories - fixed height container */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "gallery" ? "Search themes..." : "Search your forms..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category tabs - fixed height even when not visible */}
          <div className="h-8 sm:h-9 mt-3">
            {activeTab === "gallery" && (
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {THEME_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setActiveCategory(category.value)}
                    className={cn(
                      "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded transition-colors",
                      activeCategory === category.value
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content - flex row on desktop, column on mobile */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Theme grid */}
          <div className="flex-1 lg:w-[45%] lg:flex-none border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto p-3 sm:p-4">
            {activeTab === "gallery" ? (
              <ThemeGrid
                themes={filteredThemes}
                selectedTheme={selectedTheme}
                onSelect={setSelectedTheme}
                emptyMessage="No themes found"
              />
            ) : (
              <ThemeGrid
                themes={filteredUserThemes}
                selectedTheme={selectedTheme}
                onSelect={setSelectedTheme}
                isLoading={isLoadingForms}
                error={formsError}
                emptyMessage={
                  searchQuery ? "No forms match your search" : "No other forms with custom themes"
                }
                emptySubMessage={
                  searchQuery ? undefined : "Create themes in the Design panel to see them here"
                }
              />
            )}
          </div>

          {/* Right: Preview panel */}
          <div className="flex-1 lg:w-[55%] lg:flex-none p-4 sm:p-6 flex flex-col overflow-y-auto bg-gray-50">
            {/* Preview */}
            <div className="flex-1 mb-4 sm:mb-6">
              <ThemeFullPreview theme={selectedTheme} />
            </div>

            {/* Theme info */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {selectedTheme.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{selectedTheme.description}</p>
              </div>

              {/* Color palette */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">Colors:</span>
                <div className="flex gap-1">
                  {Object.entries(selectedTheme.designSettings.colors)
                    .filter(([key]) => key !== "starRating")
                    .map(([key, color]) => (
                      <div
                        key={key}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                </div>
              </div>

              {/* Font */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">Font:</span>
                <span
                  className="text-xs sm:text-sm font-medium text-gray-900"
                  style={{ fontFamily: selectedTheme.designSettings.font }}
                >
                  {selectedTheme.designSettings.font}
                </span>
              </div>

              {/* Apply button */}
              <button
                onClick={handleApplyTheme}
                className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-medium rounded transition-colors"
              >
                Apply Theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
