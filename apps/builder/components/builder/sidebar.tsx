"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Button,
} from "@forms/ui";
import {
  Type,
  Mail,
  Phone,
  Calendar,
  Hash,
  DollarSign,
  Link,
  MapPin,
  Search,
  FileText,
  ToggleLeft,
  ChevronDown,
  Radio,
  CheckSquare,
  Grid3x3,
  Star,
  Gauge,
  Ruler,
  List,
  FileSignature,
  Upload,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { useDraggable } from "@dnd-kit/core";

const BLOCK_TYPES = {
  basic: [
    { type: "short_text", label: "Short Text", icon: Type },
    { type: "long_text", label: "Long Text", icon: FileText },
    { type: "number", label: "Number", icon: Hash },
    { type: "date", label: "Date", icon: Calendar },
  ],
  contact: [
    { type: "email", label: "Email", icon: Mail },
    { type: "phone", label: "Phone", icon: Phone },
    { type: "url", label: "URL", icon: Link },
    { type: "address", label: "Address", icon: MapPin },
  ],
  choice: [
    { type: "select", label: "Dropdown", icon: ChevronDown },
    { type: "radio", label: "Radio", icon: Radio },
    { type: "checkbox", label: "Checkbox", icon: CheckSquare },
    { type: "matrix", label: "Matrix", icon: Grid3x3 },
  ],
  advanced: [
    { type: "rating", label: "Rating", icon: Star },
    { type: "nps", label: "NPS", icon: Gauge },
    { type: "scale", label: "Scale", icon: Ruler },
    { type: "ranking", label: "Ranking", icon: List },
    { type: "signature", label: "Signature", icon: FileSignature },
    { type: "file_upload", label: "File Upload", icon: Upload },
    { type: "payment", label: "Payment", icon: CreditCard },
    { type: "scheduler", label: "Scheduler", icon: CalendarDays },
  ],
};

function DraggableBlock({ block }: { block: any }) {
  const { addBlock, selectedPageId } = useFormBuilderStore();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `new-${block.type}`,
    data: { type: block.type },
  });

  const Icon = block.icon;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      draggable
      onClick={() => {
        if (selectedPageId) {
          const newBlock = {
            id: crypto.randomUUID(),
            type: block.type,
            question: "",
            required: false,
          };
          addBlock(newBlock, selectedPageId);
        }
      }}
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
      role="button"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{block.label}</span>
    </div>
  );
}

export function Sidebar() {
  const [search, setSearch] = useState("");
  const { selectedPageId } = useFormBuilderStore();

  const filterBlocks = (blocks: any[]) => {
    if (!search) return blocks;
    return blocks.filter((block) => block.label.toLowerCase().includes(search.toLowerCase()));
  };

  const hasResults = Object.values(BLOCK_TYPES).some((blocks) => filterBlocks(blocks).length > 0);

  return (
    <div className="border-r h-full">
      <Tabs defaultValue="blocks" className="h-full">
        <div className="p-4 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blocks">Blocks</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="blocks" className="m-0 h-[calc(100%-88px)]">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-88px)]">
            <div className="px-4 pb-4 space-y-6">
              {!hasResults && (
                <p className="text-center text-muted-foreground py-8">No blocks found</p>
              )}

              {Object.entries(BLOCK_TYPES).map(([category, blocks]) => {
                const filtered = filterBlocks(blocks);
                if (filtered.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="font-medium text-sm mb-3 capitalize">{category}</h3>
                    <div className="grid gap-2">
                      {filtered.map((block) => (
                        <DraggableBlock key={block.type} block={block} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="pages" className="p-4">
          <p className="text-muted-foreground">Page management coming soon</p>
        </TabsContent>

        <TabsContent value="theme" className="p-4">
          <p className="text-muted-foreground">Theme customization coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
