"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";

interface DropZoneProps {
  pageId: string;
  index: number;
}

export function DropZone({ pageId, index }: DropZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `drop-${pageId}-${index}`,
    data: {
      type: "drop-zone",
      pageId,
      index,
    },
  });

  const isActiveNewBlock = active?.data.current?.type === "new-block";
  const isActiveBlock = active?.data.current?.type === "block";
  const showDropIndicator = isOver && (isActiveNewBlock || isActiveBlock);

  return (
    <div
      ref={setNodeRef}
      className={cn("relative h-2 -my-1 transition-all", showDropIndicator && "h-20")}
    >
      <AnimatePresence>
        {showDropIndicator && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-full h-16 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center">
              <p className="text-sm font-medium text-primary">Drop here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
