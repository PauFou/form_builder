"use client";

import React, { useState, useEffect } from "react";
import {
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
  Circle,
  CheckSquare,
  ToggleLeft,
  Star,
  Minus,
  FileText,
  LayoutGrid,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { FormToolbar } from "./Toolbar/FormToolbar";
import { BlocksList } from "./BlocksList/BlocksList";
import { FormCanvas } from "./Canvas/FormCanvas";
import { PropertiesPanel } from "./Inspector/PropertiesPanel";
import { ShareTab } from "./Share/ShareTab";
import { IntegrateTab } from "./Integrate/IntegrateTab";
import { ResultsTab } from "./Results/ResultsTab";
import { DesignPanel } from "./Design/DesignPanel";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { useAutoSave } from "../../lib/hooks/useAutoSave";
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
  single_select: Circle,
  multi_select: CheckSquare,
  dropdown: ChevronDown,
  yes_no: ToggleLeft,
  rating: Star,
  section: Minus,
  page_break: LayoutGrid,
  description: FileText,
};

export function FormBuilder({ formId }: FormBuilderProps) {
  const [activeTab, setActiveTab] = useState<"build" | "integrate" | "share" | "results">("build");

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

  // Auto-save
  useAutoSave(formId, true);

  // Mock published state - in production this would come from the form data
  const [isPublished, setIsPublished] = useState(false);
  const shareUrl = `https://youform.app/f/${formId}`;

  // Design panel state
  const [isDesignPanelOpen, setIsDesignPanelOpen] = useState(false);

  const handlePublish = () => {
    setIsPublished(true);
  };

  const handleOpenDesign = () => {
    setIsDesignPanelOpen(true);
  };

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Enhanced sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Minimal distance for responsive drag start while avoiding accidental clicks
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Custom collision detection strategy
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    // For dragging from library, use pointerWithin first for more accurate detection
    // This detects based on actual cursor position rather than distance calculations
    const pointerCollisions = pointerWithin(args);

    // Filter to only get block collisions (not page containers)
    const blockCollisions = pointerCollisions.filter((collision) => {
      const container = args.droppableContainers.find((c) => c.id === collision.id);
      return container?.data.current?.type === "block";
    });

    if (blockCollisions.length > 0) {
      return blockCollisions;
    }

    // Fallback to closestCenter for edge cases
    const closestCenterCollisions = closestCenter(args);
    if (closestCenterCollisions.length > 0) {
      return closestCenterCollisions;
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
        // Dragging new block from library - calculate position based on cursor location
        const activeRect = active.rect.current.translated;
        const overRect = over.rect;

        if (activeRect && overRect) {
          // Calculate the Y center of both rectangles
          const activeCenterY = activeRect.top + activeRect.height / 2;
          const overCenterY = overRect.top + overRect.height / 2;

          // If cursor center is above the target block center, insert above; otherwise insert below
          const isAbove = activeCenterY < overCenterY;

          setDropPosition({
            overId: over.id as string,
            isAbove,
          });
        } else {
          // Fallback: insert after if we can't get rect data
          setDropPosition({
            overId: over.id as string,
            isAbove: false,
          });
        }
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
          <FormToolbar formId={formId} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content - Show different content based on active tab */}
          {activeTab === "results" ? (
            <ResultsTab formId={formId} />
          ) : activeTab === "integrate" ? (
            <IntegrateTab formId={formId} />
          ) : activeTab === "share" ? (
            <ShareTab
              formId={formId}
              isPublished={isPublished}
              shareUrl={shareUrl}
              onPublish={handlePublish}
            />
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Blocks List - Dynamic width based on screen */}
              <aside className="w-[200px] min-w-[180px] xl:w-[240px] 2xl:w-[280px] flex-shrink-0 border-r bg-white overflow-hidden transition-all duration-200">
                <BlocksList />
              </aside>

              {/* Center - Canvas - Flexible, takes remaining space */}
              <main className="flex-1 relative bg-gray-100 overflow-hidden min-w-0">
                <FormCanvas dropPosition={dropPosition} onOpenDesign={handleOpenDesign} />
              </main>

              {/* Right Panel - Properties Inspector */}
              <aside className="w-[280px] min-w-[260px] xl:w-[320px] 2xl:w-[360px] flex-shrink-0 border-l bg-white overflow-hidden transition-all duration-200">
                <PropertiesPanel />
              </aside>
            </div>
          )}

          {/* Design Panel Overlay */}
          <DesignPanel
            isOpen={isDesignPanelOpen}
            onClose={() => setIsDesignPanelOpen(false)}
          />
        </div>

        <DragOverlay dropAnimation={null}>
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
