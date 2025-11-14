"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { TypeformImportModal } from "./TypeformImportModal";

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string | null) => void;
}

const templates = [
  {
    id: "blank",
    name: "Blank Form",
    bgColor: "bg-gray-100",
    isBlank: true,
  },
  {
    id: "job-application",
    name: "Job application template",
    bgColor: "bg-[#FFD600]",
    isBlank: false,
  },
  {
    id: "customer-feedback",
    name: "Customer feedback form..",
    bgColor: "bg-[#0000FF]",
    isBlank: false,
  },
  {
    id: "email-signup",
    name: "Name + email signup...",
    bgColor: "bg-[#FFFACD]",
    isBlank: false,
  },
  {
    id: "two-inputs",
    name: "Two inputs Template",
    bgColor: "bg-[#00FF00]",
    isBlank: false,
  },
  {
    id: "exit-survey",
    name: "Exit Survey Template",
    bgColor: "bg-[#D2B48C]",
    isBlank: false,
  },
  {
    id: "product-launch",
    name: "Product Launch Survey",
    bgColor: "bg-[#FF8C00]",
    isBlank: false,
  },
  {
    id: "contract-consulting",
    name: "Contract Consulting For...",
    bgColor: "bg-[#ADD8E6]",
    isBlank: false,
  },
];

export function TemplateSelectionModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTypeformImport, setShowTypeformImport] = useState(false);

  if (!isOpen) return null;

  const handleTemplateClick = (templateId: string | null) => {
    onSelectTemplate(templateId);
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1300px] max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow z-10"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Header */}
        <div className="px-20 pt-14 pb-10 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Select a template
          </h1>
          <button
            onClick={() => setShowTypeformImport(true)}
            className="text-base text-gray-600 underline hover:text-gray-900 transition-colors"
          >
            ...or import from Typeform
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-20 pb-8">
          <input
            type="text"
            placeholder="Search over 500+ templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 text-base border border-gray-300 rounded-full placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Templates Grid */}
        <div className="px-20 pb-14 overflow-y-auto max-h-[calc(90vh-320px)]">
          <div className="grid grid-cols-4 gap-5">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template.id === "blank" ? null : template.id)}
                className="group bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-all overflow-hidden"
              >
                {/* Preview Area */}
                <div className={cn(
                  "w-full h-56 flex items-center justify-center relative overflow-hidden",
                  template.bgColor
                )}>
                  {template.isBlank ? (
                    <Plus className="w-20 h-20 text-gray-400" strokeWidth={1.5} />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                {/* Title */}
                <div className="px-4 py-4 bg-white">
                  <h3 className="text-base font-normal text-gray-900 text-center truncate">
                    {template.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typeform Import Modal */}
      <TypeformImportModal
        isOpen={showTypeformImport}
        onClose={() => setShowTypeformImport(false)}
        onImport={async (url) => {
          // TODO: Implement actual import from API
          console.log("Importing Typeform from:", url);
          // For now, just create a blank form
          onSelectTemplate(null);
        }}
      />
    </div>
  );
}
