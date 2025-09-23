"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  Upload,
  PenTool,
  MapPin,
  CreditCard,
  List,
  CheckSquare,
  ToggleLeft,
  Sliders,
  Star,
  Minus,
  FileText,
  LayoutGrid,
  Search,
} from "lucide-react";
import { Input } from "@skemya/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@skemya/ui";
import { BlockItem } from "./BlockItem";
// BlockType is a string type for block types

interface BlockDefinition {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const blockCategories = [
  {
    id: "basic",
    label: "Basic Fields",
    blocks: [
      {
        type: "short_text",
        label: "Short Text",
        icon: Type,
        description: "Single line text input",
      },
      {
        type: "long_text",
        label: "Long Text",
        icon: AlignLeft,
        description: "Multi-line text area",
      },
      { type: "email", label: "Email", icon: Mail, description: "Email address input" },
      { type: "phone", label: "Phone", icon: Phone, description: "Phone number input" },
      { type: "number", label: "Number", icon: Hash, description: "Numeric input" },
    ],
  },
  {
    id: "choice",
    label: "Choice Fields",
    blocks: [
      {
        type: "single_select",
        label: "Single Select",
        icon: List,
        description: "Choose one option",
      },
      {
        type: "multi_select",
        label: "Multi Select",
        icon: CheckSquare,
        description: "Choose multiple options",
      },
      { type: "dropdown", label: "Dropdown", icon: ChevronDown, description: "Dropdown selection" },
      { type: "yes_no", label: "Yes/No", icon: ToggleLeft, description: "Boolean choice" },
      { type: "rating", label: "Rating", icon: Star, description: "Star rating" },
    ],
  },
  {
    id: "advanced",
    label: "Advanced Fields",
    blocks: [
      { type: "date", label: "Date", icon: Calendar, description: "Date picker" },
      { type: "time", label: "Time", icon: Clock, description: "Time picker" },
      { type: "file_upload", label: "File Upload", icon: Upload, description: "Upload files" },
      { type: "signature", label: "Signature", icon: PenTool, description: "Digital signature" },
      { type: "address", label: "Address", icon: MapPin, description: "Address input" },
      { type: "payment", label: "Payment", icon: CreditCard, description: "Stripe payment" },
    ],
  },
  {
    id: "layout",
    label: "Layout Elements",
    blocks: [
      { type: "section", label: "Section", icon: Minus, description: "Section divider" },
      { type: "page_break", label: "Page Break", icon: LayoutGrid, description: "Create new page" },
      { type: "description", label: "Description", icon: FileText, description: "Static text" },
    ],
  },
];

export function BlockLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["basic", "choice"]);

  // Filter blocks based on search
  const filteredCategories = blockCategories
    .map((category) => {
      const filteredBlocks = category.blocks.filter(
        (block) =>
          block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          block.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...category,
        blocks: filteredBlocks,
      };
    })
    .filter((category) => category.blocks.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Block Categories */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          // Search Results
          <div className="p-4 space-y-2">
            {filteredCategories.map((category) =>
              category.blocks.map((block) => <BlockItem key={block.type} block={block} />)
            )}
            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No fields found</p>
              </div>
            )}
          </div>
        ) : (
          // Categorized View
          <Accordion
            type="multiple"
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            className="w-full"
          >
            {blockCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id} className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="font-medium">{category.label}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {category.blocks.map((block) => (
                      <BlockItem key={block.type} block={block} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Drag fields to add them to your form
        </p>
      </div>
    </div>
  );
}

// Fix for ChevronDown import
import { ChevronDown } from "lucide-react";
