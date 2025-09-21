"use client";

import { useDraggable } from "@dnd-kit/core";
import { Button, cn } from "@skemya/ui";
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
  Clock,
  Link,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";

const blockCategories = [
  {
    name: "Basic",
    blocks: [
      { icon: Type, type: "short_text", label: "Short Text" },
      { icon: AlignLeft, type: "long_text", label: "Long Text" },
      { icon: Hash, type: "number", label: "Number" },
      { icon: Heading, type: "statement", label: "Statement" },
    ],
  },
  {
    name: "Contact",
    blocks: [
      { icon: Mail, type: "email", label: "Email" },
      { icon: Phone, type: "phone", label: "Phone" },
      { icon: Link, type: "url", label: "URL" },
      { icon: MapPin, type: "address", label: "Address" },
    ],
  },
  {
    name: "Choice",
    blocks: [
      { icon: ChevronDown, type: "dropdown", label: "Dropdown" },
      { icon: Circle, type: "select", label: "Single Choice" },
      { icon: Square, type: "checkboxGroup", label: "Multiple Choice" },
      { icon: Grid3X3, type: "matrix", label: "Matrix" },
      { icon: ListOrdered, type: "ranking", label: "Ranking" },
    ],
  },
  {
    name: "Date & Time",
    blocks: [
      { icon: Calendar, type: "date", label: "Date" },
      { icon: Clock, type: "time", label: "Time" },
      { icon: CalendarCheck, type: "scheduler", label: "Scheduler" },
    ],
  },
  {
    name: "Rating",
    blocks: [
      { icon: Star, type: "rating", label: "Rating" },
      { icon: ThumbsUp, type: "nps", label: "NPS Score" },
      { icon: Gauge, type: "scale", label: "Scale" },
    ],
  },
  {
    name: "Advanced",
    blocks: [
      { icon: PenTool, type: "signature", label: "Signature" },
      { icon: Upload, type: "file_upload", label: "File Upload" },
      { icon: CreditCard, type: "payment", label: "Payment" },
      { icon: Image, type: "image", label: "Image" },
    ],
  },
];

export function DraggableBlockLibrary() {
  return (
    <div className="p-4 space-y-6">
      {blockCategories.map((category, categoryIndex) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: categoryIndex * 0.05 }}
        >
          <h4 className="text-sm font-medium text-muted-foreground mb-3">{category.name}</h4>
          <div className="grid gap-2">
            {category.blocks.map((block) => (
              <DraggableBlock key={block.type} block={block} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function DraggableBlock({ block }: { block: { icon: any; type: string; label: string } }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${block.type}`,
    data: { source: "library", blockType: block.type },
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
      className={cn(isDragging && "opacity-50 z-50")}
    >
      <Button
        variant="outline"
        className="w-full justify-start h-auto py-3 px-3 cursor-move hover:bg-accent"
        {...attributes}
      >
        <div {...listeners} className="mr-2 touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Icon className="h-4 w-4 mr-3" />
        <span className="flex-1 text-left">{block.label}</span>
      </Button>
    </motion.div>
  );
}
