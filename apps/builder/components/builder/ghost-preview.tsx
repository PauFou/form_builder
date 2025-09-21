"use client";

import { motion } from "framer-motion";
import { Card } from "@skemya/ui";
import { cn } from "../../lib/utils";
import type { Block } from "@skemya/contracts";
import { EnhancedBlockItem } from "./enhanced-block-item";

interface GhostPreviewProps {
  block?: Block;
  type?: string;
  isVisible: boolean;
  targetIndex?: number;
  className?: string;
}

export function GhostPreview({
  block,
  type,
  isVisible,
  targetIndex = 0,
  className,
}: GhostPreviewProps) {
  if (!isVisible) return null;

  // For library items
  if (!block && type) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 0.5, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("relative", className)}
      >
        <Card className="p-6 border-2 border-dashed border-primary/50 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{targetIndex + 1}</span>
            </div>
            <div className="flex-1">
              <div className="h-6 w-48 bg-primary/10 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // For existing blocks
  if (block) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 0.4, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("pointer-events-none", className)}
      >
        <div className="scale-95">
          <EnhancedBlockItem
            block={block}
            index={targetIndex}
            onDelete={() => {}}
            onSelect={() => {}}
            isSelected={false}
            isDragging={true}
            isOverlay={false}
          />
        </div>
      </motion.div>
    );
  }

  return null;
}
