"use client";

import React, { useState } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Input, Label } from "@skemya/ui";
import { cn } from "../../lib/utils";

interface TypeformImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (typeformUrl: string) => Promise<void>;
}

type ImportStep = "input" | "processing" | "success" | "error";

export function TypeformImportModal({ isOpen, onClose, onImport }: TypeformImportModalProps) {
  const [typeformUrl, setTypeformUrl] = useState("");
  const [step, setStep] = useState<ImportStep>("input");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!typeformUrl.trim()) {
      setError("Please enter a Typeform URL");
      return;
    }

    // Validate Typeform URL
    const typeformRegex = /typeform\.com\/(to\/)?([a-zA-Z0-9]+)/;
    if (!typeformRegex.test(typeformUrl)) {
      setError("Invalid Typeform URL. Please enter a valid Typeform link.");
      return;
    }

    setError(null);
    setStep("processing");

    try {
      await onImport(typeformUrl);
      setStep("success");
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to import Typeform. Please try again.");
      setStep("error");
    }
  };

  const handleClose = () => {
    setTypeformUrl("");
    setStep("input");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow z-10"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Header */}
        <div className="px-12 pt-10 pb-6 text-center border-b">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Import from Typeform</h2>
          <p className="text-base text-gray-600">
            Enter your Typeform URL to import all questions and logic
          </p>
        </div>

        {/* Content */}
        <div className="px-12 py-8">
          {step === "input" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="typeform-url" className="text-sm font-medium">
                  Typeform URL
                </Label>
                <Input
                  id="typeform-url"
                  type="url"
                  placeholder="https://yourcompany.typeform.com/to/abc123"
                  value={typeformUrl}
                  onChange={(e) => {
                    setTypeformUrl(e.target.value);
                    setError(null);
                  }}
                  className="text-base"
                  autoFocus
                />
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What will be imported?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    All questions and blocks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Logic jumps and branching
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Thank you screen
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Design theme (colors, fonts)
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Importing your Typeform...</h3>
              <p className="text-gray-600">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Import successful!</h3>
              <p className="text-gray-600">Your Typeform has been imported successfully.</p>
            </div>
          )}

          {step === "error" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Import failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => setStep("input")} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "input" && (
          <div className="px-12 py-6 bg-gray-50 border-t flex items-center justify-between">
            <a
              href="https://help.typeform.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              How to find my Typeform URL?
            </a>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport}>Import Form</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
