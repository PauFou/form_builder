"use client";

import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";

interface EnhancedDropZoneProps {
  id: string;
  data: any;
  isActive: boolean;
  isOver: boolean;
  isEmpty?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function EnhancedDropZone({
  id,
  data,
  isActive,
  isOver,
  isEmpty = false,
  className,
  children,
}: EnhancedDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id,
    data,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("relative transition-all duration-300", isActive && "min-h-[120px]", className)}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-200",
              isOver
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                : "border-muted-foreground/30 bg-muted/30"
            )}
          >
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: isOver ? 1.2 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-colors",
                    isOver ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      isOver ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <Plus className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Drop question here</p>
                </motion.div>
              </div>
            )}

            {/* Animated borders */}
            {isOver && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-primary"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.02, opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}
