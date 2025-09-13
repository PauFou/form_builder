"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@forms/ui";
import { GripVertical, MoreVertical, Copy, Trash2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { BLOCK_COMPONENTS } from "../blocks";
import type { Block } from "@forms/contracts";
import { contractToBuilderBlock } from "../../lib/block-utils";
import { DeleteFieldDialog } from "./delete-field-dialog";

interface BlockItemProps {
  block: Block;
  pageId: string;
  index: number;
}

export function BlockItem({ block, pageId, index }: BlockItemProps) {
  const { 
    selectBlock, 
    updateBlock, 
    deleteBlock, 
    deleteBlockWithReferences,
    duplicateBlock, 
    selectedBlockId,
    checkFieldReferences 
  } = useFormBuilderStore();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: {
      type: "block",
      blockId: block.id,
      pageId,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedBlockId === block.id;
  const BlockComponent = BLOCK_COMPONENTS[block.type];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.005 }}
      className={`relative ${isDragging ? "z-50" : ""}`}
    >
      <Card
        className={`relative overflow-hidden cursor-pointer transition-all duration-200 ${
          isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
        }`}
        onClick={() => selectBlock(block.id)}
      >
        <div className="flex">
          {/* Drag handle */}
          <button
            className="px-3 py-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Block content */}
          <div className="flex-1">
            {BlockComponent ? (
              <BlockComponent
                block={contractToBuilderBlock(block)}
                isSelected={isSelected}
                onUpdate={(updates) => updateBlock(block.id, updates)}
              />
            ) : (
              <div className="p-6 text-muted-foreground">Unknown block type: {block.type}</div>
            )}
          </div>

          {/* Actions menu */}
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => selectBlock(block.id)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicateBlock(block.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
      
      <DeleteFieldDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        fieldName={block.question || block.title || "this field"}
        references={checkFieldReferences(block.id)}
        onConfirm={(removeReferences) => {
          if (removeReferences) {
            deleteBlockWithReferences(block.id, true);
          } else {
            deleteBlock(block.id);
          }
        }}
      />
    </motion.div>
  );
}
