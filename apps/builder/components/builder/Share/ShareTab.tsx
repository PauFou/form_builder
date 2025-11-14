"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Copy,
  Check,
  Link2,
  Mail,
  MessageSquare,
  Share2,
} from "lucide-react";
import { Button, Input } from "@skemya/ui";
import { cn } from "../../../lib/utils";
import { PublishSuccessModal } from "./PublishSuccessModal";

interface ShareTabProps {
  formId: string;
  isPublished: boolean;
  shareUrl?: string;
  onPublish: () => void;
}

export function ShareTab({ formId, isPublished, shareUrl, onPublish }: ShareTabProps) {
  const [copied, setCopied] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublishClick = () => {
    onPublish();
    setShowSuccessModal(true);
  };

  if (!isPublished) {
    return (
      <div className="flex-1 bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Unpublished Warning */}
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-900 font-medium">
                You haven't published the form yet.
              </p>
            </div>
            <button
              onClick={handlePublishClick}
              className="text-sm font-medium text-red-900 hover:text-red-950 flex items-center gap-1 whitespace-nowrap"
            >
              Publish Now →
            </button>
          </div>
        </div>

        <PublishSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          shareUrl={shareUrl || `https://youform.app/f/${formId}`}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Share URL Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
            />
            <Button
              onClick={handleCopy}
              variant="youform-primary"
              size="youform-default"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Make sure your form is published before you share it.
          </p>

          {/* Social Share Icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <Copy className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <path d="M2 8h20"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Embed Code Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Embed in your website as</h3>
            <Button variant="youform-secondary" size="youform-default">
              + Configure
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Works with WordPress, Squarespace, Webflow, Wix, and more.
          </p>

          <p className="text-sm text-gray-600 mb-2">
            Paste the below code snippet in your website where you want the form to appear.
          </p>

          <div className="relative mb-4">
            <pre className="bg-gray-900 rounded-md p-4 text-sm font-mono text-gray-100 overflow-x-auto">
{`<div data-youform-embed="${formId}"></div>`}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`<div data-youform-embed="${formId}"></div>`);
              }}
              className="absolute top-3 right-3 p-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            You can configure the width and height using the Configure button.
          </p>

          <p className="text-sm text-gray-600 mb-2">
            Then include the following script tag in your page:
          </p>

          <div className="relative">
            <pre className="bg-gray-900 rounded-md p-4 text-sm font-mono text-gray-100 overflow-x-auto">
{`<script src="https://app.youform.com/embed.js"></script>`}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText('<script src="https://app.youform.com/embed.js"></script>');
              }}
              className="absolute top-3 right-3 p-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Custom Domain Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-gray-900">Custom Domain</h3>
            <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-bold rounded">
              PRO
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Please buy a PRO plan to add your own custom domain.
          </p>
        </div>

        {/* Link Settings */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            To change form Title, share image or favicon go to{" "}
            <button className="text-blue-600 hover:text-blue-700 underline">
              Link Settings
            </button>
          </p>
        </div>
      </div>

      <PublishSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        shareUrl={shareUrl || `https://youform.app/f/${formId}`}
      />
    </div>
  );
}
