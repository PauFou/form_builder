"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, Button, cn, Badge } from "@skemya/ui";
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Star,
  Settings,
  Type,
  AlignLeft,
  Mail,
  Calendar,
  ChevronRight,
  Square,
  CheckSquare,
  Circle,
  List,
} from "lucide-react";
import type { Block } from "@skemya/contracts";
import { BLOCK_COMPONENTS } from "../blocks";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

interface ModernBlockItemV2Props {
  block: Block;
  index: number;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const blockIcons: Record<string, any> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  date: Calendar,
  select: ChevronRight,
  checkbox_group: CheckSquare,
  radio_group: Circle,
  number: List,
};

export function ModernBlockItemV2({
  block,
  index,
  onDelete,
  onSelect,
  isSelected,
}: ModernBlockItemV2Props) {
  const { updateBlock } = useFormBuilderStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: "block", blockId: block.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const BlockIcon = blockIcons[block.type] || Type;
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
        scale: isDragging ? 0.95 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden rounded-2xl border transition-all duration-200",
          isSelected
            ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg",
          isDragging && "cursor-grabbing",
          !isDragging && "hover:-translate-y-0.5"
        )}
        onClick={onSelect}
      >
        {/* Gradient Overlay for Selected State */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        )}

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-muted/80 to-transparent backdrop-blur-sm z-10"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-xl bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background hover:border-primary/50 transition-all"
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
            variant="outline"
            className="h-8 w-8 rounded-xl bg-background/80 backdrop-blur-sm border-border/50 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Question Number Badge */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/90 to-accent/90 flex items-center justify-center shadow-md">
                <span className="text-sm font-bold text-primary-foreground">{index + 1}</span>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full bg-background/80 backdrop-blur-sm">
              <BlockIcon className="h-3 w-3 mr-1" />
              {block.type.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pl-16 pt-20">
          {/* Question Text */}
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={block.question || ""}
              onChange={(e) => updateBlock(block.id, { question: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded-lg px-3 -ml-3 w-full placeholder:text-muted-foreground/60"
              placeholder="Enter your question..."
            />
            {block.description && (
              <input
                type="text"
                value={block.description}
                onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-muted-foreground bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded-lg px-3 -ml-3 w-full placeholder:text-muted-foreground/60"
                placeholder="Add a description..."
              />
            )}
          </div>

          {/* Block Preview with Glass Effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 blur-xl" />
            <div className="relative p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/50">
              <div className="opacity-70 pointer-events-none">
                <BlockComponent block={block} />
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            {block.required && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Required
              </div>
            )}
            {block.helpText && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Has help text
              </div>
            )}
            {block.validation && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Has validation
              </div>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            layoutId="selection-indicator-v2"
            className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </Card>
    </motion.div>
  );
}
