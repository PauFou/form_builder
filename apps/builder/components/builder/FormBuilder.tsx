"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@skemya/ui";
import { FormToolbar } from "./Toolbar/FormToolbar";
import { BlockLibrary } from "./BlockLibrary/BlockLibrary";
import { FormCanvas } from "./Canvas/FormCanvas";
import { PropertiesPanel } from "./Inspector/PropertiesPanel";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

interface FormBuilderProps {
  formId: string;
}

export function FormBuilder({ formId }: FormBuilderProps) {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [fullScreenCanvas, setFullScreenCanvas] = useState(false);

  const { form, selectedBlockId, undo, redo, canUndo, canRedo } = useFormBuilderStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd+Z / Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      }

      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) redo();
      }

      // Save: Cmd+S / Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // Save is handled by auto-save in toolbar
      }

      // Toggle panels: Cmd+\ / Ctrl+\
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setLeftPanelCollapsed((prev) => !prev);
        setRightPanelCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  const handleFullScreenToggle = () => {
    setFullScreenCanvas(!fullScreenCanvas);
    if (!fullScreenCanvas) {
      setLeftPanelCollapsed(true);
      setRightPanelCollapsed(true);
    } else {
      setLeftPanelCollapsed(false);
      setRightPanelCollapsed(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <FormToolbar formId={formId} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Block Library */}
        <AnimatePresence mode="wait">
          {!leftPanelCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold">Add Fields</h2>
                  <Button size="sm" variant="ghost" onClick={() => setLeftPanelCollapsed(true)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <BlockLibrary />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed Left Panel Button */}
        {leftPanelCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLeftPanelCollapsed(false)}
              className="absolute left-2 top-4 z-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Center - Canvas */}
        <main className="flex-1 relative bg-muted/30 overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFullScreenToggle}
              className="bg-background/80 backdrop-blur-sm"
            >
              {fullScreenCanvas ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <FormCanvas />
        </main>

        {/* Right Panel - Properties Inspector */}
        <AnimatePresence mode="wait">
          {!rightPanelCollapsed && selectedBlockId && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold">Properties</h2>
                  <Button size="sm" variant="ghost" onClick={() => setRightPanelCollapsed(true)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <PropertiesPanel />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed Right Panel Button */}
        {rightPanelCollapsed && selectedBlockId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRightPanelCollapsed(false)}
              className="absolute right-2 top-4 z-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
