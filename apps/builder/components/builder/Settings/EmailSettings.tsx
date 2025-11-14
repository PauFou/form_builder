"use client";

import React, { useState } from "react";
import { Bold, Italic, Link2 } from "lucide-react";
import { Button } from "@skemya/ui";
import { cn } from "../../../lib/utils";

interface EmailSettingsProps {
  formId: string;
}

export function EmailSettings({ formId }: EmailSettingsProps) {
  const [activeTab, setActiveTab] = useState<"me" | "responder">("me");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailSubject, setEmailSubject] = useState("🎉 You received a new submission in My Form");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab("me")}
          className={cn(
            "px-6 py-2 text-sm font-medium rounded-md transition-colors border",
            activeTab === "me"
              ? "bg-white border-gray-300 text-gray-900"
              : "bg-transparent border-transparent text-gray-600 hover:bg-gray-50"
          )}
        >
          Email to Me
        </button>
        <button
          onClick={() => setActiveTab("responder")}
          className={cn(
            "px-6 py-2 text-sm font-medium rounded-md transition-colors border",
            activeTab === "responder"
              ? "bg-white border-gray-300 text-gray-900"
              : "bg-transparent border-transparent text-gray-600 hover:bg-gray-50"
          )}
        >
          Email to Responder
        </button>
      </div>

      {activeTab === "me" && (
        <>
          {/* Receive Email Notifications */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-1">
                Receive Email Notifications
              </h4>
              <p className="text-sm text-gray-600">
                Receive email notifications when someone submits your form.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">× Add multiple emails</span>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  emailNotifications ? "bg-green-500" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                    emailNotifications ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* To Field */}
          <div className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-semibold text-gray-900">To</h4>
              <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Receiver's email address. You can add multiple recipients in PRO plan.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="youform-primary" size="youform-sm">
                Configure
              </Button>
              <span className="text-sm text-gray-600">pfournier597@gmail.com</span>
            </div>
          </div>

          {/* Reply To */}
          <div className="py-4">
            <h4 className="text-base font-semibold text-gray-900 mb-2">Reply To</h4>
            <p className="text-sm text-gray-600 mb-3">
              Choose an email block from your form and the answer of that field will be set as{" "}
              <strong>Reply To</strong> of the notification email.
            </p>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>-- Select an email block from the form --</option>
            </select>
          </div>

          {/* Email Subject */}
          <div className="py-4">
            <h4 className="text-base font-semibold text-gray-900 mb-2">Email Subject</h4>
            <p className="text-sm text-gray-600 mb-3">
              Customize the subject of the notification email. Type @ to include questions and
              variables.
            </p>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject..."
            />
          </div>

          {/* Email Body */}
          <div className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-semibold text-gray-900">Email Body</h4>
              <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Customize the body of the notification email using the editor below.
            </p>

            {/* Rich text editor */}
            <div className="border border-gray-300 rounded-md overflow-hidden">
              {/* Toolbar */}
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

              {/* Content */}
              <div className="p-4 min-h-[300px] text-sm text-gray-900 bg-white space-y-3">
                <p>Hi,</p>
                <p>
                  Your form{" "}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    @Form Name
                  </span>{" "}
                  just received a new submission.
                </p>
                <p>Here are the details:</p>
                <p>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    @All Answers
                  </span>
                </p>
                <p>
                  You can{" "}
                  <a
                    href={`/form/${formId}/submissions`}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    View all submissions here
                  </a>
                </p>
                <p>
                  Don't want to receive these emails?{" "}
                  <a
                    href={`/form/${formId}/settings/notifications`}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    You can configure it here
                  </a>
                </p>
                <p>Thanks,</p>
                <p>Youform</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "responder" && (
        <div className="py-20 text-center">
          <p className="text-gray-600">Email to Responder settings will be available here.</p>
        </div>
      )}
    </div>
  );
}
