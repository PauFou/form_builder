"use client";

import { useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Button,
  Input,
  Textarea,
  cn,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import {
  Plus,
  FileText,
  Settings,
  Palette,
  GitBranch,
  ArrowLeft,
  Eye,
  Play,
  Save,
  MoreVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { BlockLibrary } from "./block-library";
import { BlockSettings } from "./block-settings";
import { ThemeEditor } from "./theme-editor";
import { LogicEditor } from "../logic/logic-editor";
import { BlockItem } from "./block-item";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

interface ProfessionalFormBuilderProps {
  formId: string;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
}

export function ProfessionalFormBuilder({
  formId,
  onSave,
  onPublish,
  onPreview,
}: ProfessionalFormBuilderProps) {
  const { form, updateForm, addBlock, moveBlock, selectedBlockId, selectedPageId } =
    useFormBuilderStore();
  const [activeTab, setActiveTab] = useState<"blocks" | "theme" | "logic" | "settings">("blocks");
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setIsDragging(false);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle adding new blocks from library
    if (activeData?.source === "library" && overData?.type === "dropzone") {
      const newBlock = {
        id: crypto.randomUUID(),
        type: activeData.blockType,
        question: "",
        required: false,
      };
      addBlock(newBlock, overData.pageId, overData.index);
    }
    // Handle reordering existing blocks
    else if (activeData?.type === "block" && overData?.type === "block") {
      moveBlock(activeData.blockId, overData.pageId, overData.index);
    }
    // Handle moving block to empty dropzone
    else if (activeData?.type === "block" && overData?.type === "dropzone") {
      moveBlock(activeData.blockId, overData.pageId, overData.index);
    }
  };

  if (!form) return null;

  const currentPage = form.pages.find((p) => p.id === selectedPageId) || form.pages[0];

  return (
    <div className="h-full flex bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r flex flex-col bg-card/50">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Form Builder</h2>
          <p className="text-sm text-muted-foreground">Professional forms made easy</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <TabsList className="grid grid-cols-4 w-full rounded-none border-b h-12">
            <TabsTrigger value="blocks" className="rounded-none data-[state=active]:shadow-none">
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="theme" className="rounded-none data-[state=active]:shadow-none">
              <Palette className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="logic" className="rounded-none data-[state=active]:shadow-none">
              <GitBranch className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none data-[state=active]:shadow-none">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <BlockLibrary />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="theme" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <ThemeEditor
                  form={form}
                  onUpdateForm={updateForm}
                  onUpdateTheme={(theme) => updateForm({ theme })}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logic" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <LogicEditor />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Form Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Thank You Screen</label>
                      <Textarea
                        placeholder="Thanks for your submission!"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Redirect URL</label>
                      <Input placeholder="https://example.com/success" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header */}
        <div className="border-b bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <input
                type="text"
                value={form.title || ""}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 w-full placeholder:text-muted-foreground/60"
                placeholder="Untitled Form"
              />
              <input
                type="text"
                value={form.description || ""}
                onChange={(e) => updateForm({ description: e.target.value })}
                className="text-muted-foreground bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 mt-1 w-full placeholder:text-muted-foreground/60"
                placeholder="Add a description..."
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button size="sm" onClick={onPublish}>
                <Play className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Form Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="max-w-3xl mx-auto p-8">
              <AnimatePresence mode="wait">
                {currentPage.blocks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-96"
                  >
                    <EmptyDropzone pageId={currentPage.id} />
                  </motion.div>
                ) : (
                  <SortableContext
                    items={currentPage.blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      <Dropzone pageId={currentPage.id} index={0} isActive={isDragging} />
                      {currentPage.blocks.map((block, index) => (
                        <div key={block.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <BlockItem block={block} pageId={currentPage.id} index={index} />
                          </motion.div>
                          <Dropzone
                            pageId={currentPage.id}
                            index={index + 1}
                            isActive={isDragging}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                )}
              </AnimatePresence>
            </div>

            <DragOverlay>
              {isDragging && (
                <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 shadow-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      {selectedBlockId && (
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          className="w-96 border-l bg-card/50"
        >
          <div className="p-4 border-b">
            <h3 className="font-semibold">Block Properties</h3>
          </div>
          <ScrollArea className="h-[calc(100vh-60px)]">
            <BlockSettings />
          </ScrollArea>
        </motion.div>
      )}
    </div>
  );
}

function Dropzone({
  pageId,
  index,
  isActive,
}: {
  pageId: string;
  index: number;
  isActive: boolean;
}) {
  const { useDroppable } = require("@dnd-kit/core"); // eslint-disable-line @typescript-eslint/no-var-requires
  const dropzoneId = `${pageId}-dropzone-${index}`;

  const { setNodeRef } = useDroppable({
    id: dropzoneId,
    data: {
      type: "dropzone",
      pageId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all duration-200 rounded-lg",
        isActive ? "h-24 mx-4" : "h-2"
      )}
    >
      {isActive && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg flex items-center justify-center">
          <p className="text-sm text-primary/70">Drop here</p>
        </div>
      )}
    </div>
  );
}

function EmptyDropzone({ pageId }: { pageId: string }) {
  const { useDroppable } = require("@dnd-kit/core"); // eslint-disable-line @typescript-eslint/no-var-requires
  const { setNodeRef } = useDroppable({
    id: `${pageId}-dropzone-0`,
    data: {
      type: "dropzone",
      pageId,
      index: 0,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="h-full border-2 border-dashed border-muted-foreground/30 rounded-xl bg-card/50 flex items-center justify-center"
    >
      <div className="text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Start building your form</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Drag blocks from the left panel or click the button below to get started
        </p>
        <Button size="lg" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add First Question
        </Button>
      </div>
    </div>
  );
}
