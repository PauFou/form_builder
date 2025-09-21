"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Input } from "@skemya/ui";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  Square,
  Circle,
  Star,
  UploadCloud,
  PenTool,
  CreditCard,
  Globe,
  List,
  ToggleLeft,
  Sliders,
  Grid3X3,
  Search,
} from "lucide-react";

interface BlockDefinition {
  icon: any;
  type: string;
  label: string;
  description: string;
  category: string;
}

const BLOCK_TYPES: BlockDefinition[] = [
  // Basic Inputs
  {
    icon: Type,
    type: "short_text",
    label: "Short Text",
    description: "Single line text",
    category: "basic",
  },
  {
    icon: AlignLeft,
    type: "long_text",
    label: "Long Text",
    description: "Multi-line text",
    category: "basic",
  },
  {
    icon: Mail,
    type: "email",
    label: "Email",
    description: "Email address",
    category: "contact",
  },
  {
    icon: Phone,
    type: "phone",
    label: "Phone",
    description: "Phone number",
    category: "contact",
  },
  {
    icon: Hash,
    type: "number",
    label: "Number",
    description: "Numeric input",
    category: "basic",
  },

  // Date & Time
  {
    icon: Calendar,
    type: "date",
    label: "Date",
    description: "Date picker",
    category: "datetime",
  },
  {
    icon: Clock,
    type: "time",
    label: "Time",
    description: "Time picker",
    category: "datetime",
  },

  // Choices
  {
    icon: ChevronDown,
    type: "select",
    label: "Dropdown",
    description: "Single select",
    category: "choice",
  },
  {
    icon: Circle,
    type: "radio_group",
    label: "Radio Group",
    description: "Single choice",
    category: "choice",
  },
  {
    icon: Square,
    type: "checkbox_group",
    label: "Checkbox Group",
    description: "Multiple choice",
    category: "choice",
  },
  {
    icon: ToggleLeft,
    type: "boolean",
    label: "Yes/No",
    description: "Toggle switch",
    category: "choice",
  },

  // Advanced
  {
    icon: Star,
    type: "rating",
    label: "Rating",
    description: "Star rating",
    category: "advanced",
  },
  {
    icon: Sliders,
    type: "scale",
    label: "Scale",
    description: "Numeric scale",
    category: "advanced",
  },
  {
    icon: List,
    type: "ranking",
    label: "Ranking",
    description: "Rank items",
    category: "advanced",
  },
  {
    icon: Grid3X3,
    type: "matrix",
    label: "Matrix",
    description: "Grid choices",
    category: "advanced",
  },

  // Special
  {
    icon: UploadCloud,
    type: "file_upload",
    label: "File Upload",
    description: "Upload files",
    category: "special",
  },
  {
    icon: PenTool,
    type: "signature",
    label: "Signature",
    description: "Draw signature",
    category: "special",
  },
  {
    icon: CreditCard,
    type: "payment",
    label: "Payment",
    description: "Collect payment",
    category: "special",
  },
  {
    icon: MapPin,
    type: "address",
    label: "Address",
    description: "Full address",
    category: "contact",
  },
  {
    icon: Globe,
    type: "website",
    label: "Website",
    description: "URL input",
    category: "contact",
  },
];

const CATEGORIES = [
  { id: "basic", label: "Basic" },
  { id: "contact", label: "Contact" },
  { id: "choice", label: "Choice" },
  { id: "datetime", label: "Date & Time" },
  { id: "advanced", label: "Advanced" },
  { id: "special", label: "Special" },
];

function DraggableBlockClean({ block }: { block: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${block.type}`,
    data: { source: "library", blockType: block.type },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        p-4 rounded-lg border cursor-grab transition-all
        bg-card hover:border-primary/50 hover:shadow-md
        ${isDragging ? "opacity-50 cursor-grabbing" : ""}
      `}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
          <block.icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{block.label}</p>
          <p className="text-xs text-muted-foreground">{block.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function DraggableBlockLibraryClean() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlocks = BLOCK_TYPES.filter(
    (block) =>
      block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const blocksByCategory = CATEGORIES.map((category) => ({
    ...category,
    blocks: filteredBlocks.filter((block) => block.category === category.id),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search blocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {blocksByCategory.map((category) => {
          if (category.blocks.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {category.label}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {category.blocks.map((block) => (
                  <DraggableBlockClean key={block.type} block={block} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBlocks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No blocks found</p>
        </div>
      )}
    </div>
  );
}
