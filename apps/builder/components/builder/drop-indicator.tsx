"use client";

import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";

interface DropIndicatorProps {
  id: string;
  data: any;
  isOver: boolean;
  isActive?: boolean;
  className?: string;
}

export function DropIndicator({
  id,
  data,
  isOver,
  isActive = false,
  className,
}: DropIndicatorProps) {
  const { setNodeRef } = useDroppable({
    id,
    data,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all duration-300",
        isActive ? "h-8 my-2" : "h-2",
        className
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: isOver ? 32 : 2 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2"
          >
            <div className="relative">
              {/* Main drop line */}
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-200 relative overflow-hidden",
                  isOver ? "bg-primary shadow-lg shadow-primary/30" : "bg-border/70"
                )}
              >
                {isOver && (
                  <>
                    {/* Animated shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />

                    {/* Pulse rings */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  </>
                )}
              </div>

              {/* Side indicators */}
              <AnimatePresence>
                {isOver && (
                  <>
                    <motion.div
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      exit={{ scale: 0, x: -10 }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3"
                    >
                      <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50">
                        <div className="w-full h-full bg-primary rounded-full animate-ping" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0, x: 10 }}
                      animate={{ scale: 1, x: 0 }}
                      exit={{ scale: 0, x: 10 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3"
                    >
                      <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50">
                        <div className="w-full h-full bg-primary rounded-full animate-ping" />
                      </div>
                    </motion.div>

                    {/* Center indicator with icon */}
                    <motion.div
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, y: -20 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="flex items-center gap-2 bg-primary text-primary-foreground pl-2 pr-3 py-1.5 rounded-full text-xs font-medium shadow-xl whitespace-nowrap">
                        <Plus className="h-3 w-3" />
                        <span>Insert here</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always visible subtle line when not active */}
      {!isActive && (
        <div
          className={cn(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 h-px transition-all duration-200",
            "bg-gradient-to-r from-transparent via-border/50 to-transparent"
          )}
        />
      )}
    </div>
  );
}
