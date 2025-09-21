"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, Button, cn } from "@skemya/ui";
import { GripVertical, Trash2, Copy, MoreVertical, ChevronUp, ChevronDown } from "lucide-react";
import type { Block } from "@skemya/contracts";
import { BLOCK_COMPONENTS } from "../blocks";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

interface ModernBlockItemProps {
  block: Block;
  index: number;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

export function ModernBlockItem({
  block,
  index,
  onDelete,
  onSelect,
  isSelected,
}: ModernBlockItemProps) {
  const { updateBlock } = useFormBuilderStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: "block", blockId: block.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const BlockComponent = BLOCK_COMPONENTS[block.type];
  if (!BlockComponent) return null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all cursor-pointer",
          isSelected && "ring-2 ring-primary shadow-lg",
          isDragging && "opacity-50 cursor-grabbing",
          !isDragging && "hover:shadow-md"
        )}
        onClick={onSelect}
      >
        {/* Drag Handle - Left Side */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-muted to-transparent z-10"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Delete Button - Top Right */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>

        {/* Question Number */}
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{index + 1}</span>
        </div>

        {/* Content */}
        <div className="p-6 pl-14">
          {/* Question Type Label */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {block.type.replace(/_/g, " ")}
            </span>
            {block.required && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                Required
              </span>
            )}
          </div>

          {/* Question Text */}
          <input
            type="text"
            value={block.question || ""}
            onChange={(e) => updateBlock(block.id, { question: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="text-lg font-medium bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary rounded px-2 -ml-2 mb-2"
            placeholder="Enter your question..."
          />

          {/* Description */}
          {block.description !== undefined && (
            <input
              type="text"
              value={block.description || ""}
              onChange={(e) => updateBlock(block.id, { description: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-muted-foreground bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary rounded px-2 -ml-2 mb-4"
              placeholder="Add description (optional)..."
            />
          )}

          {/* Block Preview */}
          <div className="pointer-events-none opacity-60 max-w-md">
            <BlockComponent block={block} />
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            layoutId="selection-indicator"
            className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
          />
        )}
      </Card>
    </motion.div>
  );
}
