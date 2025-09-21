"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Card, Input, ScrollArea } from "@skemya/ui";
import { Plus, Save, Eye, Play, ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { DraggableBlockLibraryClean } from "./draggable-block-library-clean";
import { ModernBlockItemClean } from "./modern-block-item-clean";
import { BlockSettings } from "./block-settings";
import { PreviewPanel } from "./preview-panel";
import { PublishManager } from "../publish/publish-manager";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { useAutosave } from "../../lib/hooks/use-autosave";
import { useAuthStore } from "../../lib/stores/auth-store";
import type { Block } from "@skemya/contracts";

interface ModernFormBuilderCleanProps {
  formId: string;
  onSave: () => Promise<void>;
  onPublish: () => void;
}

export function ModernFormBuilderClean({ formId, onSave, onPublish }: ModernFormBuilderCleanProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { form, updateForm, addBlock, deleteBlock, moveBlock, selectedBlockId, selectBlock } =
    useFormBuilderStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { isSaving, lastSaved, saveNow } = useAutosave(formId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !form) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Add new block from library
    if (activeData?.source === "library") {
      const pageId = form.pages[0]?.id;
      if (!pageId) return;

      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: activeData.blockType,
        question: `New ${activeData.blockType.replace(/_/g, " ")} question`,
        required: false,
      };

      if (overData?.type === "dropzone") {
        addBlock(newBlock, pageId, overData.index);
      } else if (overData?.type === "block") {
        const targetIndex = form.pages[0].blocks.findIndex((b) => b.id === overData.blockId);
        addBlock(newBlock, pageId, targetIndex + 1);
      }
    }
    // Reorder existing blocks
    else if (activeData?.type === "block" && overData?.type === "block") {
      const pageId = form.pages[0]?.id;
      if (!pageId) return;

      const oldIndex = form.pages[0].blocks.findIndex((b) => b.id === activeData.blockId);
      const newIndex = form.pages[0].blocks.findIndex((b) => b.id === overData.blockId);

      if (oldIndex !== newIndex) {
        moveBlock(activeData.blockId, pageId, newIndex);
      }
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this question?");
    if (confirmDelete) {
      deleteBlock(blockId);
      toast.success("Question deleted");
    }
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
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
          <div className="flex-1 bg-muted/10">
            <ScrollArea className="h-full">
              <div className="container max-w-4xl mx-auto py-8">
                {blocks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24"
                  >
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
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <SortableContext
                      items={blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {blocks.map((block, index) => (
                        <ModernBlockItemClean
                          key={block.id}
                          block={block}
                          index={index}
                          onDelete={() => handleDeleteBlock(block.id)}
                          onSelect={() => selectBlock(block.id)}
                          isSelected={selectedBlockId === block.id}
                        />
                      ))}
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

        <DragOverlay>
          {activeId ? (
            <div className="opacity-50 cursor-grabbing">{/* Render the dragged item */}</div>
          ) : null}
        </DragOverlay>

        {/* Preview Panel */}
        <PreviewPanel isOpen={previewOpen} onClose={() => setPreviewOpen(false)} formId={formId} />
      </div>
    </DndContext>
  );
}
