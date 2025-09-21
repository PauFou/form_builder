"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@skemya/ui";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { Sidebar } from "./sidebar";
import { Canvas } from "./canvas";
import { Inspector } from "./inspector";
import { LogicEditor } from "../logic/logic-editor";
import { Toolbar } from "./toolbar";
import { useUndoRedoShortcuts } from "../../lib/hooks/use-undo-redo-shortcuts";
import { UndoRedoToast } from "../ui/undo-redo-toast";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { useAnalytics } from "../../lib/hooks/use-analytics";

interface FormBuilderProps {
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
}

export function FormBuilder({ onSave, onPreview, onPublish }: FormBuilderProps) {
  const { form, selectedBlockId } = useFormBuilderStore();
  const [activeTab, setActiveTab] = useState("design");
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Analytics tracking for form builder interactions
  const analytics = useAnalytics({
    formId: form?.id || "unknown",
    organizationId: "placeholder-org-id", // TODO: Get from auth context
    enabled: !!form?.id,
  });

  // Track form builder usage
  useEffect(() => {
    if (form?.id) {
      analytics.trackFormStart();
    }
  }, [form?.id, analytics]);

  // Enable keyboard shortcuts
  useUndoRedoShortcuts({ onSave, onPreview });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleDragStart = (event: any) => {
    setDraggedItem(event.active.data.current);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen overflow-hidden flex flex-col">
        <Toolbar onSave={onSave} onPreview={onPreview} onPublish={onPublish} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b px-4 py-2">
            <TabsList>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="logic">Logic</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="design" className="h-[calc(100%-60px)] m-0">
            <div className="grid grid-cols-[300px_1fr_320px] h-full">
              <Sidebar />
              <Canvas />
              {selectedBlockId && <Inspector />}
            </div>
          </TabsContent>

          <TabsContent value="logic" className="h-[calc(100%-60px)] m-0 p-6">
            <LogicEditor />
          </TabsContent>
        </Tabs>
      </div>

      <DragOverlay>
        {draggedItem && <div className="bg-white shadow-lg rounded-lg p-4">{draggedItem.type}</div>}
      </DragOverlay>

      <UndoRedoToast />
    </DndContext>
  );
}
