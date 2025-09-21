"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@skemya/ui";
import { LucideIcon } from "lucide-react";

interface DraggableBlockProps {
  block: {
    id: string;
    type: string;
    icon: LucideIcon;
    label: string;
    category: string;
  };
}

export function DraggableBlock({ block }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${block.id}`,
    data: {
      source: "library",
      blockType: block.type,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = block.icon;

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg",
        "border border-border bg-card",
        "hover:border-primary/50 hover:bg-accent/50",
        "transition-all cursor-move",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isDragging && "ring-2 ring-primary"
      )}
      {...listeners}
      {...attributes}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-xs font-medium">{block.label}</span>
    </button>
  );
}
