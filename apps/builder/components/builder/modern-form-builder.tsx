"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Card, cn, Input, ScrollArea, Separator } from "@skemya/ui";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Play,
  ArrowLeft,
  MoreVertical,
  Settings,
  Download,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { DraggableBlockLibrary } from "./draggable-block-library";
import { ModernBlockItem } from "./modern-block-item";
import { BlockSettings } from "./block-settings";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { useAutosave } from "../../lib/hooks/use-autosave";
import { useAuthStore } from "../../lib/stores/auth-store";
import type { Block } from "@skemya/contracts";

interface ModernFormBuilderProps {
  formId: string;
  onSave: () => Promise<void>;
  onPublish: () => void;
}

export function ModernFormBuilder({ formId, onSave, onPublish }: ModernFormBuilderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { form, updateForm, addBlock, deleteBlock, moveBlock, selectedBlockId, selectBlock } =
    useFormBuilderStore();

  console.log("ModernFormBuilder render: form from store:", form);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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
    console.log("ModernFormBuilder: form is null");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  console.log("ModernFormBuilder: form loaded:", form);
  const blocks = form.pages[0]?.blocks || [];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/forms")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <input
                type="text"
                value={form.title || ""}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 placeholder:text-muted-foreground/60"
                placeholder="Untitled Form"
              />
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>By {user?.email}</span>
                {lastSaved && (
                  <>
                    <span>•</span>
                    <span>Last saved {new Date(lastSaved).toLocaleTimeString()}</span>
                  </>
                )}
                {isSaving && <span className="text-primary">Saving...</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/preview/${formId}`, "_blank")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={saveNow} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={onPublish}>
              <Play className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left Sidebar - Block Library */}
          <aside className="w-80 border-r bg-card/30 overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Question Types</h3>
              <p className="text-sm text-muted-foreground">Drag to add</p>
            </div>
            <ScrollArea className="flex-1">
              <DraggableBlockLibrary />
            </ScrollArea>
          </aside>

          {/* Center - Form Canvas */}
          <main className="flex-1 bg-muted/20 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto p-8">
                <AnimatePresence mode="popLayout">
                  {blocks.length === 0 ? (
                    <EmptyState onAdd={handleAddBlock} />
                  ) : (
                    <SortableContext
                      items={blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-6">
                        {/* Initial dropzone */}
                        <Dropzone index={0} />

                        {blocks.map((block, index) => (
                          <div key={block.id}>
                            <ModernBlockItem
                              block={block}
                              index={index}
                              onDelete={() => handleDeleteBlock(block.id)}
                              onSelect={() => selectBlock(block.id)}
                              isSelected={selectedBlockId === block.id}
                            />
                            <Dropzone index={index + 1} />
                          </div>
                        ))}

                        {/* Add button at the end */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-center mt-8"
                        >
                          <Button
                            onClick={handleAddBlock}
                            size="lg"
                            variant="outline"
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Question
                          </Button>
                        </motion.div>
                      </div>
                    </SortableContext>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </main>

          {/* Right Sidebar - Settings */}
          <AnimatePresence>
            {(selectedBlockId || showSettings) && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 384, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l bg-card/30 overflow-hidden"
              >
                <div className="w-96 h-full flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">
                      {selectedBlockId ? "Question Settings" : "Form Settings"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        selectBlock(null);
                        setShowSettings(false);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <BlockSettings />
                  </ScrollArea>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId && (
              <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 shadow-lg cursor-grabbing">
                <div className="text-primary font-medium">Moving block...</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center h-[60vh]"
    >
      <Card className="p-12 text-center max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Start building your form</h2>
        <p className="text-muted-foreground mb-8">
          Add your first question to get started. You can drag and drop questions from the library
          on the left.
        </p>
        <Button size="lg" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Question
        </Button>
      </Card>
    </motion.div>
  );
}

// Dropzone component
function Dropzone({ index }: { index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${index}`,
    data: { type: "dropzone", index },
  });

  return (
    <div ref={setNodeRef} className={cn("h-2 -my-1 transition-all", isOver && "h-20 my-2")}>
      {isOver && (
        <div className="h-full border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg flex items-center justify-center">
          <span className="text-sm text-primary">Drop here</span>
        </div>
      )}
    </div>
  );
}
