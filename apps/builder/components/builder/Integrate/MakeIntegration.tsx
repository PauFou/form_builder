import React, { useState } from "react";
import { Copy, CheckCircle2, Workflow, Send } from "lucide-react";
import { Button, Input, Label, Switch } from "@skemya/ui";
import { IntegrationCard } from "./IntegrationCard";

interface MakeIntegrationProps {
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

export function MakeIntegration({
  formId,
  integration,
  onSave,
  onTest,
}: MakeIntegrationProps) {
  const [webhookUrl, setWebhookUrl] = useState(integration?.webhook_url || "");
  const [includePartials, setIncludePartials] = useState(
    integration?.include_partials ?? false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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
      console.error("Failed to save Make integration:", error);
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
    if (!confirm("Are you sure you want to disconnect Make?")) return;

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

  return (
    <IntegrationCard
      name="Make"
      description="Connect to 1,500+ apps with Make (formerly Integromat)"
      icon={<Workflow className="w-6 h-6 text-purple-600" />}
      status={status}
      onDisconnect={handleDisconnect}
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-900 mb-2">
            How to connect Make
          </h4>
          <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
            <li>Create a new Scenario in Make</li>
            <li>Add "Webhooks" module and choose "Custom webhook"</li>
            <li>Copy the webhook URL</li>
            <li>Paste it below and save</li>
            <li>Send a test to activate the webhook</li>
          </ol>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-2">
          <Label htmlFor="make-webhook">Webhook URL *</Label>
          <Input
            id="make-webhook"
            type="url"
            placeholder="https://hook.eu1.make.com/xxxxxxxxxxxxx"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={status === "connected"}
          />
          <p className="text-xs text-gray-500">
            The webhook URL from your Make scenario
          </p>
        </div>

        {/* Include Partials Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="make-include-partials" className="cursor-pointer">
              Include Partial Submissions
            </Label>
            <p className="text-xs text-gray-500">
              Send webhook for in-progress forms, not just completed ones
            </p>
          </div>
          <Switch
            id="make-include-partials"
            checked={includePartials}
            onCheckedChange={setIncludePartials}
            disabled={status === "connected"}
          />
        </div>

        {/* Save Button */}
        {status === "not_connected" && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving || !webhookUrl.trim()}>
              {isSaving ? "Connecting..." : "Connect Make"}
            </Button>
          </div>
        )}

        {/* Connected Info */}
        {status === "connected" && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Connected to Make</p>
                <p className="text-xs text-green-700 mt-1">
                  Form submissions will be sent to your Make scenario
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
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin mr-2" />
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
                  Test sent!
                </span>
              )}

              {testResult === "error" && (
                <span className="text-sm text-red-600">Test failed</span>
              )}
            </div>
          </div>
        )}

        {/* Data Format */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-900 mb-2">
            Webhook Payload Format
          </h4>
          <div className="text-xs text-gray-600 space-y-1 font-mono bg-gray-50 p-3 rounded">
            <div>{"{"}</div>
            <div className="ml-2">"formId": "{formId}",</div>
            <div className="ml-2">"submissionId": "...",</div>
            <div className="ml-2">"completed": true,</div>
            <div className="ml-2">"data": {"{"} ... {"}"}</div>
            <div>{"}"}</div>
          </div>
        </div>

        {/* Popular Apps */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Popular apps in Make:</strong>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Google Workspace",
              "Microsoft 365",
              "Slack",
              "Notion",
              "Airtable",
              "Salesforce",
              "Shopify",
              "Stripe",
              "+ 1,490 more",
            ].map((app) => (
              <span
                key={app}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700"
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
