"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Label } from "@skemya/ui";
import { RadioGroup, RadioGroupItem } from "@skemya/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@skemya/ui";
import { useThemeStore, type Theme } from "../../lib/stores/theme-store";

const themes = [
  {
    value: "light" as const,
    label: "Light",
    description: "Clean and bright interface",
    icon: Sun,
  },
  {
    value: "dark" as const,
    label: "Dark",
    description: "Easy on the eyes",
    icon: Moon,
  },
  {
    value: "system" as const,
    label: "System",
    description: "Use your device's preference",
    icon: Monitor,
  },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose your preferred theme or let the system decide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={(value: Theme) => setTheme(value)}
          className="grid grid-cols-1 gap-3"
        >
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <div
                key={themeOption.value}
                className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/5 ${
                  theme === themeOption.value
                    ? "border-primary bg-accent/10"
                    : "border-border"
                }`}
              >
                <RadioGroupItem
                  value={themeOption.value}
                  id={themeOption.value}
                  className="mt-0.5"
                />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label
                    htmlFor={themeOption.value}
                    className="font-medium cursor-pointer"
                  >
                    {themeOption.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {themeOption.description}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}