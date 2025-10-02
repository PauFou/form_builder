"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DropIndicatorProps {
  overId: string | null;
  isAbove: boolean;
}

export function DropIndicator({ overId, isAbove }: DropIndicatorProps) {
  const [indicatorPosition, setIndicatorPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!overId) {
      setIndicatorPosition(null);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    // Update position continuously during drag to follow animations
    const updatePosition = () => {
      const blockElement = document.querySelector(`[data-block-id="${overId}"]`);
      if (!blockElement) {
        setIndicatorPosition(null);
        return;
      }

      const rect = blockElement.getBoundingClientRect();
      const top = isAbove ? rect.top : rect.bottom;

      setIndicatorPosition({
        top,
        left: rect.left + 16,
        width: rect.width - 32,
      });

      // Continue updating
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    // Start the update loop
    updatePosition();

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [overId, isAbove]);

  return (
    <AnimatePresence>
      {indicatorPosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 pointer-events-none"
          style={{
            top: indicatorPosition.top - 1,
            left: indicatorPosition.left,
            width: indicatorPosition.width,
          }}
        >
          <div className="h-0.5 bg-primary rounded-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
