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
  Settings,
  ChevronRight,
  Sparkles,
  Layers,
  Palette,
  Code2,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { DraggableBlockLibraryV2 } from "./draggable-block-library-v2";
import { ModernBlockItemV2 } from "./modern-block-item-v2";
import { BlockSettings } from "./block-settings";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { useAutosave } from "../../lib/hooks/use-autosave";
import { useAuthStore } from "../../lib/stores/auth-store";
import type { Block } from "@skemya/contracts";

interface ModernFormBuilderV2Props {
  formId: string;
  onSave: () => Promise<void>;
  onPublish: () => void;
}

export function ModernFormBuilderV2({ formId, onSave, onPublish }: ModernFormBuilderV2Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { form, updateForm, addBlock, deleteBlock, moveBlock, selectedBlockId, selectBlock } =
    useFormBuilderStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"build" | "design" | "logic" | "data">("build");
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
      <div className="h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20" />
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6" />
              <p className="text-lg text-muted-foreground">Loading form...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const blocks = form.pages[0]?.blocks || [];

  const tabs = [
    { id: "build", label: "Build", icon: Layers },
    { id: "design", label: "Design", icon: Palette },
    { id: "logic", label: "Logic", icon: Code2 },
    { id: "data", label: "Data", icon: BarChart3 },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        {/* Modern Header with Glass Effect */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-border/50 bg-card/50 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/forms")}
                className="rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forms
              </Button>
              <Separator orientation="vertical" className="h-8 bg-border/50" />
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={form.title || ""}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded-xl px-3 -ml-3 placeholder:text-muted-foreground/60"
                    placeholder="Untitled Form"
                  />
                  {isSaving && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 backdrop-blur-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-medium text-primary">Saving</span>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {user?.email}
                  </span>
                  {lastSaved && (
                    <>
                      <span className="text-border">•</span>
                      <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/preview/${formId}`, "_blank")}
                className="rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                onClick={onPublish}
                className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                <Play className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {/* Modern Tab Navigation */}
          <div className="px-8 -mb-px">
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-xl transition-all",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm border-t border-x border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Modern Block Library */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col"
          >
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-semibold mb-1">Question Library</h2>
              <p className="text-sm text-muted-foreground">Drag and drop to add questions</p>
            </div>
            <ScrollArea className="flex-1">
              <DraggableBlockLibraryV2 />
            </ScrollArea>
          </motion.aside>

          {/* Canvas Area with Modern Styling */}
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
            <ScrollArea className="h-full">
              <div className="min-h-full p-8">
                <div className="max-w-4xl mx-auto">
                  <AnimatePresence mode="wait">
                    {blocks.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-24"
                      >
                        <div className="relative inline-flex mb-8">
                          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 to-accent/30" />
                          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-border/50 flex items-center justify-center">
                            <Plus className="h-10 w-10 text-primary" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          Start Building Your Form
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                          Drag questions from the library or click the button below to add your
                          first question
                        </p>
                        <Button
                          size="lg"
                          onClick={handleAddBlock}
                          className="rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add First Question
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <SortableContext
                          items={blocks.map((b) => b.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {blocks.map((block, index) => (
                            <ModernBlockItemV2
                              key={block.id}
                              block={block}
                              index={index}
                              onDelete={() => handleDeleteBlock(block.id)}
                              onSelect={() => selectBlock(block.id)}
                              isSelected={selectedBlockId === block.id}
                            />
                          ))}
                        </SortableContext>

                        {/* Add Question Button */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex justify-center pt-8"
                        >
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleAddBlock}
                            className="rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                          >
                            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
                            Add Question
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Modern Settings Panel */}
          {selectedBlockId && (
            <motion.aside
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-96 border-l border-border/50 bg-card/30 backdrop-blur-sm"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Question Settings</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectBlock(null)}
                    className="rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-theme(spacing.32))]">
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
      </div>
    </DndContext>
  );
}
