"use client";

import React, { useState } from "react";
import {
  X,
  User,
  AlignLeft,
  Phone,
  FileText,
  Hash,
  Link as LinkIcon,
  CheckSquare,
  List,
  ChevronDown,
  Calendar,
  MapPin,
  Clock,
  Star,
  BarChart3,
  ArrowUpDown,
  PenTool,
  Upload,
  CreditCard,
  Grid3x3,
  Target,
} from "lucide-react";
import { cn } from "../../../lib/utils";

interface Block {
  id: string;
  name: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  description: string;
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
    description:
      "Collect multiple contact details in one block. Includes name, email, phone, and company fields.",
    preview: {
      title: "Contact Info Block",
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
    description: "Use this for short answers. Perfect for names, titles, or brief responses.",
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
    description:
      "Use this if you want people to write longer answers. For e.g User Feedback, Full address etc.",
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
    description: "Collect phone numbers with automatic formatting and validation.",
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
    description:
      "Display information without asking a question. Great for welcome messages or instructions.",
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
    description: "Collect numeric values. Perfect for quantities, ages, or ratings.",
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
    description:
      "Collect website URLs with automatic validation. For portfolios, social links, etc.",
    preview: {
      title: "What's your website?",
      fields: [{ label: "", placeholder: "https://example.com" }],
    },
  },
  {
    id: "single_select",
    name: "Single Select Option",
    icon: CheckSquare,
    bgColor: "bg-green-300",
    description:
      "Let users choose one option from multiple choices. Perfect for preferences or categories.",
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
  {
    id: "multi_select",
    name: "Multi Select Option",
    icon: List,
    bgColor: "bg-red-300",
    description: "Allow users to select multiple options. Great for interests, features, or tags.",
    textColor: "text-red-900",
    preview: {
      title: "Select all that apply",
      fields: [
        { label: "Option 1", placeholder: "" },
        { label: "Option 2", placeholder: "" },
        { label: "Option 3", placeholder: "" },
      ],
    },
  },
  {
    id: "dropdown",
    name: "Dropdown List",
    icon: ChevronDown,
    bgColor: "bg-indigo-300",
    description: "Compact dropdown list for single selection. Ideal when you have many options.",
    textColor: "text-indigo-900",
    preview: {
      title: "Select from dropdown",
      fields: [{ label: "", placeholder: "Choose an option..." }],
    },
  },
  {
    id: "date",
    name: "Date",
    icon: Calendar,
    bgColor: "bg-teal-300",
    description: "Collect dates with a calendar picker. For appointments, birthdays, or deadlines.",
    textColor: "text-teal-900",
    preview: {
      title: "Pick a date",
      fields: [{ label: "", placeholder: "DD/MM/YYYY" }],
    },
  },
  {
    id: "address",
    name: "Address",
    icon: MapPin,
    bgColor: "bg-emerald-300",
    description: "Collect full address details including street, city, and zip code.",
    textColor: "text-emerald-900",
    preview: {
      title: "What's your address?",
      fields: [
        { label: "Street", placeholder: "123 Main St" },
        { label: "City", placeholder: "New York" },
        { label: "Zip Code", placeholder: "10001" },
      ],
    },
  },
  {
    id: "scheduler",
    name: "Scheduler",
    icon: Clock,
    bgColor: "bg-violet-300",
    description: "Let users book time slots. Perfect for meetings or appointments.",
    textColor: "text-violet-900",
    preview: {
      title: "Schedule a meeting",
      fields: [],
    },
  },
  {
    id: "star_rating",
    name: "Star Rating",
    icon: Star,
    bgColor: "bg-amber-300",
    description: "Visual star rating from 1-5. Great for satisfaction or quality ratings.",
    textColor: "text-amber-900",
    preview: {
      title: "Rate your experience",
      fields: [],
    },
  },
  {
    id: "opinion_scale",
    name: "Opinion Scale",
    icon: BarChart3,
    bgColor: "bg-lime-300",
    description: "Numeric scale for opinions. Perfect for NPS scores or likelihood ratings.",
    textColor: "text-lime-900",
    preview: {
      title: "How likely are you to recommend us?",
      fields: [],
    },
  },
  {
    id: "ranking",
    name: "Ranking",
    icon: ArrowUpDown,
    bgColor: "bg-fuchsia-300",
    description: "Let users rank items in order of preference. Great for priorities or favorites.",
    textColor: "text-fuchsia-900",
    preview: {
      title: "Rank the following",
      fields: [
        { label: "Item 1", placeholder: "" },
        { label: "Item 2", placeholder: "" },
        { label: "Item 3", placeholder: "" },
      ],
    },
  },
  {
    id: "signature",
    name: "Signature",
    icon: PenTool,
    bgColor: "bg-slate-300",
    description: "Capture digital signatures. Perfect for agreements or consent forms.",
    textColor: "text-slate-900",
    preview: {
      title: "Please sign here",
      fields: [],
    },
  },
  {
    id: "file_upload",
    name: "File Upload",
    icon: Upload,
    bgColor: "bg-sky-300",
    description: "Allow users to upload files or documents. Supports multiple file types.",
    textColor: "text-sky-900",
    preview: {
      title: "Upload your files",
      fields: [],
    },
  },
  {
    id: "payment",
    name: "Payment",
    icon: CreditCard,
    bgColor: "bg-rose-300",
    description: "Collect payment information with Stripe integration. For orders or donations.",
    textColor: "text-rose-900",
    preview: {
      title: "Payment details",
      fields: [],
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    icon: Grid3x3,
    bgColor: "bg-cyan-300",
    description: "Grid of questions with same answer options. Efficient for related questions.",
    textColor: "text-cyan-900",
    preview: {
      title: "Matrix question",
      fields: [],
    },
  },
  {
    id: "nps",
    name: "NPS",
    icon: Target,
    bgColor: "bg-blue-200",
    description: "Net Promoter Score question. Measure customer loyalty with 0-10 scale.",
    textColor: "text-blue-900",
    preview: {
      title: "How likely are you to recommend us?",
      fields: [],
    },
  },
];

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (blockType: string) => void;
}

export function AddBlockModal({ isOpen, onClose, onSelectBlock }: AddBlockModalProps) {
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
    setSelectedBlock(null);
  };

  const handleUseBlock = () => {
    if (selectedBlock) {
      onSelectBlock(selectedBlock.id);
      onClose();
      setSelectedBlock(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Modal */}
      <div className="relative bg-white rounded shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a block</h2>

          {/* Search */}
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
          />
        </div>

        {/* Content - 2 Columns */}
        <div className="flex flex-1 min-h-0">
          {/* Left - Block List (40%) */}
          <div className="w-2/5 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-1.5">
              {filteredBlocks.map((block) => {
                const Icon = block.icon;
                const isSelected = selectedBlock?.id === block.id;
                return (
                  <button
                    key={block.id}
                    onClick={() => handleBlockClick(block)}
                    onDoubleClick={() => handleBlockDoubleClick(block)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-all text-left",
                      isSelected
                        ? "bg-indigo-50 border border-indigo-200"
                        : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                        block.bgColor
                      )}
                    >
                      <Icon className={cn("w-4 h-4", block.textColor)} />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-gray-900" : "text-gray-700"
                      )}
                    >
                      {block.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right - Preview (60%) */}
          <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
            {selectedBlock ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                {/* Description */}
                <div className="w-full max-w-md mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {selectedBlock.description}
                  </p>
                </div>

                {/* Preview Card */}
                <div className="w-full max-w-md bg-white rounded border border-gray-200 shadow-sm p-5 pointer-events-none select-none">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    {selectedBlock.preview.title}
                  </h3>

                  {/* CONTACT INFO */}
                  {selectedBlock.id === "contact_info" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 mb-2">Please fill the following</p>

                      {/* Row 1: First Name + Last Name */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                            First Name
                          </label>
                          <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                            John
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                            Last Name
                          </label>
                          <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                            Doe
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Email + Phone */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                            Email
                          </label>
                          <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                            john@example.com
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                            Phone Number
                          </label>
                          <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                            (201) 555-0123
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Company (full width) */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                          Company
                        </label>
                        <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                          Acme Inc
                        </div>
                      </div>

                      {/* Button */}
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        Next →
                      </div>
                    </div>
                  ) : selectedBlock.id === "short_text" ? (
                    /* SHORT TEXT */
                    <div className="space-y-3">
                      <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                        Type your answer here...
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "long_text" ? (
                    /* LONG TEXT */
                    <div className="space-y-3">
                      <div className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-400 min-h-[80px]">
                        Type your answer here...
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "phone_number" ? (
                    /* PHONE NUMBER */
                    <div className="space-y-3">
                      <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                        (___) ___-____
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "statement" ? (
                    /* STATEMENT - No input, just button */
                    <div className="space-y-3">
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        Continue →
                      </div>
                    </div>
                  ) : selectedBlock.id === "number" ? (
                    /* NUMBER */
                    <div className="space-y-3">
                      <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                        0
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "website_url" ? (
                    /* WEBSITE URL */
                    <div className="space-y-3">
                      <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                        https://example.com
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "address" ? (
                    /* ADDRESS */
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                          Street
                        </label>
                        <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                          123 Main St
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                          City
                        </label>
                        <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                          New York
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                          Zip Code
                        </label>
                        <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                          10001
                        </div>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "single_select" ? (
                    /* SINGLE SELECT */
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-left text-gray-700 hover:bg-gray-50">
                        A → Option 1
                      </button>
                      <button className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-left text-gray-700 hover:bg-gray-50">
                        B → Option 2
                      </button>
                      <button className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-left text-gray-700 hover:bg-gray-50">
                        C → Option 3
                      </button>
                    </div>
                  ) : selectedBlock.id === "multi_select" ? (
                    /* MULTI SELECT */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs text-gray-700">
                        <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                        <span>Option 1</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs text-gray-700">
                        <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                        <span>Option 2</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs text-gray-700">
                        <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                        <span>Option 3</span>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "dropdown" ? (
                    /* DROPDOWN */
                    <div className="space-y-3">
                      <div className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-400 flex items-center justify-between">
                        <span>Choose an option...</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "date" ? (
                    /* DATE */
                    <div className="space-y-3">
                      <div className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-400 flex items-center justify-between">
                        <span>DD/MM/YYYY</span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "star_rating" ? (
                    /* STAR RATING */
                    <div className="space-y-3">
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-6 h-6 text-gray-300 fill-gray-300" />
                        ))}
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center mx-auto">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "opinion_scale" ? (
                    /* OPINION SCALE (0-10) */
                    <div className="space-y-3">
                      <div className="flex justify-between gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Not likely</span>
                        <span>Very likely</span>
                      </div>
                    </div>
                  ) : selectedBlock.id === "nps" ? (
                    /* NPS (0-10) - Similar to opinion scale */
                    <div className="space-y-3">
                      <div className="flex justify-between gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Not at all likely</span>
                        <span>Extremely likely</span>
                      </div>
                    </div>
                  ) : selectedBlock.id === "ranking" ? (
                    /* RANKING */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs text-gray-700">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <span>1. Item 1</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs text-gray-700">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <span>2. Item 2</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs text-gray-700">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <span>3. Item 3</span>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "signature" ? (
                    /* SIGNATURE */
                    <div className="space-y-3">
                      <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                        Sign here
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs text-gray-600 hover:text-gray-800 underline">
                          Clear
                        </button>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "file_upload" ? (
                    /* FILE UPLOAD */
                    <div className="space-y-3">
                      <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-xs text-gray-400 gap-1">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span>Drop files here or click to browse</span>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : selectedBlock.id === "payment" ? (
                    /* PAYMENT */
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                          Card Number
                        </label>
                        <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                          •••• •••• •••• ••••
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                            Expiry
                          </label>
                          <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                            MM/YY
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                            CVC
                          </label>
                          <div className="w-full px-2 py-1.5 border-b border-gray-300 text-xs text-gray-400">
                            •••
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        Pay Now
                      </div>
                    </div>
                  ) : selectedBlock.id === "scheduler" ? (
                    /* SCHEDULER */
                    <div className="space-y-3">
                      <div className="grid grid-cols-7 gap-1">
                        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                          <div key={i} className="text-center text-xs font-medium text-gray-600">
                            {day}
                          </div>
                        ))}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
                          <button
                            key={num}
                            className="aspect-square flex items-center justify-center text-xs border border-gray-200 rounded hover:bg-gray-50"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700">Available times:</div>
                        <button className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                          10:00 AM
                        </button>
                        <button className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                          2:00 PM
                        </button>
                      </div>
                    </div>
                  ) : selectedBlock.id === "matrix" ? (
                    /* MATRIX */
                    <div className="space-y-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left py-1 pr-2"></th>
                              <th className="text-center px-2 py-1 text-gray-600">Yes</th>
                              <th className="text-center px-2 py-1 text-gray-600">No</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 pr-2 text-gray-700">Question 1</td>
                              <td className="text-center px-2">
                                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mx-auto"></div>
                              </td>
                              <td className="text-center px-2">
                                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mx-auto"></div>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 pr-2 text-gray-700">Question 2</td>
                              <td className="text-center px-2">
                                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mx-auto"></div>
                              </td>
                              <td className="text-center px-2">
                                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mx-auto"></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                        OK ✓
                      </div>
                    </div>
                  ) : (
                    /* DEFAULT FALLBACK */
                    <div className="mt-3 px-3 py-1.5 h-8 bg-indigo-600 text-white text-xs font-medium rounded inline-flex items-center">
                      Continue
                    </div>
                  )}
                </div>

                {/* Use this block button */}
                <button
                  onClick={handleUseBlock}
                  className="mt-4 px-5 py-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors shadow-sm"
                >
                  Use this block →
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <h3 className="text-base font-semibold text-gray-900 mb-2">No block selected</h3>
                <p className="text-sm text-gray-600 max-w-sm mb-1">
                  Select a block from the left to preview it.
                </p>
                <p className="text-xs text-gray-500">
                  Tip: Double-click a block to add it instantly
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
