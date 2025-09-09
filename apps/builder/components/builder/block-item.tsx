'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  MoreVertical,
  Copy,
  Trash2,
  Settings,
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import type { Block } from '@forms/contracts';

const blockIcons: Record<string, any> = {
  text: Type,
  long_text: AlignLeft,
  email: Mail,
  phone: Phone,
  number: Hash,
  currency: CreditCard,
  date: Calendar,
  address: MapPin,
  dropdown: ChevronDown,
  single_select: Circle,
  multi_select: Square,
  matrix: Grid3X3,
  rating: Star,
  nps: ThumbsUp,
  scale: Gauge,
  ranking: ListOrdered,
  signature: PenTool,
  file_upload: Upload,
  payment: CreditCard,
  scheduler: CalendarCheck,
};

interface BlockItemProps {
  block: Block;
  pageId: string;
  index: number;
}

export function BlockItem({ block, pageId, index }: BlockItemProps) {
  const {
    selectBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    selectedBlockId,
  } = useFormBuilderStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: 'block',
      blockId: block.id,
      pageId,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = blockIcons[block.type] || Type;
  const isSelected = selectedBlockId === block.id;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card
        className={`p-4 cursor-pointer transition-colors ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => selectBlock(block.id)}
      >
        <div className="flex items-start gap-3">
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <Input
                value={block.question}
                onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                className="flex-1 border-0 p-0 h-auto text-base font-medium focus:ring-0"
                placeholder="Enter your question"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {block.description && (
              <p className="text-sm text-muted-foreground">{block.description}</p>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={block.required || false}
                  onCheckedChange={(checked) => updateBlock(block.id, { required: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label className="text-sm">Required</Label>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => selectBlock(block.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateBlock(block.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteBlock(block.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Block-specific preview */}
        {renderBlockPreview(block)}
      </Card>
    </motion.div>
  );
}

function renderBlockPreview(block: Block) {
  switch (block.type) {
    case 'single_select':
    case 'multi_select':
    case 'dropdown':
      return (
        <div className="mt-3 space-y-1">
          {block.options?.slice(0, 3).map((option, idx) => (
            <div key={idx} className="text-sm text-muted-foreground pl-8">
              • {option}
            </div>
          ))}
          {block.options && block.options.length > 3 && (
            <div className="text-sm text-muted-foreground pl-8">
              + {block.options.length - 3} more options
            </div>
          )}
        </div>
      );

    case 'scale':
    case 'rating':
      return (
        <div className="mt-3 pl-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>1</span>
            <div className="flex-1 h-1 bg-muted rounded-full" />
            <span>{block.max || 5}</span>
          </div>
        </div>
      );

    case 'text':
    case 'long_text':
    case 'email':
    case 'phone':
      return (
        <div className="mt-3 pl-8">
          <div className="h-8 bg-muted/50 rounded" />
        </div>
      );

    default:
      return null;
  }
}