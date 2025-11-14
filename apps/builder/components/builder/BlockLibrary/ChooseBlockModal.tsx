"use client";

import React, { useState } from "react";
import { X, User, AlignLeft, Phone, FileText, Hash, Link as LinkIcon, CheckSquare } from "lucide-react";
import { cn } from "../../../lib/utils";

interface Block {
  id: string;
  name: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  preview: {
    title: string;
    fields: Array<{
      label: string;
      placeholder: string;
      type?: string;
    }>;
  };
}

const blocks: Block[] = [
  {
    id: "contact_info",
    name: "Contact Info",
    icon: User,
    bgColor: "bg-purple-200",
    textColor: "text-purple-900",
    preview: {
      title: "Please fill the following",
      fields: [
        { label: "First Name", placeholder: "John" },
        { label: "Last Name", placeholder: "Doe" },
        { label: "Email", placeholder: "john@example.com" },
        { label: "Phone Number", placeholder: "(201) 555-0123", type: "phone" },
        { label: "Company", placeholder: "Acme Inc" },
      ],
    },
  },
  {
    id: "short_text",
    name: "Short Text",
    icon: AlignLeft,
    bgColor: "bg-blue-300",
    textColor: "text-blue-900",
    preview: {
      title: "What's your name?",
      fields: [{ label: "", placeholder: "Type your answer here..." }],
    },
  },
  {
    id: "long_text",
    name: "Long Text",
    icon: AlignLeft,
    bgColor: "bg-yellow-300",
    textColor: "text-yellow-900",
    preview: {
      title: "Tell us more about yourself",
      fields: [{ label: "", placeholder: "Type your answer here..." }],
    },
  },
  {
    id: "phone_number",
    name: "Phone Number",
    icon: Phone,
    bgColor: "bg-purple-300",
    textColor: "text-purple-900",
    preview: {
      title: "What's your phone number?",
      fields: [{ label: "", placeholder: "(___) ___-____", type: "phone" }],
    },
  },
  {
    id: "statement",
    name: "Statement",
    icon: FileText,
    bgColor: "bg-pink-300",
    textColor: "text-pink-900",
    preview: {
      title: "Welcome to our survey!",
      fields: [],
    },
  },
  {
    id: "number",
    name: "Number",
    icon: Hash,
    bgColor: "bg-orange-200",
    textColor: "text-orange-900",
    preview: {
      title: "How many?",
      fields: [{ label: "", placeholder: "0" }],
    },
  },
  {
    id: "website_url",
    name: "Website URL",
    icon: LinkIcon,
    bgColor: "bg-cyan-200",
    textColor: "text-cyan-900",
    preview: {
      title: "What's your website?",
      fields: [{ label: "", placeholder: "https://example.com" }],
    },
  },
  {
    id: "single_select",
    name: "Single Select Op...",
    icon: CheckSquare,
    bgColor: "bg-green-300",
    textColor: "text-green-900",
    preview: {
      title: "Choose one option",
      fields: [
        { label: "Option 1", placeholder: "" },
        { label: "Option 2", placeholder: "" },
        { label: "Option 3", placeholder: "" },
      ],
    },
  },
];

interface ChooseBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (blockType: string) => void;
}

export function ChooseBlockModal({ isOpen, onClose, onSelectBlock }: ChooseBlockModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  if (!isOpen) return null;

  const filteredBlocks = blocks.filter((block) =>
    block.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
  };

  const handleBlockDoubleClick = (block: Block) => {
    onSelectBlock(block.id);
    onClose();
  };

  const handleUseBlock = () => {
    if (selectedBlock) {
      onSelectBlock(selectedBlock.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1 hover:bg-gray-100 rounded transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Choose your block</h2>

          {/* Search */}
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Content - 2 Columns */}
        <div className="flex h-[calc(85vh-200px)]">
          {/* Left - Block List */}
          <div className="w-1/3 border-r overflow-y-auto px-8 py-4 space-y-2">
            {filteredBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <button
                  key={block.id}
                  onClick={() => handleBlockClick(block)}
                  onDoubleClick={() => handleBlockDoubleClick(block)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
                    selectedBlock?.id === block.id
                      ? `${block.bgColor} border-2 border-dashed border-blue-500`
                      : `${block.bgColor} hover:opacity-80`
                  )}
                >
                  <Icon className={cn("w-5 h-5", block.textColor)} />
                  <span className={cn("font-medium text-base", block.textColor)}>
                    {block.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right - Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedBlock ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    {selectedBlock.id === "contact_info"
                      ? "Contact Info Block"
                      : selectedBlock.preview.title}
                  </h3>

                  {selectedBlock.id === "contact_info" ? (
                    <div className="space-y-4">
                      <p className="text-base text-gray-700 mb-6">{selectedBlock.preview.title}</p>
                      {selectedBlock.preview.fields.map((field, idx) => (
                        <div key={idx}>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                          />
                        </div>
                      ))}
                      <button className="mt-6 px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors">
                        Next →
                      </button>
                    </div>
                  ) : selectedBlock.preview.fields.length > 0 ? (
                    <div className="space-y-4">
                      {selectedBlock.preview.fields.map((field, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border-b border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                        />
                      ))}
                      <button className="mt-6 px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors">
                        OK ✓
                      </button>
                    </div>
                  ) : (
                    <button className="mt-6 px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors">
                      Continue
                    </button>
                  )}
                </div>

                {/* Use this block button */}
                <button
                  onClick={handleUseBlock}
                  className="mt-8 px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
                >
                  Use this block →
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No block selected</h3>
                <p className="text-base text-gray-600 max-w-md mb-2">
                  Select a block from left to know about it and to use in the form.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Tip: you can double click on the left blocks to add them quickly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
