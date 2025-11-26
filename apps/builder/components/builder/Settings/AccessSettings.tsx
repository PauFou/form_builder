"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

export function AccessSettings() {
  const { form, updateForm } = useFormBuilderStore();

  const settings = form?.settings || {};
  const access = settings.access || {};

  const handleAccessChange = (key: string, value: any) => {
    updateForm({
      settings: {
        ...settings,
        access: {
          ...access,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Close Form */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-gray-900">Close Form</Label>
            <p className="text-sm text-gray-500 mt-1">
              Prevent new submissions from being accepted. Existing submissions remain accessible.
            </p>
          </div>
          <Switch
            checked={access.closeForm ?? false}
            onCheckedChange={(checked) => handleAccessChange("closeForm", checked)}
          />
        </div>
      </div>

      {/* Close Form By Date */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-gray-900">Close Form By Date</Label>
            <p className="text-sm text-gray-500 mt-1">
              Automatically close the form after a specific date.
            </p>
          </div>
          <Switch
            checked={access.closeFormByDate ?? false}
            onCheckedChange={(checked) => handleAccessChange("closeFormByDate", checked)}
          />
        </div>

        {access.closeFormByDate && (
          <div className="pt-3 border-t border-gray-200">
            <Label className="text-sm font-medium text-gray-900 mb-2 block">Close Date</Label>
            <input
              type="datetime-local"
              value={access.closeFormDate || ""}
              onChange={(e) => handleAccessChange("closeFormDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Close Form By Submissions */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-gray-900">Close Form By Submissions</Label>
            <p className="text-sm text-gray-500 mt-1">
              Automatically close the form after reaching a specific number of submissions.
            </p>
          </div>
          <Switch
            checked={access.closeFormBySubmissions ?? false}
            onCheckedChange={(checked) => handleAccessChange("closeFormBySubmissions", checked)}
          />
        </div>

        {access.closeFormBySubmissions && (
          <div className="pt-3 border-t border-gray-200">
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              Maximum Submissions
            </Label>
            <input
              type="number"
              min="1"
              value={access.maxSubmissions || ""}
              onChange={(e) => handleAccessChange("maxSubmissions", parseInt(e.target.value) || 0)}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Auto-refresh on Inactivity */}
      <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-gray-900">
                Auto-refresh on Inactivity
              </Label>
              <div className="group relative">
                <svg
                  className="w-4 h-4 text-gray-400 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                </svg>
                <div className="absolute left-0 top-6 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <p className="font-semibold mb-2">How this works:</p>
                  <p className="mb-2">
                    <strong>Auto-Refresh Inactivity Setup:</strong> After setting up auto-refresh
                    inactivity from your form's Access setting, the following occurs:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      If a user starts filling out a form and becomes inactive for the set amount of
                      minutes, the form prepares to refresh.
                    </li>
                    <li>
                      A popup will appear in the last 10 seconds, giving the user the option to
                      either refresh immediately or continue filling out the form.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Automatically refresh the form after a period of inactivity.
            </p>
          </div>
          <Switch
            checked={access.autoRefreshOnInactivity ?? false}
            onCheckedChange={(checked) => handleAccessChange("autoRefreshOnInactivity", checked)}
          />
        </div>

        {access.autoRefreshOnInactivity && (
          <div className="pt-3 border-t border-gray-200">
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              Inactivity Timeout (minutes)
            </Label>
            <input
              type="number"
              min="1"
              value={access.inactivityTimeout || ""}
              onChange={(e) =>
                handleAccessChange("inactivityTimeout", parseInt(e.target.value) || 0)
              }
              placeholder="e.g. 10"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
