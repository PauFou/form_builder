"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Settings,
  Copy,
  Trash2,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  Upload,
  PenTool,
  MapPin,
  CreditCard,
  List,
  CheckSquare,
  ToggleLeft,
  Star,
  ChevronDown,
  Minus,
  FileText,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@skemya/ui";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import type { Block } from "@skemya/contracts";

interface BlockRendererProps {
  block: Block;
  pageId?: string;
  isDragging?: boolean;
  index?: number;
}

const blockIcons: Record<string, React.ComponentType<any>> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  phone: Phone,
  number: Hash,
  date: Calendar,
  time: Clock,
  file_upload: Upload,
  signature: PenTool,
  address: MapPin,
  payment: CreditCard,
  single_select: List,
  multi_select: CheckSquare,
  dropdown: ChevronDown,
  yes_no: ToggleLeft,
  rating: Star,
  section: Minus,
  page_break: FileText,
  description: FileText,
};

export function BlockRenderer({ block, pageId, isDragging, index }: BlockRendererProps) {
  const { selectBlock, selectedBlockId, duplicateBlock, deleteBlock } = useFormBuilderStore();

  const isGhost = (block as any).__isGhost;

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
      block,
      pageId,
      index,
    },
    disabled: isGhost, // Disable sortable for ghost blocks
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = blockIcons[block.type] || Type;
  const isSelected = selectedBlockId === block.id;
  const showDragging = isDragging || isSortableDragging || isGhost;

  const handleSelect = () => {
    if (!isGhost) {
      selectBlock(block.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    if (!isGhost) {
      e.stopPropagation();
      duplicateBlock(block.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (!isGhost) {
      e.stopPropagation();
      deleteBlock(block.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      data-block-id={block.id}
      className={cn(
        "group relative bg-card border rounded-lg p-4 cursor-pointer transition-all duration-200",
        isSelected && "ring-2 ring-primary border-primary",
        showDragging && "opacity-40 scale-95",
        !showDragging && "hover:border-primary/50 hover:shadow-sm",
        isGhost && "pointer-events-none"
      )}
    >
      {/* Drag Handle */}
      {!isGhost && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="pl-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {block.question ||
                  `${block.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}`}
              </h3>
              {block.required && <span className="text-xs text-destructive">*</span>}
            </div>

            {block.description && (
              <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
            )}

            {/* Preview based on block type */}
            <div className="mt-3">{renderBlockPreview(block)}</div>
          </div>

          {/* Actions */}
          {!isGhost && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleSelect} className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDuplicate} className="h-8 w-8 p-0">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderBlockPreview(block: Block) {
  switch (block.type) {
    case "short_text":
    case "email":
    case "phone":
    case "number":
      return <div className="w-full max-w-md h-9 rounded-md border bg-background/50" />;

    case "long_text":
      return <div className="w-full max-w-md h-20 rounded-md border bg-background/50" />;

    case "single_select":
    case "multi_select":
      return (
        <div className="space-y-2">
          {(block.settings?.options || ["Option 1", "Option 2", "Option 3"])
            .slice(0, 3)
            .map((option: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-4 h-4 border-2 bg-background/50",
                    block.type === "single_select" ? "rounded-full" : "rounded"
                  )}
                />
                <span className="text-sm text-muted-foreground">{option}</span>
              </div>
            ))}
        </div>
      );

    case "dropdown":
      return (
        <div className="w-full max-w-md h-9 rounded-md border bg-background/50 flex items-center px-3 justify-between">
          <span className="text-sm text-muted-foreground">Select...</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      );

    case "yes_no":
      return (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-4 h-4 rounded-full border-2 bg-background/50" />
            <span className="text-sm text-muted-foreground">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-4 h-4 rounded-full border-2 bg-background/50" />
            <span className="text-sm text-muted-foreground">No</span>
          </label>
        </div>
      );

    case "rating":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-5 w-5 text-muted-foreground/50" />
          ))}
        </div>
      );

    case "date":
      return (
        <div className="w-full max-w-md h-9 rounded-md border bg-background/50 flex items-center px-3 gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Select date...</span>
        </div>
      );

    case "file_upload":
      return (
        <div className="w-full max-w-md p-4 rounded-md border-2 border-dashed bg-background/50 text-center">
          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Drop files or click to upload</p>
        </div>
      );

    case "section":
      return <div className="w-full h-px bg-border" />;

    case "description":
      return (
        <div className="text-sm text-muted-foreground">
          {block.settings?.content || "This is a description block"}
        </div>
      );

    default:
      return null;
  }
}
