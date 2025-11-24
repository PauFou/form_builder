"use client";

import React, { useState } from "react";
import { Plus, FileText, GripVertical } from "lucide-react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import { ChooseBlockModal } from "./ChooseBlockModal";

export function BlockLibrary() {
  const { form, selectedBlockId, selectBlock, addBlock } = useFormBuilderStore();
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);

  const handleSelectBlock = (blockType: string) => {
    if (form?.pages?.[0]) {
      const newBlock = {
        id: `block-${Date.now()}`,
        type: blockType,
        question: getDefaultQuestion(blockType),
        description: "",
        required: false,
        key: blockType.replace(/_/g, "-"),
      };
      addBlock(newBlock as any, form.pages[0].id);
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
      opinion_scale: "How likely are you to recommend us?",
      star_rating: "Rate your experience",
      date: "Select a date",
      scheduler: "Book a meeting",
      ranking: "Rank these options",
      matrix: "How would you rate your experience?",
      signature: "Please sign here",
      file_upload: "Please upload a file",
      payment: "Complete your payment",
    };
    return questionMap[type] || "New question";
  };

  // Get blocks from the first page
  const blocks = form?.pages?.[0]?.blocks || [];

  // Thank you page (last page or dedicated thank you page)
  const thankYouPage = form?.pages?.[form.pages.length - 1];

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Blocks Section */}
        <div className="p-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Blocks</h2>
            <button
              onClick={() => setIsAddBlockDialogOpen(true)}
              className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          {/* Block List */}
          <div className="space-y-2">
            {blocks.map((block, index) => {
              const isSelected = block.id === selectedBlockId;
              return (
                <button
                  key={block.id}
                  onClick={() => selectBlock(block.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md transition-all flex items-center gap-2 group",
                    isSelected
                      ? "bg-pink-50 border-2 border-dashed border-pink-500"
                      : "bg-white border border-gray-200 hover:border-gray-300"
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  <FileText
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isSelected ? "text-pink-600" : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm flex-1 truncate",
                      isSelected ? "text-pink-900 font-medium" : "text-gray-700"
                    )}
                  >
                    {index + 1}. {block.question || `${block.type} block`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thank you page Section */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Thank you page</h2>
            <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Plus className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          <button className="w-full text-left px-3 py-2.5 rounded-md bg-pink-100 border border-pink-200 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4 text-pink-600 flex-shrink-0" />
            <span className="text-sm text-pink-900 flex-1 truncate">Thank you! 🙏</span>
          </button>
        </div>
      </div>

      {/* Add Block Modal */}
      <ChooseBlockModal
        isOpen={isAddBlockDialogOpen}
        onClose={() => setIsAddBlockDialogOpen(false)}
        onSelectBlock={handleSelectBlock}
      />
    </>
  );
}
