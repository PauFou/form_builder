"use client";

import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

type SettingsSubTab = "general" | "email" | "access" | "hidden_fields" | "link" | "language";

export function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>("general");
  const { form, updateForm } = useFormBuilderStore();

  const subTabs = [
    { id: "general" as SettingsSubTab, label: "General" },
    { id: "email" as SettingsSubTab, label: "Email Settings" },
    { id: "access" as SettingsSubTab, label: "Access" },
    { id: "hidden_fields" as SettingsSubTab, label: "Hidden Fields & Variables" },
    { id: "link" as SettingsSubTab, label: "Link Settings" },
    { id: "language" as SettingsSubTab, label: "Language" },
  ];

  const handleSettingChange = (key: string, value: any) => {
    updateForm({
      settings: {
        ...form?.settings,
        [key]: value,
      },
    });
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Vertical Sub-tabs on the left */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4">
          <div className="space-y-1">
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    "w-full text-left py-2.5 px-4 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-md relative",
                    isActive
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {activeSubTab === "general" && (
            <div className="space-y-6">
              {/* Display Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Display</h3>
                <div className="space-y-4 bg-white border border-gray-200 rounded p-5 shadow-sm">
                  {/* Progress Bar */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-900">Progress Bar</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Show a progress indicator at the top of the form
                      </p>
                    </div>
                    <Switch
                      checked={form?.settings?.showProgressBar ?? true}
                      onCheckedChange={(checked) => handleSettingChange("showProgressBar", checked)}
                    />
                  </div>

                  {/* Navigation Arrows */}
                  <div className="flex items-start justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-900">Navigation Arrows</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Show "Up" and "Down" arrows in bottom right corner (desktop only). This
                        helps users navigate the form and go back to previous questions.
                      </p>
                    </div>
                    <Switch
                      checked={form?.settings?.showNavigationArrows ?? true}
                      onCheckedChange={(checked) =>
                        handleSettingChange("showNavigationArrows", checked)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Advanced Features</h3>
                <div className="space-y-4 bg-white border border-gray-200 rounded p-5 shadow-sm">
                  {/* Refill Link */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-sm font-medium text-gray-900">Refill Link</Label>
                        <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        When enabled, all form submissions will have a refill link generated by
                        default, allowing respondents to easily resubmit the form with their
                        previous answers pre-filled.{" "}
                        <a href="#" className="text-indigo-600 hover:underline">
                          Learn more
                        </a>
                        .
                      </p>
                    </div>
                    <Switch
                      checked={form?.settings?.enableRefillLink ?? false}
                      onCheckedChange={(checked) =>
                        handleSettingChange("enableRefillLink", checked)
                      }
                    />
                  </div>

                  {/* reCaptcha */}
                  <div className="flex items-start justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-900">Enable reCaptcha</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Please disable it if you are using custom domain otherwise your form won't
                        work. We will soon allow you to add your own reCaptcha key for custom
                        domains.
                      </p>
                    </div>
                    <Switch
                      checked={form?.settings?.enableRecaptcha ?? false}
                      onCheckedChange={(checked) => handleSettingChange("enableRecaptcha", checked)}
                    />
                  </div>

                  {/* Powered By */}
                  <div className="flex items-start justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-sm font-medium text-gray-900">
                          Show "Powered By Youform"
                        </Label>
                        <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Hide the "Powered by Youform" branding from your forms
                      </p>
                    </div>
                    <Switch
                      checked={form?.settings?.showPoweredBy ?? true}
                      onCheckedChange={(checked) => handleSettingChange("showPoweredBy", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "email" && (
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <p className="text-sm text-gray-600">Email settings coming soon...</p>
            </div>
          )}

          {activeSubTab === "access" && (
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <p className="text-sm text-gray-600">Access settings coming soon...</p>
            </div>
          )}

          {activeSubTab === "hidden_fields" && (
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <p className="text-sm text-gray-600">Hidden fields & variables coming soon...</p>
            </div>
          )}

          {activeSubTab === "link" && (
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <p className="text-sm text-gray-600">Link settings coming soon...</p>
            </div>
          )}

          {activeSubTab === "language" && (
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <p className="text-sm text-gray-600">Language settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
