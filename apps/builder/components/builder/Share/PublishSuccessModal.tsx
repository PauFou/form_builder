"use client";

import React, { useState } from "react";
import { X, Copy, Check, Monitor, Settings, Link2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function PublishSuccessModal({
  isOpen,
  onClose,
  shareUrl,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Your masterpiece is now live 🚀
        </h2>

        {/* Share URL Section */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center mb-4">
            Share it with the world:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Social Share Icons */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
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

        {/* Next Steps */}
        <div>
          <p className="text-sm text-gray-600 text-center mb-4">
            Or choose your next adventure:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button className="p-4 rounded-lg bg-purple-300 hover:bg-purple-400 text-center transition-colors">
              <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-purple-900" />
              </div>
              <p className="text-sm font-semibold text-purple-900 mb-1">Embed</p>
              <p className="text-xs text-purple-800">in website</p>
            </button>

            <button className="p-4 rounded-lg bg-green-300 hover:bg-green-400 text-center transition-colors">
              <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                <Settings className="w-6 h-6 text-green-900" />
              </div>
              <p className="text-sm font-semibold text-green-900 mb-1">Setup</p>
              <p className="text-xs text-green-800">integrations</p>
            </button>

            <button className="p-4 rounded-lg bg-yellow-300 hover:bg-yellow-400 text-center transition-colors">
              <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-yellow-900" />
              </div>
              <p className="text-sm font-semibold text-yellow-900 mb-1">Customize</p>
              <p className="text-xs text-yellow-800">form link</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
