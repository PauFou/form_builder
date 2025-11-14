import React, { useState } from "react";
import { Calendar, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@skemya/ui";
import { IntegrationCard } from "./IntegrationCard";

interface CalComIntegrationProps {
  formId: string;
  integration?: {
    id: string;
    api_key: string;
    event_type_id?: string;
    username: string;
    enabled: boolean;
  };
  onSave: (config: any) => Promise<void>;
  onFetchEventTypes?: (apiKey: string) => Promise<Array<{ id: string; title: string }>>;
}

export function CalComIntegration({
  formId,
  integration,
  onSave,
  onFetchEventTypes,
}: CalComIntegrationProps) {
  const [apiKey, setApiKey] = useState(integration?.api_key || "");
  const [username, setUsername] = useState(integration?.username || "");
  const [eventTypeId, setEventTypeId] = useState(integration?.event_type_id || "");
  const [eventTypes, setEventTypes] = useState<Array<{ id: string; title: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const status = integration?.enabled ? "connected" : "not_connected";

  const handleFetchEventTypes = async () => {
    if (!apiKey.trim()) {
      setValidationError("Please enter your API key first");
      return;
    }

    setIsFetching(true);
    setValidationError(null);
    try {
      if (onFetchEventTypes) {
        const types = await onFetchEventTypes(apiKey);
        setEventTypes(types);
      } else {
        // Mock data for demo
        setEventTypes([
          { id: "1", title: "30 Minute Meeting" },
          { id: "2", title: "Discovery Call" },
          { id: "3", title: "Follow-up Call" },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch event types:", error);
      setValidationError("Failed to fetch event types. Check your API key.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setValidationError("Please enter your Cal.com API key");
      return;
    }

    if (!username.trim()) {
      setValidationError("Please enter your Cal.com username");
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      await onSave({
        api_key: apiKey,
        username,
        event_type_id: eventTypeId || undefined,
        enabled: true,
      });
    } catch (error) {
      console.error("Failed to save Cal.com integration:", error);
      setValidationError("Failed to save integration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Cal.com?")) return;

    setIsSaving(true);
    try {
      await onSave({
        enabled: false,
      });
      setApiKey("");
      setUsername("");
      setEventTypeId("");
      setEventTypes([]);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IntegrationCard
      name="Cal.com"
      description="Open-source scheduling embedded in your form"
      icon={<Calendar className="w-6 h-6 text-blue-600" />}
      status={status}
      onDisconnect={handleDisconnect}
      setupGuideUrl="https://cal.com/docs/api-reference"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            How to connect Cal.com
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to Cal.com Settings → Security → API Keys</li>
            <li>Create a new API key</li>
            <li>Copy the API key and your username</li>
            <li>Paste them below</li>
            <li>(Optional) Select a specific event type</li>
          </ol>
        </div>

        {validationError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="calcom-api-key">Cal.com API Key *</Label>
          <Input
            id="calcom-api-key"
            type="password"
            placeholder="cal_live_xxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setValidationError(null);
            }}
            disabled={status === "connected"}
          />
          <p className="text-xs text-gray-500">
            Found in Cal.com → Settings → Security → API Keys
          </p>
        </div>

        {/* Username Input */}
        <div className="space-y-2">
          <Label htmlFor="calcom-username">Cal.com Username *</Label>
          <Input
            id="calcom-username"
            placeholder="yourname"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setValidationError(null);
            }}
            disabled={status === "connected"}
          />
          <p className="text-xs text-gray-500">
            Your Cal.com username (e.g., if your link is cal.com/yourname, enter "yourname")
          </p>
        </div>

        {/* Event Type Selection */}
        {status === "not_connected" && (
          <div className="space-y-2">
            <Label htmlFor="calcom-event-type">Event Type (Optional)</Label>
            <div className="flex gap-2">
              <Select
                value={eventTypeId}
                onValueChange={setEventTypeId}
                disabled={eventTypes.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an event type..." />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleFetchEventTypes}
                disabled={isFetching || !apiKey.trim()}
              >
                {isFetching ? "Loading..." : "Load Types"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Leave empty to show all your event types
            </p>
          </div>
        )}

        {/* Save Button */}
        {status === "not_connected" && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim() || !username.trim()}
            >
              {isSaving ? "Connecting..." : "Connect Cal.com"}
            </Button>
          </div>
        )}

        {/* Connected Info */}
        {status === "connected" && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Connected to Cal.com
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Username: <code className="bg-green-100 px-1 rounded">{username}</code>
                </p>
                {eventTypeId && (
                  <p className="text-xs text-green-700 mt-1">
                    Event Type ID: <code className="bg-green-100 px-1 rounded">{eventTypeId}</code>
                  </p>
                )}
                <a
                  href={`https://cal.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
                >
                  View your Cal.com page
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h4>
              <p className="text-xs text-blue-800">
                Add a <strong>Scheduler</strong> block to your form to embed Cal.com booking.
                Form responses can pre-fill attendee information.
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Cal.com features:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Open-source & self-hostable</li>
            <li>Unlimited event types & bookings</li>
            <li>Calendar sync (Google, Outlook, Apple)</li>
            <li>Round-robin scheduling for teams</li>
            <li>Custom workflows & automations</li>
            <li>Full API access</li>
          </ul>
        </div>
      </div>
    </IntegrationCard>
  );
}
