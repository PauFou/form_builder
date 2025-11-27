"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  ChevronDown,
  Sparkles,
  Lock,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { ThemeGalleryModal } from "./ThemeGalleryModal";

interface DesignPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded"
        />
      </div>
    </div>
  );
}

interface FontDropdownProps {
  fonts: string[];
  value: string;
  onChange: (value: string) => void;
}

function FontDropdown({ fonts, value, onChange }: FontDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Preload all Google Fonts when dropdown opens
  useEffect(() => {
    if (isOpen && !fontsLoaded) {
      const fontsToLoad = fonts.filter((f) => f !== "Inter");
      const fontFamilies = fontsToLoad.map((f) => f.replace(/ /g, "+")).join("&family=");

      if (fontFamilies) {
        const linkId = "google-fonts-preview";
        if (!document.getElementById(linkId)) {
          const link = document.createElement("link");
          link.id = linkId;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
          document.head.appendChild(link);
        }
      }
      setFontsLoaded(true);
    }
  }, [isOpen, fonts, fontsLoaded]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
      >
        <span style={{ fontFamily: value }}>{value}</span>
        <ChevronDown
          className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
            {fonts.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onChange(f);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                  value === f && "bg-indigo-50 text-indigo-600"
                )}
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Default design settings
export interface DesignSettings {
  colors: {
    background: string;
    questions: string;
    answers: string;
    buttons: string;
    buttonText: string;
    starRating: string;
  };
  alignment: "left" | "center" | "right";
  font: string;
  fontSize: "small" | "medium" | "large";
  cornerStyle: "very_rounded" | "rounded" | "normal" | "square";
  backgroundImage: string | null;
  logo: string | null;
}

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  colors: {
    background: "#ffffff",
    questions: "#1a1a1a",
    answers: "#374151",
    buttons: "#4f46e5",
    buttonText: "#ffffff",
    starRating: "#f59e0b",
  },
  alignment: "left",
  font: "Inter",
  fontSize: "medium",
  cornerStyle: "normal",
  backgroundImage: null,
  logo: null,
};

export function DesignPanel({ isOpen, onClose }: DesignPanelProps) {
  const { form, updateForm } = useFormBuilderStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isThemeGalleryOpen, setIsThemeGalleryOpen] = useState(false);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Get design settings from form or use defaults (with deep merge)
  const themeFromForm = form?.theme as Partial<DesignSettings> | undefined;
  const designSettings: DesignSettings = {
    colors: {
      ...DEFAULT_DESIGN_SETTINGS.colors,
      ...(themeFromForm?.colors || {}),
    },
    alignment: themeFromForm?.alignment || DEFAULT_DESIGN_SETTINGS.alignment,
    font: themeFromForm?.font || DEFAULT_DESIGN_SETTINGS.font,
    fontSize: themeFromForm?.fontSize || DEFAULT_DESIGN_SETTINGS.fontSize,
    cornerStyle: themeFromForm?.cornerStyle || DEFAULT_DESIGN_SETTINGS.cornerStyle,
    backgroundImage: themeFromForm?.backgroundImage ?? DEFAULT_DESIGN_SETTINGS.backgroundImage,
    logo: themeFromForm?.logo ?? DEFAULT_DESIGN_SETTINGS.logo,
  };

  // Update design settings in the form store
  const updateDesignSettings = (updates: Partial<DesignSettings>) => {
    updateForm({
      theme: {
        ...designSettings,
        ...updates,
      } as any,
    });
  };

  // Local state for colors (to avoid too many store updates while typing)
  const [colors, setColors] = useState(designSettings.colors);

  // Sync local colors with store on blur
  const updateColor = (key: keyof typeof colors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    updateDesignSettings({ colors: newColors });
  };

  // Direct update functions for other settings
  const setAlignment = (value: "left" | "center" | "right") => {
    updateDesignSettings({ alignment: value });
  };

  const setFont = (value: string) => {
    updateDesignSettings({ font: value });
  };

  const setFontSize = (value: "small" | "medium" | "large") => {
    updateDesignSettings({ fontSize: value });
  };

  const setCornerStyle = (value: "very_rounded" | "rounded" | "normal" | "square") => {
    updateDesignSettings({ cornerStyle: value });
  };

  // Read current values from store
  const alignment = designSettings.alignment;
  const font = designSettings.font;
  const fontSize = designSettings.fontSize;
  const cornerStyle = designSettings.cornerStyle;

  const fonts = [
    // Sans-serif
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Poppins",
    "Montserrat",
    "Nunito",
    "Raleway",
    "Work Sans",
    "DM Sans",
    "Plus Jakarta Sans",
    "Outfit",
    "Manrope",
    "Space Grotesk",
    "Urbanist",
    // Serif
    "Playfair Display",
    "Merriweather",
    "Lora",
    "Crimson Text",
    "Libre Baskerville",
    "Source Serif Pro",
    "PT Serif",
    // Display
    "Oswald",
    "Bebas Neue",
    "Anton",
    // Monospace
    "JetBrains Mono",
    "Fira Code",
    "IBM Plex Mono",
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel - Slides in from right */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          isAnimating ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Design</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Description */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-gray-600 leading-relaxed">
              Choose from handpicked designs, from your previous forms, or make it your own by
              adding your brand color and logo.
            </p>
          </div>

          {/* Theme Gallery Button */}
          <div className="px-4 py-3 border-b border-gray-200">
            <button
              onClick={() => setIsThemeGalleryOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Open Theme Gallery
            </button>
          </div>

          {/* Colors Section */}
          <div className="px-4 py-4 border-b border-gray-200 space-y-3">
            <ColorPicker
              label="Background"
              value={colors.background}
              onChange={(v) => updateColor("background", v)}
            />
            <ColorPicker
              label="Questions"
              value={colors.questions}
              onChange={(v) => updateColor("questions", v)}
            />
            <ColorPicker
              label="Answers"
              value={colors.answers}
              onChange={(v) => updateColor("answers", v)}
            />
            <ColorPicker
              label="Buttons"
              value={colors.buttons}
              onChange={(v) => updateColor("buttons", v)}
            />
            <ColorPicker
              label="Button Text"
              value={colors.buttonText}
              onChange={(v) => updateColor("buttonText", v)}
            />
            <ColorPicker
              label="Star Rating"
              value={colors.starRating}
              onChange={(v) => updateColor("starRating", v)}
            />
          </div>

          {/* Auto-save Note */}
          <div className="px-4 py-2 bg-amber-50 border-b border-gray-200">
            <p className="text-xs text-amber-700">
              Note: Any changes made in the Design tab will be saved & published automatically.
            </p>
          </div>

          {/* Alignment */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Alignment</label>
            <div className="flex gap-1">
              {[
                { value: "left" as const, icon: AlignLeft },
                { value: "center" as const, icon: AlignCenter },
                { value: "right" as const, icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setAlignment(value)}
                  className={cn(
                    "flex-1 p-2 rounded border transition-colors",
                    alignment === value
                      ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Font</label>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                + Custom font
              </button>
            </div>
            <FontDropdown fonts={fonts} value={font} onChange={setFont} />
          </div>

          {/* Background Image */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Background Image</label>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              <Image className="w-4 h-4" />
              Select image
            </button>
          </div>

          {/* Logo */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">Logo</label>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                PRO
              </span>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded text-sm text-gray-400 bg-gray-50 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              Select your logo
            </button>
          </div>

          {/* Corner Style */}
          <div className="px-4 py-4 border-b border-gray-200">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Corners</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: "very_rounded" as const, label: "Very Round" },
                { value: "rounded" as const, label: "Rounded" },
                { value: "normal" as const, label: "Normal" },
                { value: "square" as const, label: "Square" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCornerStyle(value)}
                  className={cn(
                    "px-2 py-2 text-xs font-medium rounded border transition-colors",
                    cornerStyle === value
                      ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="px-4 py-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Font size</label>
            <div className="flex gap-1">
              {[
                { value: "small" as const, label: "Small" },
                { value: "medium" as const, label: "Medium" },
                { value: "large" as const, label: "Large" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFontSize(value)}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-medium rounded border transition-colors",
                    fontSize === value
                      ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Gallery Modal */}
      <ThemeGalleryModal isOpen={isThemeGalleryOpen} onClose={() => setIsThemeGalleryOpen(false)} />
    </div>
  );
}
