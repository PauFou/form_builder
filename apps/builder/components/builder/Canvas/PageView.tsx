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
}

export function PageView({ page, isActive }: PageViewProps) {
  const { setNodeRef } = useDroppable({
    id: `page-${page.id}`,
    data: {
      type: "page",
      pageId: page.id,
    },
  });

  // Just use the actual blocks without ghost blocks to avoid infinite loops
  const blockIds = page.blocks.map((block: any) => block.id);

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
          {page.blocks.map((block: any, index: number) => (
            <BlockRenderer
              key={block.id}
              block={block}
              pageId={page.id}
              index={index}
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
