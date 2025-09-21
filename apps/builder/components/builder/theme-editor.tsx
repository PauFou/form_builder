"use client";

import { useState } from "react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  RadioGroup,
  RadioGroupItem,
  Card,
  CardContent,
  Separator,
  Input,
  Button,
} from "@skemya/ui";
import { Palette, Layout, Type } from "lucide-react";
import { ThemeTokens, LayoutSettings, DEFAULT_THEME, DEFAULT_LAYOUT } from "../../lib/types/theme";
import type { Form, Theme } from "@skemya/contracts";

interface ThemeEditorProps {
  form: Form | null;
  onUpdateForm: (updates: Partial<Form>) => void;
  onUpdateTheme: (theme: Partial<Theme>) => void;
}

export function ThemeEditor({ form, onUpdateForm, onUpdateTheme }: ThemeEditorProps) {
  const [activeSection, setActiveSection] = useState<"layout" | "colors" | "typography">("layout");

  const layout: LayoutSettings = form?.layout || DEFAULT_LAYOUT;
  const theme: Partial<ThemeTokens> = form?.theme || {};

  const updateLayout = (updates: Partial<LayoutSettings>) => {
    onUpdateForm({ layout: { ...layout, ...updates } });
  };

  const updateThemeTokens = (section: keyof ThemeTokens, updates: any) => {
    onUpdateTheme({
      [section]: {
        ...theme[section],
        ...updates,
      },
    });
  };

  const colorPresets = [
    { name: "Default", primary: "hsl(240 5.9% 10%)", secondary: "hsl(240 4.8% 95.9%)" },
    { name: "Blue", primary: "hsl(221 83% 53%)", secondary: "hsl(210 40% 96%)" },
    { name: "Green", primary: "hsl(142 76% 36%)", secondary: "hsl(138 76% 97%)" },
    { name: "Purple", primary: "hsl(262 83% 58%)", secondary: "hsl(269 70% 95%)" },
    { name: "Orange", primary: "hsl(25 95% 53%)", secondary: "hsl(20 70% 95%)" },
  ];

  const fontFamilies = [
    { value: "inter", label: "Inter", stack: "'Inter', -apple-system, sans-serif" },
    { value: "system", label: "System", stack: "-apple-system, BlinkMacSystemFont, sans-serif" },
    { value: "roboto", label: "Roboto", stack: "'Roboto', sans-serif" },
    { value: "open-sans", label: "Open Sans", stack: "'Open Sans', sans-serif" },
    { value: "lato", label: "Lato", stack: "'Lato', sans-serif" },
    { value: "poppins", label: "Poppins", stack: "'Poppins', sans-serif" },
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveSection("layout")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeSection === "layout"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layout className="h-4 w-4" />
          Layout
        </button>
        <button
          onClick={() => setActiveSection("colors")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeSection === "colors"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="h-4 w-4" />
          Colors
        </button>
        <button
          onClick={() => setActiveSection("typography")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeSection === "typography"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Type className="h-4 w-4" />
          Typography
        </button>
      </div>

      {/* Layout Settings */}
      {activeSection === "layout" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Form Layout</Label>
            <RadioGroup
              value={layout.type}
              onValueChange={(value: "one-question" | "grid") => updateLayout({ type: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-question" id="layout-one" />
                <Label htmlFor="layout-one" className="font-normal cursor-pointer">
                  One question per page
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="layout-grid" />
                <Label htmlFor="layout-grid" className="font-normal cursor-pointer">
                  Multiple questions per page
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="progress">Show progress bar</Label>
              <input
                type="checkbox"
                id="progress"
                checked={layout.showProgressBar}
                onChange={(e) => updateLayout({ showProgressBar: e.target.checked })}
                className="rounded border-gray-300"
              />
            </div>

            {layout.showProgressBar && (
              <div className="space-y-2">
                <Label htmlFor="progress-position">Progress bar position</Label>
                <Select
                  value={layout.progressBarPosition}
                  onValueChange={(value: "top" | "bottom") =>
                    updateLayout({ progressBarPosition: value })
                  }
                >
                  <SelectTrigger id="progress-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Density</Label>
            <RadioGroup
              value={layout.density}
              onValueChange={(value: "compact" | "comfortable" | "spacious") =>
                updateLayout({ density: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="density-compact" />
                <Label htmlFor="density-compact" className="font-normal cursor-pointer">
                  Compact
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="density-comfortable" />
                <Label htmlFor="density-comfortable" className="font-normal cursor-pointer">
                  Comfortable
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spacious" id="density-spacious" />
                <Label htmlFor="density-spacious" className="font-normal cursor-pointer">
                  Spacious
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Color Settings */}
      {activeSection === "colors" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {colorPresets.map((preset) => (
                <Card
                  key={preset.name}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    updateThemeTokens("colors", {
                      primary: preset.primary,
                      secondary: preset.secondary,
                    });
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <span className="text-sm">{preset.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Custom Colors</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="primary-color" className="text-sm">
                  Primary
                </Label>
                <Input
                  id="primary-color"
                  type="color"
                  value={theme.colors?.primary || DEFAULT_THEME.colors.primary}
                  onChange={(e) => updateThemeTokens("colors", { primary: e.target.value })}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="secondary-color" className="text-sm">
                  Secondary
                </Label>
                <Input
                  id="secondary-color"
                  type="color"
                  value={theme.colors?.secondary || DEFAULT_THEME.colors.secondary}
                  onChange={(e) => updateThemeTokens("colors", { secondary: e.target.value })}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="background-color" className="text-sm">
                  Background
                </Label>
                <Input
                  id="background-color"
                  type="color"
                  value={theme.colors?.background || DEFAULT_THEME.colors.background}
                  onChange={(e) => updateThemeTokens("colors", { background: e.target.value })}
                  className="w-20 h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Border Radius</Label>
            <Select
              value={theme.borderRadius?.md || DEFAULT_THEME.borderRadius.md}
              onValueChange={(value) => updateThemeTokens("borderRadius", { md: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="0.125rem">Small</SelectItem>
                <SelectItem value="0.375rem">Medium</SelectItem>
                <SelectItem value="0.5rem">Large</SelectItem>
                <SelectItem value="0.75rem">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Typography Settings */}
      {activeSection === "typography" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={theme.typography?.fontFamily || "inter"}
              onValueChange={(value) => {
                const font = fontFamilies.find((f) => f.value === value);
                if (font) {
                  updateThemeTokens("typography", { fontFamily: font.stack });
                }
              }}
            >
              <SelectTrigger id="font-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Base Font Size</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[parseInt(theme.typography?.fontSize?.base || "16")]}
                onValueChange={([value]) =>
                  updateThemeTokens("typography", {
                    fontSize: { ...theme.typography?.fontSize, base: `${value}px` },
                  })
                }
                min={14}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {theme.typography?.fontSize?.base || "16px"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Line Height</Label>
            <RadioGroup
              value={String(theme.typography?.lineHeight?.normal || "1.5")}
              onValueChange={(value) =>
                updateThemeTokens("typography", {
                  lineHeight: { ...theme.typography?.lineHeight, normal: parseFloat(value) },
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1.25" id="line-tight" />
                <Label htmlFor="line-tight" className="font-normal cursor-pointer">
                  Tight (1.25)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1.5" id="line-normal" />
                <Label htmlFor="line-normal" className="font-normal cursor-pointer">
                  Normal (1.5)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1.75" id="line-relaxed" />
                <Label htmlFor="line-relaxed" className="font-normal cursor-pointer">
                  Relaxed (1.75)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
}
