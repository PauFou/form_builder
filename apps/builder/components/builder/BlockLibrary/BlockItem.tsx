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
  // Use useMemo to create a stable draggable ID across re-renders
  // Without this, React re-renders during drag will generate a new ID, breaking @dnd-kit tracking
  const draggableId = React.useMemo(() => `new-${block.type}-${Date.now()}`, [block.type]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: {
      type: "new-block",
      blockType: block.type,
      label: block.label,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-xl border-2 bg-card cursor-move transition-all duration-200",
        "border-border/50 hover:border-primary hover:shadow-md hover:bg-accent/5",
        isDragging && "opacity-40 scale-95 shadow-lg"
      )}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      {...attributes}
      {...listeners}
    >
      {/* Grip handle - only visible on hover */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/60" />
      </div>

      {/* Icon container with improved styling */}
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-200">
        <block.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
      </div>

      {/* Text content with improved hierarchy */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-200">{block.label}</p>
        <p className="text-xs text-muted-foreground/80 truncate">{block.description}</p>
      </div>
    </motion.div>
  );
}
