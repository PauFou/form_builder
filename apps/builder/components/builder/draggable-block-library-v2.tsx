"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { cn, Input, Badge } from "@skemya/ui";
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
  MessageSquare,
  Image,
  FileText,
  Link,
  Code,
  Search,
  Sparkles,
} from "lucide-react";

interface BlockDefinition {
  icon: any;
  type: string;
  label: string;
  description: string;
  category: string;
  isPremium?: boolean;
  isNew?: boolean;
}

const BLOCK_TYPES: BlockDefinition[] = [
  // Basic Inputs
  {
    icon: Type,
    type: "short_text",
    label: "Short Text",
    description: "Single line text input",
    category: "basic",
  },
  {
    icon: AlignLeft,
    type: "long_text",
    label: "Long Text",
    description: "Multi-line text area",
    category: "basic",
  },
  {
    icon: Mail,
    type: "email",
    label: "Email",
    description: "Email address input",
    category: "contact",
  },
  {
    icon: Phone,
    type: "phone",
    label: "Phone",
    description: "Phone number input",
    category: "contact",
  },
  {
    icon: Hash,
    type: "number",
    label: "Number",
    description: "Numeric input",
    category: "basic",
  },
  {
    icon: DollarSign,
    type: "currency",
    label: "Currency",
    description: "Money amount input",
    category: "basic",
    isPremium: true,
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
  {
    icon: Calendar,
    type: "datetime",
    label: "Date & Time",
    description: "Combined date and time",
    category: "datetime",
    isNew: true,
  },

  // Choices
  {
    icon: ChevronDown,
    type: "select",
    label: "Dropdown",
    description: "Single select dropdown",
    category: "choice",
  },
  {
    icon: Circle,
    type: "radio_group",
    label: "Radio Group",
    description: "Single choice selection",
    category: "choice",
  },
  {
    icon: Square,
    type: "checkbox_group",
    label: "Checkbox Group",
    description: "Multiple choice selection",
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
    description: "Star rating input",
    category: "advanced",
  },
  {
    icon: Sliders,
    type: "scale",
    label: "Scale",
    description: "Numeric scale slider",
    category: "advanced",
  },
  {
    icon: List,
    type: "ranking",
    label: "Ranking",
    description: "Drag to rank items",
    category: "advanced",
    isPremium: true,
  },
  {
    icon: Grid3X3,
    type: "matrix",
    label: "Matrix",
    description: "Grid of choices",
    category: "advanced",
    isPremium: true,
  },

  // Special
  {
    icon: UploadCloud,
    type: "file_upload",
    label: "File Upload",
    description: "Upload documents or images",
    category: "special",
    isPremium: true,
  },
  {
    icon: PenTool,
    type: "signature",
    label: "Signature",
    description: "Draw signature pad",
    category: "special",
    isPremium: true,
  },
  {
    icon: CreditCard,
    type: "payment",
    label: "Payment",
    description: "Collect payments",
    category: "special",
    isPremium: true,
    isNew: true,
  },
  {
    icon: MapPin,
    type: "address",
    label: "Address",
    description: "Full address input",
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
  { id: "basic", label: "Basic", color: "from-blue-500 to-cyan-500" },
  { id: "contact", label: "Contact", color: "from-purple-500 to-pink-500" },
  { id: "choice", label: "Choice", color: "from-green-500 to-emerald-500" },
  { id: "datetime", label: "Date & Time", color: "from-orange-500 to-amber-500" },
  { id: "advanced", label: "Advanced", color: "from-indigo-500 to-purple-500" },
  { id: "special", label: "Special", color: "from-pink-500 to-rose-500" },
];

function DraggableBlockV2({ block }: { block: BlockDefinition }) {
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 0.95 : 1,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative p-4 rounded-2xl border cursor-grab transition-all duration-200",
        "bg-card/50 backdrop-blur-sm border-border/50",
        "hover:bg-card hover:border-primary/30 hover:shadow-lg",
        isDragging && "cursor-grabbing z-50"
      )}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-lg" />
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-border/50">
            <block.icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <p className="font-medium text-sm">{block.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{block.description}</p>
        </div>
        {(block.isPremium || block.isNew) && (
          <div className="flex gap-1">
            {block.isPremium && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                PRO
              </Badge>
            )}
            {block.isNew && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-700 dark:text-green-400"
              >
                NEW
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function DraggableBlockLibraryV2() {
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
          className="pl-10 rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary/50 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {blocksByCategory.map((category, categoryIndex) => {
          if (category.blocks.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-1 w-8 rounded-full bg-gradient-to-r", category.color)} />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {category.blocks.map((block, index) => (
                  <motion.div
                    key={block.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                  >
                    <DraggableBlockV2 block={block} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBlocks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 blur-2xl bg-muted" />
            <div className="relative w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">No blocks found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
        </motion.div>
      )}
    </div>
  );
}
