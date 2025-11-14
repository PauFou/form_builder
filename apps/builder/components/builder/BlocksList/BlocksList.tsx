"use client";

import React, { useState } from "react";
import { Plus, FileText, GripVertical } from "lucide-react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import { AddBlockModal } from "./AddBlockModal";

export function BlocksList() {
  const { form, selectedBlockId, selectBlock, addBlock } = useFormBuilderStore();
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);

  // Get blocks from the first page
  const blocks = form?.pages?.[0]?.blocks || [];

  const handleSelectBlock = (blockType: string) => {
    if (form?.pages?.[0]) {
      const newBlock = {
        id: crypto.randomUUID(),
        type: blockType,
        question: getDefaultQuestion(blockType),
        description: "",
        required: false,
        key: blockType.replace(/_/g, "-"),
      };
      addBlock(newBlock as any, form.pages[0].id);
      setIsAddBlockModalOpen(false);
    }
  };

  const getDefaultQuestion = (type: string): string => {
    const questionMap: Record<string, string> = {
      contact_info: "Please fill in your contact information",
      short_text: "What's your name?",
      long_text: "Tell us more about yourself",
      phone_number: "What's your phone number?",
      statement: "Welcome to our survey!",
      number: "How many?",
      website_url: "What's your website?",
      single_select: "Choose one option",
      multi_select: "Select all that apply",
      dropdown: "Select from dropdown",
      date: "Pick a date",
      address: "What's your address?",
      scheduler: "Schedule a meeting",
      star_rating: "Rate your experience",
      opinion_scale: "How likely are you to recommend us?",
      ranking: "Rank the following",
      signature: "Please sign here",
      file_upload: "Upload your files",
      payment: "Payment details",
      matrix: "Matrix question",
      nps: "How likely are you to recommend us to a friend?",
    };
    return questionMap[type] || "New question";
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50 border-r">
        {/* Blocks Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="pt-4 px-2 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Blocks</h4>
              <button
                onClick={() => setIsAddBlockModalOpen(true)}
                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            {/* Block List */}
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
              {blocks.map((block, index) => {
                const isSelected = block.id === selectedBlockId;

                // YouForm block type color mapping
                const getBlockColors = (type: string) => {
                  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
                    contact_info: { bg: 'bg-youform-blocks-contact', border: 'border-youform-blocks-contact-dark', text: 'text-purple-900', icon: 'text-purple-700' },
                    short_text: { bg: 'bg-youform-blocks-text', border: 'border-youform-blocks-text-dark', text: 'text-blue-900', icon: 'text-blue-700' },
                    long_text: { bg: 'bg-youform-blocks-longtext', border: 'border-youform-blocks-longtext-dark', text: 'text-yellow-900', icon: 'text-yellow-700' },
                    phone_number: { bg: 'bg-youform-blocks-phone', border: 'border-youform-blocks-phone-dark', text: 'text-purple-900', icon: 'text-purple-700' },
                    statement: { bg: 'bg-youform-blocks-statement', border: 'border-youform-blocks-statement-dark', text: 'text-pink-900', icon: 'text-pink-700' },
                    number: { bg: 'bg-youform-blocks-number', border: 'border-youform-blocks-number-dark', text: 'text-red-900', icon: 'text-red-700' },
                    website_url: { bg: 'bg-youform-blocks-url', border: 'border-youform-blocks-url-dark', text: 'text-cyan-900', icon: 'text-cyan-700' },
                    single_select: { bg: 'bg-youform-blocks-select', border: 'border-youform-blocks-select-dark', text: 'text-green-900', icon: 'text-green-700' },
                    multi_select: { bg: 'bg-youform-blocks-multiselect', border: 'border-youform-blocks-multiselect-dark', text: 'text-orange-900', icon: 'text-orange-700' },
                    dropdown: { bg: 'bg-youform-blocks-dropdown', border: 'border-youform-blocks-dropdown-dark', text: 'text-indigo-900', icon: 'text-indigo-700' },
                    // Fallback for other types
                    default: { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-600' },
                  };

                  return colorMap[type] || colorMap.default;
                };

                const colors = getBlockColors(block.type);
                const bgClass = isSelected
                  ? `${colors.bg} border ${colors.border}`
                  : `${colors.bg} border ${colors.border} hover:border-opacity-80`;
                const iconClass = isSelected ? colors.icon : colors.icon;
                const textClass = isSelected ? `${colors.text} font-medium` : colors.text;

                return (
                  <button
                    key={block.id}
                    onClick={() => selectBlock(block.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-md transition-all flex items-center gap-2 group my-2",
                      bgClass
                    )}
                  >
                    <FileText className={cn("w-4 h-4 flex-shrink-0", iconClass)} />
                    <span className={cn("text-xs flex-1 truncate", textClass)}>
                      {index + 1}. {block.question || `${block.type} block`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thank you page Section */}
          <div className="pt-4 px-2 pb-40 flex-shrink-0 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Thank you page</h4>
              <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            <button className="w-full text-left px-2 py-2 rounded-md bg-pink-100 border border-pink-200 hover:border-pink-300 transition-all flex items-center gap-2 my-2">
              <FileText className="w-4 h-4 text-pink-700 flex-shrink-0" />
              <span className="text-xs text-pink-900 flex-1 truncate">Thank you! 🙏</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={isAddBlockModalOpen}
        onClose={() => setIsAddBlockModalOpen(false)}
        onSelectBlock={handleSelectBlock}
      />
    </>
  );
}
