"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  Upload,
  PenTool,
  MapPin,
  CreditCard,
  List,
  CheckSquare,
  ToggleLeft,
  Star,
  Minus,
  FileText,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@skemya/ui";
import { FormToolbar } from "./Toolbar/FormToolbar";
import { BlockLibrary } from "./BlockLibrary/BlockLibrary";
import { FormCanvas } from "./Canvas/FormCanvas";
import { PropertiesPanel } from "./Inspector/PropertiesPanel";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  CollisionDetection,
} from "@dnd-kit/core";
import { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";

interface FormBuilderProps {
  formId: string;
}

const blockIcons: Record<string, React.ComponentType<any>> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  phone: Phone,
  number: Hash,
  date: Calendar,
  time: Clock,
  file_upload: Upload,
  signature: PenTool,
  address: MapPin,
  payment: CreditCard,
  single_select: List,
  multi_select: CheckSquare,
  dropdown: ChevronDown,
  yes_no: ToggleLeft,
  rating: Star,
  section: Minus,
  page_break: LayoutGrid,
  description: FileText,
};

export function FormBuilder({ formId }: FormBuilderProps) {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [fullScreenCanvas, setFullScreenCanvas] = useState(false);

  // Drag & Drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [draggedBlockType, setDraggedBlockType] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<{ overId: string; isAbove: boolean } | null>(
    null
  );

  const { form, selectedBlockId, addBlock, moveBlock, undo, redo, canUndo, canRedo } =
    useFormBuilderStore();

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

  // Enhanced sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // Immediate drag activation
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Custom collision detection strategy optimized for vertical lists
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    // Use closestCenter for better precision with vertical block lists
    // This finds the block whose center is closest to the cursor
    const closestCenterCollisions = closestCenter(args);
    if (closestCenterCollisions.length > 0) {
      return closestCenterCollisions;
    }

    // Fallback to pointer within for edge cases
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Final fallback to rect intersection
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDraggedItem(event.active.data.current);
    const activeData = event.active.data.current;
    if (activeData?.type === "new-block") {
      setDraggedBlockType(activeData.blockType);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    setOverId((over?.id as string) || null);

    if (!over || !active || active.id === over.id) {
      setDropPosition(null);
      return;
    }

    const overData = over.data.current;
    const activeData = active.data.current;

    // Show drop indicator for blocks and new blocks
    if (overData?.type === "block") {
      if (activeData?.type === "block") {
        // Dragging existing block
        const activeIndex = activeData.index;
        const overIndex = overData.index;
        const isAbove = activeIndex > overIndex;

        setDropPosition({
          overId: over.id as string,
          isAbove,
        });
      } else if (activeData?.type === "new-block") {
        // Dragging new block from library - always insert after
        setDropPosition({
          overId: over.id as string,
          isAbove: false,
        });
      }
    } else {
      setDropPosition(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentDropPosition = dropPosition; // Save before clearing

    setActiveId(null);
    setOverId(null);
    setDropPosition(null);
    const itemData = draggedItem;
    setDraggedItem(null);
    setDraggedBlockType(null);

    if (!over) {
      return;
    }

    const overData = over.data.current;

    // Handle adding new blocks from library
    if (itemData?.type === "new-block") {
      let pageId: string;
      let index: number;

      if (overData?.type === "block") {
        // Dropped on a block - use dropPosition to determine index
        pageId = overData.pageId;
        const blocks = form?.pages.find((p: any) => p.id === pageId)?.blocks || [];
        const overIndex = blocks.findIndex((b: any) => b.id === over.id);

        if (overIndex >= 0) {
          // If isAbove, insert before; otherwise insert after
          index = currentDropPosition?.isAbove ? overIndex : overIndex + 1;
        } else {
          index = 0;
        }
      } else if (overData?.type === "page") {
        // Dropped on empty page
        pageId = overData.pageId || overData.id;
        index = 0;
      } else {
        return;
      }

      const newBlock = {
        id: crypto.randomUUID(),
        type: itemData.blockType,
        question: `New ${itemData.blockType.replace("_", " ")} question`,
        required: false,
      };
      addBlock(newBlock, pageId, index);
      return;
    }

    // Handle reordering existing blocks
    if (itemData?.type === "block" && active.id !== over.id) {
      const blockId = itemData.block.id;
      const fromPageId = itemData.pageId;

      if (overData?.type === "block") {
        // Dropped on another block
        const toPageId = overData.pageId;
        const blocks = form?.pages.find((p: any) => p.id === toPageId)?.blocks || [];
        const overIndex = blocks.findIndex((b: any) => b.id === over.id);
        const fromIndex = blocks.findIndex((b: any) => b.id === blockId);

        if (overIndex >= 0) {
          // Calculate target index based on drop position
          let toIndex: number;

          if (fromPageId === toPageId) {
            // Moving within the same page
            if (currentDropPosition?.isAbove) {
              // Insert before the over block
              toIndex = overIndex;
              // If we're moving from below, the index stays the same
              // If we're moving from above, we need to account for the removal
              if (fromIndex < overIndex) {
                toIndex--;
              }
            } else {
              // Insert after the over block
              toIndex = overIndex + 1;
              // If we're moving from above, we need to account for the removal
              if (fromIndex < overIndex) {
                toIndex--;
              }
            }
          } else {
            // Moving to a different page - no adjustment needed
            toIndex = currentDropPosition?.isAbove ? overIndex : overIndex + 1;
          }

          moveBlock(blockId, toPageId, toIndex);
        }
      } else if (overData?.type === "page") {
        // Dropped on empty page
        const toPageId = overData.pageId || overData.id;
        moveBlock(blockId, toPageId, 0);
      }
    }
  };

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

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-screen bg-background flex flex-col overflow-hidden">
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
                  className="relative border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden"
                >
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
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
            <main className="flex-1 relative bg-muted/30 overflow-hidden h-full">
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
              <FormCanvas
                dragState={{
                  activeId,
                  overId,
                  draggedItem,
                }}
              />
            </main>

            {/* Right Panel - Properties Inspector */}
            <AnimatePresence mode="wait">
              {!rightPanelCollapsed && selectedBlockId && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden"
                >
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                      <h2 className="font-semibold">Properties</h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRightPanelCollapsed(true)}
                      >
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

        <DragOverlay>
          {draggedItem &&
            draggedItem.type === "new-block" &&
            (() => {
              const Icon = blockIcons[draggedItem.blockType] || Type;
              return (
                <div className="bg-card shadow-lg rounded-lg p-3 border-2 border-primary cursor-grabbing opacity-90">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium text-sm">
                      {draggedItem.label || draggedItem.blockType}
                    </div>
                  </div>
                </div>
              );
            })()}
          {draggedItem && draggedItem.type === "block" && (
            <div className="bg-card shadow-lg rounded-lg p-4 border-2 border-primary cursor-grabbing opacity-90">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <div className="h-5 w-5 bg-primary/20 rounded" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {draggedItem.block?.question || draggedItem.block?.type?.replace(/_/g, " ")}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
