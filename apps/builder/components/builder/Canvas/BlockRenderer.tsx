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
  showDropIndicator?: boolean;
  dropAbove?: boolean;
}

const blockIcons: Record<string, React.ComponentType<any>> = {
  contact_info: Mail,
  short_text: Type,
  long_text: AlignLeft,
  phone_number: Phone,
  statement: FileText,
  number: Hash,
  website_url: Type,
  single_select: List,
  multi_select: CheckSquare,
  dropdown: ChevronDown,
  date: Calendar,
  address: MapPin,
  scheduler: Clock,
  star_rating: Star,
  opinion_scale: Star,
  ranking: List,
  signature: PenTool,
  file_upload: Upload,
  payment: CreditCard,
  matrix: CheckSquare,
  nps: Star,
  // Legacy/old types
  email: Mail,
  phone: Phone,
  time: Clock,
  yes_no: ToggleLeft,
  rating: Star,
  section: Minus,
  page_break: FileText,
  description: FileText,
};

export function BlockRenderer({
  block,
  pageId,
  isDragging,
  index,
  showDropIndicator,
  dropAbove,
}: BlockRendererProps) {
  const { selectBlock, selectedBlockId, duplicateBlock, deleteBlock, updateBlock } =
    useFormBuilderStore();

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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = blockIcons[block.type] || Type;
  const isSelected = selectedBlockId === block.id;
  const showDragging = isDragging || isSortableDragging;

  const handleSelect = () => {
    selectBlock(block.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateBlock(block.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
  };

  const [editingField, setEditingField] = React.useState<
    "question" | "description" | "placeholder" | null
  >(null);
  const [editValue, setEditValue] = React.useState("");

  const handleEditStart = (
    field: "question" | "description" | "placeholder",
    e: React.MouseEvent
  ) => {
    if (!isSelected) return;
    e.stopPropagation();
    setEditingField(field);
    if (field === "question") {
      setEditValue(block.question || "");
    } else if (field === "description") {
      setEditValue(block.description || "");
    } else if (field === "placeholder") {
      setEditValue(block.settings?.placeholder || "");
    }
  };

  const handleEditSave = () => {
    if (editingField) {
      let updates: any = {};
      if (editingField === "question") {
        updates = { question: editValue };
      } else if (editingField === "description") {
        updates = { description: editValue };
      } else if (editingField === "placeholder") {
        updates = { settings: { ...block.settings, placeholder: editValue } };
      }
      updateBlock(block.id, updates);
      setEditingField(null);
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  return (
    <div className="relative">
      {/* Drop indicator */}
      {showDropIndicator && (
        <div
          className={cn(
            "absolute left-0 right-0 h-0.5 bg-primary z-20",
            dropAbove ? "-top-2" : "-bottom-2"
          )}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
        </div>
      )}

      <div
        ref={setNodeRef}
        style={style}
        onClick={handleSelect}
        data-block-id={block.id}
        className={cn(
          "group relative bg-card border rounded-lg p-4 cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-primary border-primary",
          showDragging && "opacity-40 scale-95",
          !showDragging && "hover:border-primary/50 hover:shadow-sm"
        )}
      >
        {/* Drag Handle */}
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="pl-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {editingField === "question" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleEditSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="font-medium bg-background border border-primary rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3
                    className={cn(
                      "font-medium",
                      isSelected &&
                        "cursor-text hover:bg-muted/50 px-2 py-0.5 rounded transition-colors"
                    )}
                    onClick={(e) => handleEditStart("question", e)}
                    title={isSelected ? "Click to edit" : ""}
                  >
                    {block.question ||
                      `${block.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}`}
                  </h3>
                )}
                {block.required && <span className="text-xs text-destructive">*</span>}
              </div>

              {editingField === "description" ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditSave}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  rows={2}
                  className="w-full text-sm text-muted-foreground mt-1 bg-background border border-primary rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : block.description || (isSelected && !block.description) ? (
                <p
                  className={cn(
                    "text-sm text-muted-foreground mt-1",
                    isSelected &&
                      "cursor-text hover:bg-muted/50 px-2 py-1 rounded transition-colors min-h-[1.5rem]"
                  )}
                  onClick={(e) => handleEditStart("description", e)}
                  title={isSelected ? "Click to edit description" : ""}
                >
                  {block.description || (isSelected ? "Add description..." : "")}
                </p>
              ) : null}

              {/* Preview based on block type */}
              <div className="mt-3">
                {renderBlockPreview(
                  block,
                  isSelected,
                  editingField,
                  editValue,
                  setEditValue,
                  handleEditStart,
                  handleEditSave,
                  handleKeyDown
                )}
              </div>
            </div>

            {/* Actions */}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBlockPreview(
  block: Block,
  isSelected: boolean = false,
  editingField: "question" | "description" | "placeholder" | null = null,
  editValue: string = "",
  setEditValue: (value: string) => void = () => {},
  handleEditStart: (
    field: "question" | "description" | "placeholder",
    e: React.MouseEvent
  ) => void = () => {},
  handleEditSave: () => void = () => {},
  handleKeyDown: (e: React.KeyboardEvent) => void = () => {}
) {
  switch (block.type) {
    case "contact_info":
      return (
        <div className="space-y-3 w-full max-w-md">
          {/* Row 1: First Name + Last Name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">First Name</label>
              <div className="w-full h-9 rounded-md border bg-background/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Last Name</label>
              <div className="w-full h-9 rounded-md border bg-background/50" />
            </div>
          </div>

          {/* Row 2: Email + Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <div className="w-full h-9 rounded-md border bg-background/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone Number</label>
              <div className="w-full h-9 rounded-md border bg-background/50" />
            </div>
          </div>

          {/* Row 3: Company (full width) */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Company</label>
            <div className="w-full h-9 rounded-md border bg-background/50" />
          </div>
        </div>
      );

    case "statement":
      return (
        <div className="p-4 rounded-md bg-muted/30 border-l-2 border-primary">
          <p className="text-sm text-muted-foreground italic">
            Statement block - No input required
          </p>
        </div>
      );

    case "short_text":
    case "email":
    case "phone_number":
    case "website_url":
    case "number":
      return (
        <div className="w-full max-w-md h-9 rounded-md border bg-background/50 flex items-center px-3">
          {editingField === "placeholder" ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full text-sm bg-transparent focus:outline-none text-foreground"
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter placeholder text..."
            />
          ) : (
            <span
              className={cn(
                "text-sm text-muted-foreground/60 w-full",
                isSelected && "cursor-text hover:text-muted-foreground transition-colors"
              )}
              onClick={(e) => handleEditStart("placeholder", e)}
              title={isSelected ? "Click to edit placeholder" : ""}
            >
              {block.settings?.placeholder || (isSelected ? "Add placeholder..." : "")}
            </span>
          )}
        </div>
      );

    case "long_text":
      return (
        <div className="w-full max-w-md h-20 rounded-md border bg-background/50 flex items-start p-3">
          {editingField === "placeholder" ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={2}
              className="w-full text-sm bg-transparent focus:outline-none resize-none text-foreground"
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter placeholder text..."
            />
          ) : (
            <span
              className={cn(
                "text-sm text-muted-foreground/60 w-full",
                isSelected && "cursor-text hover:text-muted-foreground transition-colors"
              )}
              onClick={(e) => handleEditStart("placeholder", e)}
              title={isSelected ? "Click to edit placeholder" : ""}
            >
              {block.settings?.placeholder || (isSelected ? "Add placeholder..." : "")}
            </span>
          )}
        </div>
      );

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

    case "address":
      return (
        <div className="space-y-3">
          {["Street", "City", "Zip Code"].map((label, idx) => (
            <div key={idx} className="space-y-1">
              <label className="text-xs text-muted-foreground">{label}</label>
              <div className="w-full max-w-md h-9 rounded-md border bg-background/50" />
            </div>
          ))}
        </div>
      );

    case "scheduler":
      return (
        <div className="w-full max-w-md p-4 rounded-md border bg-background/50 text-center">
          <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Schedule a time slot</p>
        </div>
      );

    case "star_rating":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-6 w-6 text-muted-foreground/50" />
          ))}
        </div>
      );

    case "opinion_scale":
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">0</span>
          <div className="flex gap-1">
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded border bg-background/50 flex items-center justify-center text-xs text-muted-foreground"
              >
                {i}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">10</span>
        </div>
      );

    case "nps":
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Not likely</span>
          <div className="flex gap-1">
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded border bg-background/50 flex items-center justify-center text-xs text-muted-foreground"
              >
                {i}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Very likely</span>
        </div>
      );

    case "ranking":
      return (
        <div className="space-y-2">
          {["Item 1", "Item 2", "Item 3"].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-background/50">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      );

    case "signature":
      return (
        <div className="w-full max-w-md h-32 rounded-md border-2 border-dashed bg-background/50 flex items-center justify-center">
          <div className="text-center">
            <PenTool className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sign here</p>
          </div>
        </div>
      );

    case "file_upload":
      return (
        <div className="w-full max-w-md p-4 rounded-md border-2 border-dashed bg-background/50 text-center">
          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Drop files or click to upload</p>
        </div>
      );

    case "payment":
      return (
        <div className="w-full max-w-md p-4 rounded-md border bg-background/50">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Payment Information</span>
          </div>
          <div className="space-y-2">
            <div className="h-9 rounded border bg-background/50" />
            <div className="flex gap-2">
              <div className="flex-1 h-9 rounded border bg-background/50" />
              <div className="w-20 h-9 rounded border bg-background/50" />
            </div>
          </div>
        </div>
      );

    case "matrix":
      return (
        <div className="w-full max-w-md">
          <div className="grid grid-cols-4 gap-2">
            <div></div>
            {["Option 1", "Option 2", "Option 3"].map((opt, idx) => (
              <div key={idx} className="text-xs text-muted-foreground text-center">
                {opt}
              </div>
            ))}
            {["Row 1", "Row 2"].map((row, rowIdx) => (
              <React.Fragment key={rowIdx}>
                <div className="text-xs text-muted-foreground">{row}</div>
                {[0, 1, 2].map((colIdx) => (
                  <div key={colIdx} className="h-8 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 bg-background/50" />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
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
