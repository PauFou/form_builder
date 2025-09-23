"use client";

import React from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "../../../lib/utils";
// BlockType is a string type for block types

interface BlockDefinition {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface BlockItemProps {
  block: BlockDefinition;
}

export function BlockItem({ block }: BlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-${block.type}-${Date.now()}`,
    data: {
      type: "new-block",
      blockType: block.type,
      label: block.label,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-lg border bg-card cursor-move transition-all",
          "hover:border-primary/50 hover:shadow-sm",
          isDragging && "opacity-50"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...attributes}
        {...listeners}
      >
        <div className="flex-shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <block.icon className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{block.label}</p>
          <p className="text-xs text-muted-foreground truncate">{block.description}</p>
        </div>
      </motion.div>

      {/* Ghost Preview for Dragging */}
      {isDragging && (
        <div className="fixed pointer-events-none z-50" style={style}>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card shadow-lg opacity-90">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <block.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{block.label}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
