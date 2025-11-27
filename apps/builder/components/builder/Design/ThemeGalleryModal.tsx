"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { THEME_PRESETS, THEME_CATEGORIES, ThemePreset, ThemeCategory } from "./theme-presets";

interface ThemeGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
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
      className="w-full aspect-[4/3] p-3 flex flex-col justify-center items-center gap-2"
      style={{
        backgroundColor: designSettings.colors.background,
        fontFamily: designSettings.font,
      }}
    >
      {/* Mini title */}
      <div
        className="text-[10px] font-medium text-center leading-tight truncate w-full px-1"
        style={{ color: designSettings.colors.questions }}
      >
        What's your name?
      </div>
      {/* Mini input */}
      <div className="w-full h-4 border-b-2" style={{ borderColor: designSettings.colors.answers }}>
        <span className="text-[8px] opacity-40" style={{ color: designSettings.colors.answers }}>
          Type here...
        </span>
      </div>
      {/* Mini button */}
      <div
        className="px-3 py-1 text-[8px] font-medium mt-1"
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
      className="w-full h-full min-h-[280px] p-8 flex flex-col justify-center rounded"
      style={{
        backgroundColor: designSettings.colors.background,
        fontFamily: designSettings.font,
      }}
    >
      <div className={cn("space-y-6 max-w-md mx-auto w-full", alignmentClass)}>
        {/* Title */}
        <h2
          className="font-normal leading-tight"
          style={{
            color: designSettings.colors.questions,
            fontSize: `${28 * fontSizeScale}px`,
          }}
        >
          What's your name?
        </h2>

        {/* Description */}
        <p
          style={{
            color: designSettings.colors.questions,
            opacity: 0.75,
            fontSize: `${14 * fontSizeScale}px`,
          }}
        >
          We'd love to get to know you better
        </p>

        {/* Input */}
        <div
          className="w-full py-3 border-b-2"
          style={{ borderColor: designSettings.colors.answers }}
        >
          <span
            className="opacity-30"
            style={{
              color: designSettings.colors.answers,
              fontSize: `${16 * fontSizeScale}px`,
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
            className="px-6 py-3 font-medium shadow-sm"
            style={{
              backgroundColor: designSettings.colors.buttons,
              color: designSettings.colors.buttonText,
              borderRadius: cornerRadius,
              fontSize: `${14 * fontSizeScale}px`,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export function ThemeGalleryModal({ isOpen, onClose }: ThemeGalleryModalProps) {
  const { updateTheme } = useFormBuilderStore();
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Theme Gallery</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {THEME_CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                  activeCategory === category.value
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Theme grid */}
          <div className="w-[45%] border-r border-gray-200 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={cn(
                    "rounded overflow-hidden border-2 transition-all hover:shadow-md",
                    selectedTheme.id === theme.id
                      ? "border-indigo-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <ThemeCardPreview theme={theme} />
                  <div className="px-2 py-2 bg-white border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-900 truncate">{theme.name}</p>
                  </div>
                </button>
              ))}
            </div>

            {filteredThemes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No themes found</p>
              </div>
            )}
          </div>

          {/* Right: Preview panel */}
          <div className="w-[55%] p-6 flex flex-col overflow-y-auto bg-gray-50">
            {/* Preview */}
            <div className="flex-1 mb-6">
              <ThemeFullPreview theme={selectedTheme} />
            </div>

            {/* Theme info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTheme.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTheme.description}</p>
              </div>

              {/* Color palette */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Colors:</span>
                <div className="flex gap-1">
                  {Object.entries(selectedTheme.designSettings.colors)
                    .filter(([key]) => key !== "starRating")
                    .map(([key, color]) => (
                      <div
                        key={key}
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                </div>
              </div>

              {/* Font */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Font:</span>
                <span
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: selectedTheme.designSettings.font }}
                >
                  {selectedTheme.designSettings.font}
                </span>
              </div>

              {/* Apply button */}
              <button
                onClick={handleApplyTheme}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition-colors"
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
