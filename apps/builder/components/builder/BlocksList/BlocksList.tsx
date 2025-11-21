"use client";

import React, { useState } from "react";
import {
  Plus,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  MapPin,
  ChevronDown,
  CheckSquare,
  Circle,
  Star,
  Upload,
  CreditCard,
  Users,
  MessageSquare,
  Settings,
  Copy,
  Trash2,
  List,
} from "lucide-react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import { AddBlockModal } from "./AddBlockModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@skemya/ui";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Icon mapping for block types
const blockIcons: Record<string, React.ComponentType<any>> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  phone: Phone,
  phone_number: Phone,
  number: Hash,
  date: Calendar,
  address: MapPin,
  dropdown: ChevronDown,
  multi_select: CheckSquare,
  single_select: Circle,
  star_rating: Star,
  rating: Star,
  nps: Star,
  opinion_scale: Star,
  file_upload: Upload,
  payment: CreditCard,
  contact_info: Users,
  statement: MessageSquare,
  matrix: CheckSquare,
  ranking: List,
};

interface SortableBlockItemProps {
  block: any;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableBlockItem({
  block,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = blockIcons[block.type] || MessageSquare;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full rounded border transition-colors flex items-center group relative",
        isSelected
          ? "bg-indigo-50 border-indigo-200 shadow-sm"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      )}
    >
      {/* Draggable content - full width */}
      <div
        {...attributes}
        {...listeners}
        onClick={onSelect}
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-grab active:cursor-grabbing w-full"
      >
        <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span
          className={cn(
            "text-xs flex-1 truncate",
            isSelected ? "text-gray-900 font-medium" : "text-gray-700"
          )}
        >
          {index + 1}. {block.question || `${block.type} block`}
        </span>
      </div>

      {/* Three dots menu - absolute positioned */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-indigo-50 data-[state=open]:text-indigo-600"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            className="min-w-[140px] rounded shadow-md border-gray-300 py-1"
            sideOffset={4}
            avoidCollisions={true}
          >
            <DropdownMenuItem
              onClick={onDuplicate}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2 text-gray-500" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function BlocksList() {
  const { form, selectedBlockId, selectBlock, addBlock, moveBlock, deleteBlock } =
    useFormBuilderStore();
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState<any>(null);

  // Get blocks from the first page
  const blocks = form?.pages?.[0]?.blocks || [];
  const pageId = form?.pages?.[0]?.id;

  const handleDuplicateBlock = (block: any) => {
    if (!pageId) return;
    const duplicatedBlock = {
      ...block,
      id: crypto.randomUUID(),
      question: `${block.question} (copy)`,
    };
    const blockIndex = blocks.findIndex((b: any) => b.id === block.id);
    addBlock(duplicatedBlock, pageId, blockIndex + 1);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (confirm("Are you sure you want to delete this block?")) {
      deleteBlock(blockId);
    }
  };

  const handleSelectBlock = (blockType: string) => {
    if (form?.pages?.[0]) {
      const newBlock = {
        id: crypto.randomUUID(),
        type: blockType,
        question: getDefaultQuestion(blockType),
        description: "",
        required: false,
        key: blockType.replace(/_/g, "-"),
      };
      addBlock(newBlock as any, form.pages[0].id);
      setIsAddBlockModalOpen(false);
    }
  };

  const getDefaultQuestion = (type: string): string => {
    const questionMap: Record<string, string> = {
      contact_info: "Please fill in your contact information",
      short_text: "What's your name?",
      long_text: "Tell us more about yourself",
      phone_number: "What's your phone number?",
      statement: "Welcome to our survey!",
      number: "How many?",
      website_url: "What's your website?",
      single_select: "Choose one option",
      multi_select: "Select all that apply",
      dropdown: "Select from dropdown",
      date: "Pick a date",
      address: "What's your address?",
      scheduler: "Schedule a meeting",
      star_rating: "Rate your experience",
      opinion_scale: "How likely are you to recommend us?",
      ranking: "Rank the following",
      signature: "Please sign here",
      file_upload: "Upload your files",
      payment: "Payment details",
      matrix: "Matrix question",
      nps: "How likely are you to recommend us to a friend?",
    };
    return questionMap[type] || "New question";
  };

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
    const block = blocks.find((b: any) => b.id === event.active.id);
    setActiveBlock(block);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    // Allow drag anywhere but only process drop if over a valid target
    if (!over || !pageId) {
      // Dragged outside or no valid drop target - do nothing
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((block: any) => block.id === active.id);
      const newIndex = blocks.findIndex((block: any) => block.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        moveBlock(active.id as string, pageId, newIndex);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Blocks Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900">Blocks</h4>
              <button
                onClick={() => setIsAddBlockModalOpen(true)}
                className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Block List with Drag & Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              autoScroll={false}
            >
              <SortableContext
                items={blocks.map((b: any) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                  {blocks.map((block: any, index: number) => (
                    <SortableBlockItem
                      key={block.id}
                      block={block}
                      index={index}
                      isSelected={block.id === selectedBlockId}
                      onSelect={() => selectBlock(block.id)}
                      onDuplicate={() => handleDuplicateBlock(block)}
                      onDelete={() => handleDeleteBlock(block.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay - follows cursor anywhere */}
              <DragOverlay dropAnimation={null}>
                {activeBlock ? (
                  <div className="w-[246px] rounded border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      {(() => {
                        const Icon = blockIcons[activeBlock.type] || MessageSquare;
                        return <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />;
                      })()}
                      <span className="text-xs text-gray-700 truncate flex-1">
                        {blocks.findIndex((b: any) => b.id === activeBlock.id) + 1}.{" "}
                        {activeBlock.question || `${activeBlock.type} block`}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={isAddBlockModalOpen}
        onClose={() => setIsAddBlockModalOpen(false)}
        onSelectBlock={handleSelectBlock}
      />
    </>
  );
}
