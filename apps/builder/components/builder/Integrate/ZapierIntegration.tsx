import React, { useState } from "react";
import { Copy, CheckCircle2, Zap, Send } from "lucide-react";
import { Button, Input, Label, Switch } from "@skemya/ui";
import { IntegrationCard } from "./IntegrationCard";
import { cn } from "../../../lib/utils";

interface ZapierIntegrationProps {
  formId: string;
  integration?: {
    id: string;
    webhook_url: string;
    include_partials: boolean;
    enabled: boolean;
  };
  onSave: (config: any) => Promise<void>;
  onTest?: () => Promise<void>;
}

export function ZapierIntegration({
  formId,
  integration,
  onSave,
  onTest,
}: ZapierIntegrationProps) {
  const [webhookUrl, setWebhookUrl] = useState(integration?.webhook_url || "");
  const [includePartials, setIncludePartials] = useState(
    integration?.include_partials ?? false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const status = integration?.enabled ? "connected" : "not_connected";

  const handleSave = async () => {
    if (!webhookUrl.trim()) {
      alert("Please enter a webhook URL");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        webhook_url: webhookUrl,
        include_partials: includePartials,
        enabled: true,
      });
    } catch (error) {
      console.error("Failed to save Zapier integration:", error);
      alert("Failed to save integration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      await onTest();
      setTestResult("success");
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error("Test failed:", error);
      setTestResult("error");
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Zapier?")) return;

    setIsSaving(true);
    try {
      await onSave({
        enabled: false,
      });
      setWebhookUrl("");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect");
    } finally {
      setIsSaving(false);
    }
  };

  const sampleWebhookUrl = `https://hooks.zapier.com/hooks/catch/123456/abcdef/`;

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <IntegrationCard
      name="Zapier"
      description="Connect to 6,000+ apps including Gmail, Slack, Trello, and more"
      icon={<Zap className="w-6 h-6 text-orange-500" />}
      status={status}
      onDisconnect={handleDisconnect}
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            How to connect Zapier
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create a new Zap in your Zapier account</li>
            <li>Choose "Webhooks by Zapier" as the trigger</li>
            <li>Select "Catch Hook" trigger event</li>
            <li>Copy the webhook URL provided by Zapier</li>
            <li>Paste the webhook URL below</li>
          </ol>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-2">
          <Label htmlFor="zapier-webhook">Webhook URL *</Label>
          <Input
            id="zapier-webhook"
            type="url"
            placeholder={sampleWebhookUrl}
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={status === "connected"}
          />
          <p className="text-xs text-gray-500">
            The webhook URL from your Zapier Zap
          </p>
        </div>

        {/* Include Partials Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="include-partials" className="cursor-pointer">
              Include Partial Submissions
            </Label>
            <p className="text-xs text-gray-500">
              Send webhook for partially completed forms (not just finished ones)
            </p>
          </div>
          <Switch
            id="include-partials"
            checked={includePartials}
            onCheckedChange={setIncludePartials}
            disabled={status === "connected"}
          />
        </div>

        {/* Test & Save Buttons */}
        {status === "not_connected" && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving || !webhookUrl.trim()}>
              {isSaving ? "Connecting..." : "Connect Zapier"}
            </Button>
          </div>
        )}

        {status === "connected" && (
          <div className="space-y-3 pt-2">
            {/* Connected Info */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Connected to Zapier</p>
                <p className="text-xs text-green-700 mt-1">
                  Form submissions will be sent to your Zap
                  {includePartials && " (including partial submissions)"}
                </p>
              </div>
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Data
                  </>
                )}
              </Button>

              {testResult === "success" && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Test sent successfully!
                </span>
              )}

              {testResult === "error" && (
                <span className="text-sm text-red-600">
                  Test failed. Check your webhook URL.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Available Apps Info */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Popular apps you can connect:</strong>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Gmail",
              "Google Sheets",
              "Slack",
              "Trello",
              "Asana",
              "Salesforce",
              "HubSpot",
              "Mailchimp",
              "Airtable",
              "Notion",
              "+ 5,990 more",
            ].map((app) => (
              <span
                key={app}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      </div>
    </IntegrationCard>
  );
}
