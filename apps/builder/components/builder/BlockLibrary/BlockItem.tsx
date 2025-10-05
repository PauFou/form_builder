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
        "relative flex items-center gap-3 p-3 rounded-lg border bg-card cursor-move transition-all duration-200",
        "hover:border-primary/50 hover:shadow-sm",
        isDragging && "opacity-40 scale-95"
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
  );
}
