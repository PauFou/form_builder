"use client";

import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@skemya/ui";
import { Badge } from "@skemya/ui";
import { Button } from "@skemya/ui";
import { GripVertical, Trash2, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Block } from "@skemya/contracts";
import { BLOCK_COMPONENTS } from "../blocks";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

interface EnhancedBlockItemProps {
  block: Block;
  index: number;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export function EnhancedBlockItem({
  block,
  index,
  onDelete,
  onSelect,
  isSelected,
  isDragging = false,
  isOverlay = false,
}: EnhancedBlockItemProps) {
  const { updateBlock } = useFormBuilderStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: "block",
      blockId: block.id,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isOverlay ? undefined : transition,
  };

  const actuallyDragging = isDragging || isSortableDragging;
  const BlockComponent = BLOCK_COMPONENTS[block.type];

  if (!BlockComponent) return null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={false}
      animate={{
        opacity: actuallyDragging && !isOverlay ? 0.2 : 1,
        scale: actuallyDragging && !isOverlay ? 0.98 : 1,
      }}
      whileHover={{ scale: isOverlay ? 1 : 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn("relative group my-2", actuallyDragging && !isOverlay && "z-50")}
      onClick={onSelect}
    >
      <Card
        className={cn(
          "p-6 transition-all duration-200 border-2",
          isSelected
            ? "border-primary shadow-xl ring-4 ring-primary/10 bg-primary/5"
            : "border-border hover:border-primary/50 hover:shadow-lg bg-background",
          actuallyDragging && !isOverlay && "opacity-50",
          isOverlay && "shadow-2xl rotate-2 scale-105 border-primary bg-background"
        )}
      >
        {/* Drag Handle */}
        <div className="flex items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "mt-1 p-2 rounded-lg transition-all cursor-grab active:cursor-grabbing",
              "opacity-0 group-hover:opacity-100",
              actuallyDragging && "opacity-100",
              "hover:bg-muted",
              isOverlay && "opacity-100 bg-primary/10"
            )}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{index + 1}</span>
                </div>
                <Badge variant="outline" className="text-xs uppercase">
                  {block.type.replace(/_/g, " ")}
                </Badge>
                {block.required && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>

              {/* Actions */}
              {!isOverlay && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              )}
            </div>

            {/* Question */}
            <input
              type="text"
              value={block.question || ""}
              onChange={(e) => updateBlock(block.id, { question: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="text-lg font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 w-full mb-4 placeholder:text-muted-foreground"
              placeholder="Enter your question..."
              disabled={isOverlay}
            />

            {/* Block Preview */}
            <div className={cn("opacity-60 pointer-events-none", isOverlay && "opacity-40")}>
              <BlockComponent block={block} />
            </div>

            {block.description && (
              <p className="text-sm text-muted-foreground mt-3">{block.description}</p>
            )}
          </div>
        </div>

        {/* Selection Indicator Animation */}
        {isSelected && !isOverlay && (
          <motion.div
            layoutId="selection-indicator"
            className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
            initial={false}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />
        )}

        {/* Dragging Indicator */}
        {actuallyDragging && !isOverlay && (
          <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none" />
        )}
      </Card>
    </motion.div>
  );
}
