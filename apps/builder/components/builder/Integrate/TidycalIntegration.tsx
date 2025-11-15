import React, { useState } from "react";
import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import { Button, Input, Label } from "@skemya/ui";
import { IntegrationCard } from "./IntegrationCard";

interface TidycalIntegrationProps {
  formId: string;
  integration?: {
    id: string;
    booking_link: string;
    enabled: boolean;
  };
  onSave: (config: any) => Promise<void>;
}

export function TidycalIntegration({ formId, integration, onSave }: TidycalIntegrationProps) {
  const [bookingLink, setBookingLink] = useState(integration?.booking_link || "");
  const [isSaving, setIsSaving] = useState(false);

  const status = integration?.enabled ? "connected" : "not_connected";

  const handleSave = async () => {
    if (!bookingLink.trim()) {
      alert("Please enter your Tidycal booking link");
      return;
    }

    // Validate URL
    try {
      new URL(bookingLink);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        booking_link: bookingLink,
        enabled: true,
      });
    } catch (error) {
      console.error("Failed to save Tidycal integration:", error);
      alert("Failed to save integration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Tidycal?")) return;

    setIsSaving(true);
    try {
      await onSave({
        enabled: false,
      });
      setBookingLink("");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IntegrationCard
      name="Tidycal"
      description="Simple, affordable scheduling embedded in your form"
      icon={<Calendar className="w-6 h-6 text-cyan-600" />}
      status={status}
      onDisconnect={handleDisconnect}
      setupGuideUrl="https://tidycal.com"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
          <h4 className="text-sm font-semibold text-cyan-900 mb-2">How to connect Tidycal</h4>
          <ol className="text-sm text-cyan-800 space-y-1 list-decimal list-inside">
            <li>Log in to your Tidycal account</li>
            <li>Go to your event type and copy the booking link</li>
            <li>Paste the link below</li>
            <li>Add a "Scheduler" block to your form</li>
          </ol>
        </div>

        {/* Booking Link Input */}
        <div className="space-y-2">
          <Label htmlFor="tidycal-link">Tidycal Booking Link *</Label>
          <Input
            id="tidycal-link"
            type="url"
            placeholder="https://tidycal.com/yourname/meeting"
            value={bookingLink}
            onChange={(e) => setBookingLink(e.target.value)}
            disabled={status === "connected"}
          />
          <p className="text-xs text-gray-500">Your Tidycal event booking link</p>
        </div>

        {/* Save Button */}
        {status === "not_connected" && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving || !bookingLink.trim()}>
              {isSaving ? "Connecting..." : "Connect Tidycal"}
            </Button>
          </div>
        )}

        {/* Connected Info */}
        {status === "connected" && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Connected to Tidycal</p>
                <p className="text-xs text-green-700 mt-1">Booking link is ready to be embedded</p>
                <a
                  href={bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-600 hover:underline inline-flex items-center gap-1 mt-2"
                >
                  View booking page
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h4>
              <p className="text-xs text-blue-800">
                Add a <strong>Scheduler</strong> block to embed Tidycal. Respondents can book
                meetings directly without leaving the form.
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Tidycal features:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Unlimited bookings for one flat fee</li>
            <li>Calendar integration (Google Calendar, Outlook)</li>
            <li>Automated email notifications</li>
            <li>Custom availability rules</li>
            <li>Buffer time between meetings</li>
            <li>Custom branding options</li>
          </ul>
        </div>
      </div>
    </IntegrationCard>
  );
}
