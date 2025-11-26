"use client";

import React, { useState, useMemo } from "react";
import { Bold, Italic, Link2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

export function EmailSettings() {
  const { form, updateForm } = useFormBuilderStore();
  const [activeTab, setActiveTab] = useState<"me" | "responder">("me");

  // Get email blocks from the form
  const emailBlocks = useMemo(() => {
    if (!form?.pages) return [];
    return form.pages
      .flatMap((page) => page.blocks)
      .filter((block) => block.type === "email")
      .map((block) => ({
        id: block.id,
        question: block.question || "Untitled Email",
      }));
  }, [form?.pages]);

  const settings = form?.settings || {};
  const emailNotifications = settings.emailNotifications || {};
  const responderEmail = settings.responderEmail || {};

  const handleEmailNotificationChange = (key: string, value: any) => {
    updateForm({
      settings: {
        ...settings,
        emailNotifications: {
          ...emailNotifications,
          [key]: value,
        },
      },
    });
  };

  const handleResponderEmailChange = (key: string, value: any) => {
    updateForm({
      settings: {
        ...settings,
        responderEmail: {
          ...responderEmail,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Floating Tabs - Centered */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded">
          <button
            onClick={() => setActiveTab("me")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-colors",
              activeTab === "me"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Email to Me
          </button>
          <button
            onClick={() => setActiveTab("responder")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-colors",
              activeTab === "responder"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Email to Responder
          </button>
        </div>
      </div>

      {/* Email to Me Tab */}
      {activeTab === "me" && (
        <div className="space-y-6">
          {/* Receive Email Notifications */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-900">
                  Receive Email Notifications
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Receive email notifications when someone submits your form.
                </p>
              </div>
              <Switch
                checked={emailNotifications.enabled ?? false}
                onCheckedChange={(checked) => handleEmailNotificationChange("enabled", checked)}
              />
            </div>
          </div>

          {/* To Field */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-semibold text-gray-900">To</Label>
              <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">
                PRO
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Receiver's email address. You can add multiple recipients in PRO plan.
            </p>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors">
                Configure
              </button>
              <span className="text-sm text-gray-600">
                {emailNotifications.recipients?.join(", ") || "pfournier597@gmail.com"}
              </span>
            </div>
          </div>

          {/* Reply To */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">Reply To</Label>
            <p className="text-sm text-gray-500 mb-3">
              Choose an email block from your form and the answer of that field will be set as Reply
              To of the notification email.
            </p>
            <select
              value={emailNotifications.replyToField || ""}
              onChange={(e) => handleEmailNotificationChange("replyToField", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">-- Select an email block from the form --</option>
              {emailBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.question}
                </option>
              ))}
            </select>
          </div>

          {/* Email Subject */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">Email Subject</Label>
            <p className="text-sm text-gray-500 mb-3">
              Customize the subject of the notification email. Type @ to include questions and
              variables.
            </p>
            <input
              type="text"
              value={emailNotifications.subject || ""}
              onChange={(e) => handleEmailNotificationChange("subject", e.target.value)}
              placeholder="🎉 You received a new submission in My Form @"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          {/* Email Body */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-semibold text-gray-900">Email Body</Label>
              <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">
                PRO
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Customize the body of the notification email using the editor below.
            </p>

            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <Bold className="w-4 h-4 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <Italic className="w-4 h-4 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <Link2 className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="p-4 min-h-[300px] text-sm text-gray-900 bg-white">
                <p>Hi,</p>
                <p className="mt-3">
                  Your form{" "}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    @Form Name
                  </span>{" "}
                  just received a new submission.
                </p>
                <p className="mt-3">Here are the details:</p>
                <p className="mt-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    @All Answers
                  </span>
                </p>
                <p className="mt-3">
                  You can{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                    View all submissions here
                  </a>
                </p>
                <p className="mt-3">
                  Don't want to receive these emails?{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                    You can configure it here
                  </a>
                </p>
                <p className="mt-3">Thanks,</p>
                <p>Youform</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email to Responder Tab */}
      {activeTab === "responder" && (
        <div className="space-y-6">
          {/* Send email to respondent */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-900">
                  Send email to respondent
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Send a customized email to the respondent when they submit the form.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Please enable email sending from the above toggle first.
                </p>
              </div>
              <Switch
                checked={responderEmail.enabled ?? false}
                onCheckedChange={(checked) => handleResponderEmailChange("enabled", checked)}
              />
            </div>
          </div>

          {/* To Field */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">To</Label>
            <p className="text-sm text-gray-500 mb-3">
              Choose an email block from your form and we will send email to that email address when
              the form is submitted.
            </p>
            <select
              value={responderEmail.toField || ""}
              onChange={(e) => handleResponderEmailChange("toField", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">-- Select an email block from the form --</option>
              {emailBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.question}
                </option>
              ))}
            </select>
          </div>

          {/* From Name */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">From Name</Label>
            <p className="text-sm text-gray-500 mb-3">Customize the sender name.</p>
            <input
              type="text"
              value={responderEmail.fromName || ""}
              onChange={(e) => handleResponderEmailChange("fromName", e.target.value)}
              placeholder="paul fournier"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          {/* From Email Address */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              From Email Address
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Select the email address to send respondent emails from. Each address is linked to an
              SMTP setting which you can configure in the SMTP settings page.
            </p>
            <p className="text-xs text-gray-500 mb-3">
              <a href="#" className="text-indigo-600 hover:underline">
                Learn more about this feature in this help article
              </a>
              .
            </p>
            <select
              value={responderEmail.fromEmail || "no-reply@skemya.com"}
              onChange={(e) => handleResponderEmailChange("fromEmail", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">-- Select sender email --</option>
              <option value="no-reply@skemya.com">Default: no-reply@skemya.com</option>
            </select>
          </div>

          {/* Reply To */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">Reply To</Label>
            <p className="text-sm text-gray-500 mb-3">
              Set the Reply To email address. You can use the form owner's email, select an email
              field from your form, or enter a custom email.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="replyTo"
                  value="owner"
                  checked={responderEmail.replyTo === "owner" || !responderEmail.replyTo}
                  onChange={(e) => handleResponderEmailChange("replyTo", e.target.value)}
                  className="text-indigo-600"
                />
                <span className="text-sm text-gray-700">Form Owner (pfournier597@gmail.com)</span>
              </label>
            </div>
          </div>

          {/* Email Subject */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">Email Subject</Label>
            <p className="text-sm text-gray-500 mb-3">
              Customize the subject of the notification email. Type @ to include questions and
              variables.
            </p>
            <input
              type="text"
              value={responderEmail.subject || ""}
              onChange={(e) => handleResponderEmailChange("subject", e.target.value)}
              placeholder="Thanks for filling out our form"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          {/* Email Body */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">Email Body</Label>
            <p className="text-sm text-gray-500 mb-3">
              Customize the body of the notification email using the editor below.
            </p>

            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <Bold className="w-4 h-4 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <Italic className="w-4 h-4 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                  <Link2 className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="p-4 min-h-[300px] text-sm text-gray-900 bg-white">
                <p>Hi,</p>
                <p className="mt-3">
                  Thanks for filling out our form{" "}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    @Form Name
                  </span>
                  .
                </p>
                <p className="mt-3">Here is a copy of your response:</p>
                <p className="mt-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    @All Answers
                  </span>
                </p>
                <p className="mt-3">Thanks,</p>
                <p>Youform</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
