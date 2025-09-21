"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, Button } from "@skemya/ui";
import { GripVertical, Trash2, Star } from "lucide-react";
import type { Block } from "@skemya/contracts";
import { BLOCK_COMPONENTS } from "../blocks";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

interface ModernBlockItemCleanProps {
  block: Block;
  index: number;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

export function ModernBlockItemClean({
  block,
  index,
  onDelete,
  onSelect,
  isSelected,
}: ModernBlockItemCleanProps) {
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
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
      }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`
          group relative p-6 transition-all
          ${
            isSelected
              ? "border-primary shadow-lg"
              : "border-border hover:border-primary/50 hover:shadow-md"
          }
          ${isDragging ? "cursor-grabbing" : "hover:-translate-y-0.5"}
        `}
        onClick={onSelect}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              updateBlock(block.id, { required: !block.required });
            }}
          >
            {block.required ? (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Question Number */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {block.type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Content */}
        <div className="pl-12">
          <input
            type="text"
            value={block.question || ""}
            onChange={(e) => updateBlock(block.id, { question: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="text-lg font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 w-full mb-4 placeholder:text-muted-foreground"
            placeholder="Enter your question..."
          />

          {/* Block Preview */}
          <div className="opacity-60 pointer-events-none">
            <BlockComponent block={block} />
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            layoutId="selection-indicator-clean"
            className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </Card>
    </motion.div>
  );
}
