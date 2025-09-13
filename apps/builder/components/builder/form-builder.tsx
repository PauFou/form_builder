"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@forms/ui";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { Sidebar } from "./sidebar";
import { Canvas } from "./canvas";
import { PropertiesPanel } from "./properties-panel";
import { LogicEditor } from "../logic/logic-editor";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { useState } from "react";

export function FormBuilder() {
  const { form, selectedBlockId } = useFormBuilderStore();
  const [activeTab, setActiveTab] = useState("design");
  const [draggedItem, setDraggedItem] = useState<any>(null);

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
      <div className="h-screen overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
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
              {selectedBlockId && <PropertiesPanel />}
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
    </DndContext>
  );
}
