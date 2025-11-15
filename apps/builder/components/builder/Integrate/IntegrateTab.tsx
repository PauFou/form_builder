"use client";

import React from "react";
import { Mail, Webhook, Sheet, MessageSquare, CreditCard, Calendar, Tag, Zap } from "lucide-react";
import { cn } from "../../../lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isPro?: boolean;
  actionLabel: string;
  actionLink?: string;
  setupGuideLink?: string;
}

const integrations: Integration[] = [
  {
    id: "email",
    name: "Email",
    description: "Send and receive emails for each submission.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center">
        <Mail className="w-6 h-6 text-white" />
      </div>
    ),
    actionLabel: "Configure from settings →",
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Receive a webhook for all submissions.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
        <Webhook className="w-6 h-6 text-white" />
      </div>
    ),
    actionLabel: "Connect",
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Sync all your submissions to a Google Sheet stored on your Google Drive.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
        <Sheet className="w-6 h-6 text-white" />
      </div>
    ),
    actionLabel: "Authorize",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get real time notifications in your Slack workspace for every new submission.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-7 h-7">
          <path fill="#E01E5A" d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2z" />
          <path
            fill="#36C5F0"
            d="M8 15a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-5z"
          />
          <path fill="#2EB67D" d="M10 6a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2h-2z" />
          <path
            fill="#ECB22E"
            d="M10 8a2 2 0 0 1 2 2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5z"
          />
          <path fill="#E01E5A" d="M18 10a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2v-2z" />
          <path
            fill="#36C5F0"
            d="M16 10a2 2 0 0 1-2 2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5z"
          />
        </svg>
      </div>
    ),
    actionLabel: "Authorize",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Collect payments from your form using Stripe.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
        <div className="text-white font-bold text-xl">S</div>
      </div>
    ),
    isPro: true,
    actionLabel: "Connect",
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Book meetings with your form respondents using Calendly.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
        <Calendar className="w-6 h-6 text-white" />
      </div>
    ),
    actionLabel: "Connect",
  },
  {
    id: "cal_com",
    name: "Cal.com",
    description: "Book meetings with your form respondents using Cal.com.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
        <span className="text-white font-bold text-sm">Cal</span>
      </div>
    ),
    actionLabel: "Connect",
  },
  {
    id: "savvycal",
    name: "Savvycal",
    description: "Book meetings with your form respondents using Savvycal.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="text-white font-bold text-xl">S</div>
      </div>
    ),
    actionLabel: "Connect",
  },
  {
    id: "tidycal",
    name: "Tidycal",
    description: "Book meetings with your form respondents using Tidycal.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
        <Calendar className="w-6 h-6 text-white" />
      </div>
    ),
    actionLabel: "Connect",
  },
  {
    id: "google_tag_manager",
    name: "Google Tag Manager",
    description:
      "Track your form by sending data to Google Analytics, Google Ads, Facebook Pixel and more.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
        <Tag className="w-6 h-6 text-white" />
      </div>
    ),
    isPro: true,
    actionLabel: "Connect",
    setupGuideLink: "Check setup guide",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect your form to Zapier for automation and send data to 6000+ apps.",
    icon: (
      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
        <Zap className="w-6 h-6 text-white" />
      </div>
    ),
    actionLabel: "Connect",
  },
];

interface IntegrateTabProps {
  formId: string;
}

export function IntegrateTab({ formId }: IntegrateTabProps) {
  const [connectedIntegrations, setConnectedIntegrations] = React.useState<Set<string>>(new Set());

  const handleConnect = (id: string) => {
    // Toggle connection status
    setConnectedIntegrations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Integrate form to your favorite tools
          </h1>
          <p className="text-sm text-gray-600">
            Connect your form to popular services and automate your workflows.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {integrations.map((integration) => {
            const isConnected = connectedIntegrations.has(integration.id);

            return (
              <div
                key={integration.id}
                className="px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {integration.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{integration.name}</h3>
                      {integration.isPro && (
                        <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">
                          PRO
                        </span>
                      )}
                      {isConnected && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                    {integration.setupGuideLink && (
                      <button className="text-sm text-blue-600 hover:text-blue-700 mt-1 underline">
                        {integration.setupGuideLink}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {integration.actionLabel === "Configure from settings →" ? (
                    <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                      {integration.actionLabel}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className={cn(
                        "px-6 py-2 text-sm font-medium rounded-md transition-colors",
                        isConnected
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-[#475569] text-white hover:bg-[#334155]"
                      )}
                    >
                      {isConnected ? "Disconnect" : integration.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Not seeing an integration you need?{" "}
            <button className="text-blue-600 hover:text-blue-700 underline font-medium">
              Submit it here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
