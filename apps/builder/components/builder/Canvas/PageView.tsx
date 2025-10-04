"use client";

import React, { useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "../../../lib/utils";
import { BlockRenderer } from "./BlockRenderer";
import type { Page } from "@skemya/contracts";

interface PageViewProps {
  page: Page;
  isActive: boolean;
  dragState: {
    activeId: string | null;
    overId: string | null;
    draggedItem: any;
  };
}

export function PageView({ page, isActive, dragState }: PageViewProps) {
  const { setNodeRef } = useDroppable({
    id: `page-${page.id}`,
    data: {
      type: "page",
      pageId: page.id,
    },
  });

  // Create ghost block list using controlled drag state from FormBuilder
  // This prevents infinite loops since dragState only updates during onDragOver events
  const blocksWithGhost = useMemo(() => {
    const blocks = [...page.blocks];
    const { activeId, overId, draggedItem } = dragState;

    // Only add ghost if dragging a new block from library
    if (draggedItem?.type === "new-block" && overId && draggedItem.blockType) {
      // Find if overId is a block on this page
      const overBlock = blocks.find((b: any) => b.id === overId);

      if (overBlock) {
        // Over a block on this page - insert ghost after it
        const overIndex = blocks.findIndex((b: any) => b.id === overId);
        if (overIndex !== -1) {
          const ghostBlock = {
            id: `__ghost__${activeId}`,
            type: draggedItem.blockType,
            question: `New ${draggedItem.blockType.replace(/_/g, " ")} question`,
            description: "",
            required: false,
            settings: {},
            validation: {},
            __isGhost: true,
          };
          blocks.splice(overIndex + 1, 0, ghostBlock as any);
        }
      } else if (overId === `page-${page.id}` && blocks.length === 0) {
        // Over empty page - add ghost at start
        const ghostBlock = {
          id: `__ghost__${activeId}`,
          type: draggedItem.blockType,
          question: `New ${draggedItem.blockType.replace(/_/g, " ")} question`,
          description: "",
          required: false,
          settings: {},
          validation: {},
          __isGhost: true,
        };
        blocks.push(ghostBlock as any);
      }
    }

    return blocks;
  }, [page.blocks, dragState, page.id]);

  const blockIds = blocksWithGhost.map((block: any) => block.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[400px] transition-opacity",
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Page Title */}
      {page.title && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold">{page.title}</h2>
          {page.description && <p className="text-muted-foreground mt-2">{page.description}</p>}
        </motion.div>
      )}

      {/* Blocks */}
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {blocksWithGhost.map((block: any, index: number) => (
            <BlockRenderer
              key={block.id}
              block={block}
              pageId={page.id}
              index={index}
              isDragging={block.__isGhost}
            />
          ))}

          {/* Empty state */}
          {page.blocks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-8 rounded-lg border-2 border-dashed border-muted-foreground/25"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Add your first field</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Drag a field from the left panel to get started building your form
              </p>
            </motion.div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
