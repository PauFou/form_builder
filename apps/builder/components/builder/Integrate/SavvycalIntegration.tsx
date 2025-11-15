import React, { useState } from "react";
import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import { Button, Input, Label } from "@skemya/ui";
import { IntegrationCard } from "./IntegrationCard";

interface SavvycalIntegrationProps {
  formId: string;
  integration?: {
    id: string;
    scheduling_link: string;
    enabled: boolean;
  };
  onSave: (config: any) => Promise<void>;
}

export function SavvycalIntegration({ formId, integration, onSave }: SavvycalIntegrationProps) {
  const [schedulingLink, setSchedulingLink] = useState(integration?.scheduling_link || "");
  const [isSaving, setIsSaving] = useState(false);

  const status = integration?.enabled ? "connected" : "not_connected";

  const handleSave = async () => {
    if (!schedulingLink.trim()) {
      alert("Please enter your Savvycal scheduling link");
      return;
    }

    // Validate URL
    try {
      new URL(schedulingLink);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        scheduling_link: schedulingLink,
        enabled: true,
      });
    } catch (error) {
      console.error("Failed to save Savvycal integration:", error);
      alert("Failed to save integration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Savvycal?")) return;

    setIsSaving(true);
    try {
      await onSave({
        enabled: false,
      });
      setSchedulingLink("");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IntegrationCard
      name="Savvycal"
      description="Embed Savvycal scheduling into your form"
      icon={<Calendar className="w-6 h-6 text-emerald-600" />}
      status={status}
      onDisconnect={handleDisconnect}
      setupGuideUrl="https://savvycal.com"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h4 className="text-sm font-semibold text-emerald-900 mb-2">How to connect Savvycal</h4>
          <ol className="text-sm text-emerald-800 space-y-1 list-decimal list-inside">
            <li>Go to your Savvycal dashboard</li>
            <li>Copy your scheduling link</li>
            <li>Paste it below</li>
            <li>Add a "Scheduler" block to your form to embed the calendar</li>
          </ol>
        </div>

        {/* Scheduling Link Input */}
        <div className="space-y-2">
          <Label htmlFor="savvycal-link">Savvycal Scheduling Link *</Label>
          <Input
            id="savvycal-link"
            type="url"
            placeholder="https://savvycal.com/yourname/meeting"
            value={schedulingLink}
            onChange={(e) => setSchedulingLink(e.target.value)}
            disabled={status === "connected"}
          />
          <p className="text-xs text-gray-500">Your personalized Savvycal scheduling link</p>
        </div>

        {/* Save Button */}
        {status === "not_connected" && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving || !schedulingLink.trim()}>
              {isSaving ? "Connecting..." : "Connect Savvycal"}
            </Button>
          </div>
        )}

        {/* Connected Info */}
        {status === "connected" && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Connected to Savvycal</p>
                <p className="text-xs text-green-700 mt-1">
                  Your scheduling link is ready to be embedded in your form
                </p>
                <a
                  href={schedulingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1 mt-2"
                >
                  View scheduling page
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h4>
              <p className="text-xs text-blue-800">
                Add a <strong>Scheduler</strong> block to your form to embed the Savvycal calendar.
                Respondents will be able to book meetings directly from your form.
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Savvycal features:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Ranked availability for faster scheduling</li>
            <li>Automatic timezone detection</li>
            <li>Calendar sync (Google, Outlook, iCal)</li>
            <li>Custom branding</li>
            <li>Email reminders</li>
          </ul>
        </div>
      </div>
    </IntegrationCard>
  );
}
