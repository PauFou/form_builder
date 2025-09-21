"use client";

import { useState } from "react";
import { Card } from "@skemya/ui";
import { Button } from "@skemya/ui";
import { ScrollArea } from "@skemya/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@skemya/ui";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  MapPin,
  ChevronDown,
  Circle,
  Square,
  Grid3X3,
  Star,
  ThumbsUp,
  Gauge,
  ListOrdered,
  PenTool,
  Upload,
  CreditCard,
  CalendarCheck,
  Code,
  Heading,
  Image,
  GitBranch,
  Blocks,
  Clock,
  Link,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import type { Block } from "@skemya/contracts";
import { LogicEditor } from "../logic/logic-editor";

const blockTypes = [
  { icon: Type, type: "short_text", label: "Short Text", category: "Text" },
  { icon: AlignLeft, type: "long_text", label: "Long Text", category: "Text" },
  { icon: Mail, type: "email", label: "Email", category: "Contact" },
  { icon: Phone, type: "phone", label: "Phone", category: "Contact" },
  { icon: Hash, type: "number", label: "Number", category: "Number" },
  { icon: CreditCard, type: "currency", label: "Currency", category: "Number" },
  { icon: Calendar, type: "date", label: "Date", category: "Date & Time" },
  { icon: Clock, type: "time", label: "Time", category: "Date & Time" },
  { icon: Link, type: "url", label: "URL", category: "Contact" },
  { icon: MapPin, type: "address", label: "Address", category: "Contact" },
  { icon: ChevronDown, type: "dropdown", label: "Dropdown", category: "Choice" },
  { icon: Circle, type: "select", label: "Select", category: "Choice" },
  { icon: Square, type: "checkboxGroup", label: "Checkbox Group", category: "Choice" },
  { icon: Grid3X3, type: "matrix", label: "Matrix", category: "Choice" },
  { icon: Star, type: "rating", label: "Rating", category: "Opinion" },
  { icon: ThumbsUp, type: "nps", label: "NPS", category: "Opinion" },
  { icon: Gauge, type: "scale", label: "Scale", category: "Opinion" },
  { icon: ListOrdered, type: "ranking", label: "Ranking", category: "Choice" },
  { icon: PenTool, type: "signature", label: "Signature", category: "Advanced" },
  { icon: Upload, type: "file_upload", label: "File Upload", category: "Advanced" },
  { icon: CreditCard, type: "payment", label: "Payment", category: "Advanced" },
  { icon: CalendarCheck, type: "scheduler", label: "Scheduler", category: "Advanced" },
  { icon: Code, type: "embed", label: "Embed", category: "Advanced" },
  { icon: Heading, type: "statement", label: "Statement", category: "Content" },
  { icon: Image, type: "image", label: "Image", category: "Content" },
];

const categories = [
  "Text",
  "Contact",
  "Number",
  "Date & Time",
  "Choice",
  "Opinion",
  "Advanced",
  "Content",
];

export function BlockLibrary() {
  const [activeTab, setActiveTab] = useState<"blocks" | "logic">("blocks");
  const { form, addBlock } = useFormBuilderStore();

  const handleAddBlock = (type: string) => {
    if (!form || !form.pages.length) return;

    const currentPage = form.pages[0]; // For now, add to first page
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: type as Block["type"],
      question: `New ${type.replace("_", " ")} question`,
      required: false,
    };

    addBlock(newBlock, currentPage.id);
  };

  return (
    <Card className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "blocks" | "logic")}
        className="flex-1 flex flex-col"
      >
        <div className="px-4 pt-4 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blocks" className="gap-2">
              <Blocks className="h-4 w-4" />
              Blocks
            </TabsTrigger>
            <TabsTrigger value="logic" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Logic
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="blocks" className="flex-1 mt-0">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Block Library</h3>
            <p className="text-sm text-muted-foreground">Drag or click to add</p>
          </div>
          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="p-4 space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">{category}</h4>
                  <div className="grid gap-2">
                    {blockTypes
                      .filter((block) => block.category === category)
                      .map((block) => (
                        <DraggableBlock
                          key={block.type}
                          block={block}
                          onAddBlock={handleAddBlock}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="logic" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <LogicEditor />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// Draggable block component
function DraggableBlock({
  block,
  onAddBlock,
}: {
  block: { icon: any; type: string; label: string; category: string };
  onAddBlock: (type: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${block.type}`,
    data: {
      source: "library",
      blockType: block.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = block.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={isDragging ? "opacity-50" : ""}
    >
      <Button
        variant="outline"
        className="w-full justify-start gap-2 h-auto py-3 cursor-move"
        onClick={() => onAddBlock(block.type)}
        {...attributes}
      >
        <div {...listeners} className="touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Icon className="h-4 w-4" />
        <span className="text-sm flex-1 text-left">{block.label}</span>
      </Button>
    </motion.div>
  );
}
