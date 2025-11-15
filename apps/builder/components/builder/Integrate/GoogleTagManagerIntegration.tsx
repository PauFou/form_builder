import React, { useState } from "react";
import { BarChart3, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input, Label, Switch } from "@skemya/ui";
import { IntegrationCard } from "./IntegrationCard";

interface GoogleTagManagerIntegrationProps {
  formId: string;
  integration?: {
    id: string;
    container_id: string;
    track_views: boolean;
    track_starts: boolean;
    track_steps: boolean;
    track_completions: boolean;
    enabled: boolean;
  };
  onSave: (config: any) => Promise<void>;
  proBadge?: boolean;
}

export function GoogleTagManagerIntegration({
  formId,
  integration,
  onSave,
  proBadge = true,
}: GoogleTagManagerIntegrationProps) {
  const [containerId, setContainerId] = useState(integration?.container_id || "");
  const [trackViews, setTrackViews] = useState(integration?.track_views ?? true);
  const [trackStarts, setTrackStarts] = useState(integration?.track_starts ?? true);
  const [trackSteps, setTrackSteps] = useState(integration?.track_steps ?? false);
  const [trackCompletions, setTrackCompletions] = useState(integration?.track_completions ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const status = integration?.enabled ? "connected" : "not_connected";

  const validateContainerId = (id: string): boolean => {
    const regex = /^GTM-[A-Z0-9]{7,}$/;
    if (!regex.test(id)) {
      setValidationError("Container ID must be in format GTM-XXXXXXX");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async () => {
    if (!containerId.trim()) {
      setValidationError("Please enter your GTM Container ID");
      return;
    }

    if (!validateContainerId(containerId)) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        container_id: containerId,
        track_views: trackViews,
        track_starts: trackStarts,
        track_steps: trackSteps,
        track_completions: trackCompletions,
        enabled: true,
      });
      setValidationError(null);
    } catch (error) {
      console.error("Failed to save GTM integration:", error);
      alert("Failed to save integration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Tag Manager?")) return;

    setIsSaving(true);
    try {
      await onSave({
        enabled: false,
      });
      setContainerId("");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IntegrationCard
      name="Google Tag Manager"
      description="Track form analytics and user behavior with GTM"
      icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
      status={status}
      proBadge={proBadge}
      onDisconnect={handleDisconnect}
      setupGuideUrl="https://tagmanager.google.com"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            How to connect Google Tag Manager
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to your Google Tag Manager account</li>
            <li>Find your Container ID (format: GTM-XXXXXXX)</li>
            <li>Enter the Container ID below</li>
            <li>Choose which events to track</li>
          </ol>
        </div>

        {/* Container ID Input */}
        <div className="space-y-2">
          <Label htmlFor="gtm-container">GTM Container ID *</Label>
          <Input
            id="gtm-container"
            placeholder="GTM-XXXXXXX"
            value={containerId}
            onChange={(e) => {
              setContainerId(e.target.value.toUpperCase());
              setValidationError(null);
            }}
            disabled={status === "connected"}
            className={validationError ? "border-red-500" : ""}
          />
          {validationError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationError}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Find this in your GTM account under Admin → Container Settings
          </p>
        </div>

        {/* Event Tracking Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Events to Track</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="track-views" className="cursor-pointer">
                  Form Views
                </Label>
                <p className="text-xs text-gray-500">
                  Event: <code className="text-xs bg-gray-200 px-1 rounded">form_view</code>
                </p>
              </div>
              <Switch
                id="track-views"
                checked={trackViews}
                onCheckedChange={setTrackViews}
                disabled={status === "connected"}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="track-starts" className="cursor-pointer">
                  Form Starts
                </Label>
                <p className="text-xs text-gray-500">
                  Event: <code className="text-xs bg-gray-200 px-1 rounded">form_start</code>
                </p>
              </div>
              <Switch
                id="track-starts"
                checked={trackStarts}
                onCheckedChange={setTrackStarts}
                disabled={status === "connected"}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="track-steps" className="cursor-pointer">
                  Step Changes
                </Label>
                <p className="text-xs text-gray-500">
                  Event: <code className="text-xs bg-gray-200 px-1 rounded">form_step</code>
                </p>
              </div>
              <Switch
                id="track-steps"
                checked={trackSteps}
                onCheckedChange={setTrackSteps}
                disabled={status === "connected"}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="track-completions" className="cursor-pointer">
                  Form Completions
                </Label>
                <p className="text-xs text-gray-500">
                  Event: <code className="text-xs bg-gray-200 px-1 rounded">form_complete</code>
                </p>
              </div>
              <Switch
                id="track-completions"
                checked={trackCompletions}
                onCheckedChange={setTrackCompletions}
                disabled={status === "connected"}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {status === "not_connected" && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving || !containerId.trim()}>
              {isSaving ? "Connecting..." : "Connect GTM"}
            </Button>
          </div>
        )}

        {/* Connected Info */}
        {status === "connected" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Connected to GTM Container</p>
              <p className="text-xs text-green-700 mt-1">
                Container ID: <code className="bg-green-100 px-1 rounded">{containerId}</code>
              </p>
              <p className="text-xs text-green-700 mt-1">
                Tracking:{" "}
                {[
                  trackViews && "Views",
                  trackStarts && "Starts",
                  trackSteps && "Steps",
                  trackCompletions && "Completions",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Data Layer Info */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-900 mb-2">Data Layer Variables</h4>
          <div className="text-xs text-gray-600 space-y-1 font-mono bg-gray-50 p-2 rounded">
            <div>formId: "{formId}"</div>
            <div>event: "form_view | form_start | form_step | form_complete"</div>
            <div>stepNumber: 1, 2, 3...</div>
            <div>totalSteps: X</div>
          </div>
        </div>
      </div>
    </IntegrationCard>
  );
}
