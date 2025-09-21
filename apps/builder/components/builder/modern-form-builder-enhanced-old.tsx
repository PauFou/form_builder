"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button, Card, Input, ScrollArea } from "@skemya/ui";
import { Plus, Save, Eye, Play, ArrowLeft, ChevronRight, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

import { DraggableBlockLibraryClean } from "./draggable-block-library-clean";
import { EnhancedBlockItem } from "./enhanced-block-item";
import { BlockSettings } from "./block-settings";
import { PreviewPanel } from "./preview-panel";
import { PublishManager } from "../publish/publish-manager";
import { DropIndicator } from "./drop-indicator";
import { DragCursorOverlay } from "./drag-cursor-overlay";
import { EnhancedDropZone } from "./enhanced-drop-zone";
import { GhostPreview } from "./ghost-preview";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { useAutosave } from "../../lib/hooks/use-autosave";
import { useAuthStore } from "../../lib/stores/auth-store";
import type { Block } from "@skemya/contracts";

interface ModernFormBuilderEnhancedProps {
  formId: string;
  onSave: () => Promise<void>;
  onPublish: () => void;
}

export function ModernFormBuilderEnhanced({
  formId,
  onSave,
  onPublish,
}: ModernFormBuilderEnhancedProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { form, updateForm, addBlock, deleteBlock, moveBlock, selectedBlockId, selectBlock } =
    useFormBuilderStore();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [draggedType, setDraggedType] = useState<"library" | "block" | null>(null);
  const [dropPosition, setDropPosition] = useState<{
    index: number;
    position: "before" | "after";
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isValidDropTarget, setIsValidDropTarget] = useState(false);
  const [ghostPreviewIndex, setGhostPreviewIndex] = useState<number | null>(null);
  const { isSaving, lastSaved, saveNow } = useAutosave(formId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);

    const activeData = active.data.current;
    if (activeData?.source === "library") {
      setDraggedType("library");
    } else if (activeData?.type === "block") {
      setDraggedType("block");
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id || null);

    if (!over || !form) return;

    const overData = over.data.current;

    // Check if valid drop target
    const isValid =
      overData?.type === "block" ||
      overData?.type === "dropzone" ||
      overData?.type === "empty-dropzone";
    setIsValidDropTarget(isValid);

    // Calculate drop position
    if (overData?.type === "block" || overData?.type === "dropzone") {
      const overIndex = overData.index || 0;
      const draggedRect = event.active.rect;
      const overRect = over.rect;

      if (draggedRect && overRect && draggedRect.current.translated) {
        const overMiddleY = overRect.top + overRect.height / 2;
        const position = draggedRect.current.translated.top < overMiddleY ? "before" : "after";
        setDropPosition({ index: overIndex, position });

        // Set ghost preview index
        if (position === "before") {
          setGhostPreviewIndex(overIndex);
        } else {
          setGhostPreviewIndex(overIndex + 1);
        }
      }
    } else if (overData?.type === "empty-dropzone") {
      setGhostPreviewIndex(0);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);
    setDraggedType(null);
    setDropPosition(null);
    setIsValidDropTarget(false);
    setGhostPreviewIndex(null);

    if (!over || !form) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const pageId = form.pages[0]?.id;

    if (!pageId) return;

    // Add new block from library
    if (activeData?.source === "library") {
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: activeData.blockType,
        question: `New ${activeData.blockType.replace(/_/g, " ")} question`,
        required: false,
      };

      let insertIndex = 0;

      if (overData?.type === "dropzone" || overData?.type === "empty-dropzone") {
        insertIndex = overData.index || 0;
      } else if (overData?.type === "block") {
        const targetIndex = form.pages[0].blocks.findIndex((b) => b.id === overData.blockId);
        insertIndex = dropPosition?.position === "after" ? targetIndex + 1 : targetIndex;
      }

      addBlock(newBlock, pageId, insertIndex);
      selectBlock(newBlock.id);
      toast.success("Question added");
    }
    // Reorder existing blocks
    else if (activeData?.type === "block" && overData?.type === "block") {
      const oldIndex = form.pages[0].blocks.findIndex((b) => b.id === activeData.blockId);
      const newIndex = form.pages[0].blocks.findIndex((b) => b.id === overData.blockId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const adjustedNewIndex =
          dropPosition?.position === "after" && newIndex > oldIndex
            ? newIndex
            : dropPosition?.position === "before" && newIndex < oldIndex
              ? newIndex
              : newIndex > oldIndex
                ? newIndex - 1
                : newIndex;

        moveBlock(activeData.blockId, pageId, adjustedNewIndex);
      }
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    deleteBlock(blockId);
    toast.success("Question deleted");
  };

  const handleAddBlock = () => {
    if (!form || !form.pages[0]) return;

    const newBlock: Block = {
      id: crypto.randomUUID(),
      type: "short_text",
      question: "New question",
      required: false,
    };

    addBlock(newBlock, form.pages[0].id);
    selectBlock(newBlock.id);
    toast.success("New question added");
  };

  if (!form) {
    return (
      <div className="h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </motion.div>
      </div>
    );
  }

  const blocks = form.pages[0]?.blocks || [];
  const activeBlock =
    activeId && draggedType === "block" ? blocks.find((b) => b.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`h-screen flex flex-col transition-all duration-300 ${previewOpen ? "mr-[50%]" : ""}`}
      >
        {/* Clean Header */}
        <header className="border-b bg-background fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/forms")}
                className="group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Forms
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <input
                  type="text"
                  value={form.title || ""}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 placeholder:text-muted-foreground"
                  placeholder="Untitled Form"
                />
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{user?.email}</span>
                  {isSaving ? (
                    <span className="text-primary flex items-center gap-1">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      Saving...
                    </span>
                  ) : lastSaved ? (
                    <>
                      <span>•</span>
                      <span>
                        Saved at{" "}
                        {new Date(lastSaved).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="group"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await saveNow();
                  toast.success("Form saved successfully");
                }}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <PublishManager formId={formId} form={form} />
            </div>
          </div>
        </header>

        {/* Main Content with header spacing */}
        <div className="flex flex-1 overflow-hidden mt-[73px]">
          {/* Block Library */}
          <aside className="w-80 border-r bg-muted/30 flex flex-col">
            <div className="p-6 border-b">
              <h2 className="font-semibold">Question Library</h2>
              <p className="text-sm text-muted-foreground mt-1">Drag and drop to add questions</p>
            </div>
            <ScrollArea className="flex-1">
              <DraggableBlockLibraryClean />
            </ScrollArea>
          </aside>

          {/* Canvas */}
          <div className="flex-1 bg-muted/10 relative">
            <ScrollArea className="h-full">
              <div className="container max-w-4xl mx-auto py-8">
                {blocks.length === 0 ? (
                  <EnhancedDropZone
                    id="empty-dropzone"
                    data={{
                      type: "empty-dropzone",
                      index: 0,
                    }}
                    isActive={draggedType !== null}
                    isOver={overId === "empty-dropzone"}
                    isEmpty={true}
                    className="min-h-[400px]"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-24"
                    >
                      {!draggedType && (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Start Building Your Form</h3>
                          <p className="text-muted-foreground mb-6">
                            Drag questions from the library or click below
                          </p>
                          <Button onClick={handleAddBlock} size="lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Question
                          </Button>
                        </>
                      )}
                    </motion.div>
                  </EnhancedDropZone>
                ) : (
                  <div className="space-y-2">
                    <SortableContext
                      items={blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <AnimatePresence>
                        {blocks.length > 0 && (
                          <>
                            <DropIndicator
                              id="dropzone-start"
                              data={{
                                type: "dropzone",
                                index: 0,
                              }}
                              isOver={
                                overId === "dropzone-start" ||
                                (dropPosition?.index === 0 && dropPosition?.position === "before")
                              }
                              isActive={draggedType !== null}
                            />
                            {ghostPreviewIndex === 0 && draggedType === "library" && (
                              <GhostPreview
                                type={activeId as string}
                                isVisible={true}
                                targetIndex={0}
                              />
                            )}
                          </>
                        )}

                        {blocks.map((block, index) => (
                          <div key={block.id}>
                            {/* Ghost preview for moving blocks */}
                            {ghostPreviewIndex === index &&
                              draggedType === "block" &&
                              activeBlock && (
                                <GhostPreview
                                  block={activeBlock}
                                  isVisible={true}
                                  targetIndex={index}
                                />
                              )}

                            <EnhancedBlockItem
                              block={block}
                              index={index}
                              onDelete={() => handleDeleteBlock(block.id)}
                              onSelect={() => selectBlock(block.id)}
                              isSelected={selectedBlockId === block.id}
                              isDragging={activeId === block.id}
                            />

                            {/* Drop indicator between blocks */}
                            {index < blocks.length - 1 && (
                              <>
                                <DropIndicator
                                  id={`dropzone-${index + 1}`}
                                  data={{
                                    type: "dropzone",
                                    index: index + 1,
                                  }}
                                  isOver={
                                    overId === `dropzone-${index + 1}` ||
                                    (overId === block.id && dropPosition?.position === "after") ||
                                    (index + 1 < blocks.length &&
                                      overId === blocks[index + 1].id &&
                                      dropPosition?.position === "before")
                                  }
                                  isActive={draggedType !== null}
                                />

                                {/* Ghost preview for library items between blocks */}
                                {ghostPreviewIndex === index + 1 && draggedType === "library" && (
                                  <GhostPreview
                                    type={activeId as string}
                                    isVisible={true}
                                    targetIndex={index + 1}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        {/* Drop indicator at the end */}
                        {blocks.length > 0 && (
                          <>
                            <DropIndicator
                              id="dropzone-end"
                              data={{
                                type: "dropzone",
                                index: blocks.length,
                              }}
                              isOver={
                                overId === "dropzone-end" ||
                                (blocks.length > 0 &&
                                  overId === blocks[blocks.length - 1].id &&
                                  dropPosition?.position === "after")
                              }
                              isActive={draggedType !== null}
                            />

                            {/* Ghost preview at the end */}
                            {ghostPreviewIndex === blocks.length && draggedType && (
                              <GhostPreview
                                type={draggedType === "library" ? (activeId as string) : undefined}
                                block={
                                  draggedType === "block" ? activeBlock || undefined : undefined
                                }
                                isVisible={true}
                                targetIndex={blocks.length}
                              />
                            )}
                          </>
                        )}
                      </AnimatePresence>
                    </SortableContext>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center pt-8"
                    >
                      <Button variant="outline" onClick={handleAddBlock} className="group">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Settings Panel */}
          {selectedBlockId && (
            <motion.aside
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-96 border-l bg-background"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Question Settings</h2>
                  <Button variant="ghost" size="sm" onClick={() => selectBlock(null)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <BlockSettings />
              </ScrollArea>
            </motion.aside>
          )}
        </div>

        {/* Enhanced Drag Overlay */}
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeId && (
                <div className="relative">
                  {draggedType === "library" && (
                    <motion.div
                      animate={{
                        scale: 1.05,
                        rotate: 3,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="cursor-grabbing"
                    >
                      <Card className="p-6 bg-background border-2 border-primary shadow-2xl max-w-md">
                        <div className="flex items-center gap-4">
                          <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                          >
                            <Plus className="h-6 w-6 text-primary" />
                          </motion.div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg">New Question</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Drop to add to your form
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="h-10 bg-muted/50 rounded animate-pulse" />
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {draggedType === "block" && activeBlock && (
                    <motion.div
                      initial={{ scale: 1, rotate: 0 }}
                      animate={{
                        scale: 1.05,
                        rotate: 2,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                      }}
                      className="cursor-grabbing"
                    >
                      <div className="relative">
                        <EnhancedBlockItem
                          block={activeBlock}
                          index={0}
                          onDelete={() => {}}
                          onSelect={() => {}}
                          isSelected={false}
                          isDragging={true}
                          isOverlay={true}
                        />
                        {/* Drag handle visual */}
                        <motion.div
                          className="absolute -top-2 left-1/2 -translate-x-1/2"
                          animate={{
                            y: [-2, 2, -2],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            <div className="w-1 h-1 bg-primary rounded-full" />
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </DragOverlay>,
            document.body
          )}

        {/* Preview Panel */}
        <PreviewPanel isOpen={previewOpen} onClose={() => setPreviewOpen(false)} formId={formId} />

        {/* Cursor overlay */}
        <DragCursorOverlay isDragging={draggedType !== null} isValidTarget={isValidDropTarget} />
      </div>
    </DndContext>
  );
}
