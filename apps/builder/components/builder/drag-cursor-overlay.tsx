"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

interface DragCursorOverlayProps {
  isDragging: boolean;
  isValidTarget: boolean;
}

export function DragCursorOverlay({ isDragging, isValidTarget }: DragCursorOverlayProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    }
  }, [isDragging]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            left: mousePosition.x + 16,
            top: mousePosition.y + 16,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-xl",
              "backdrop-blur-sm border transition-colors duration-200",
              isValidTarget
                ? "bg-green-500/90 text-white border-green-600"
                : "bg-orange-500/90 text-white border-orange-600"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isValidTarget ? "bg-white" : "bg-white/70"
              )}
            />
            <span>{isValidTarget ? "Drop to add" : "Move to valid area"}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
