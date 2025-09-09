'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import type { Block } from '@forms/contracts';

const blockTypes = [
  { icon: Type, type: 'text', label: 'Short Text', category: 'Text' },
  { icon: AlignLeft, type: 'long_text', label: 'Long Text', category: 'Text' },
  { icon: Mail, type: 'email', label: 'Email', category: 'Contact' },
  { icon: Phone, type: 'phone', label: 'Phone', category: 'Contact' },
  { icon: Hash, type: 'number', label: 'Number', category: 'Number' },
  { icon: CreditCard, type: 'currency', label: 'Currency', category: 'Number' },
  { icon: Calendar, type: 'date', label: 'Date', category: 'Date & Time' },
  { icon: MapPin, type: 'address', label: 'Address', category: 'Contact' },
  { icon: ChevronDown, type: 'dropdown', label: 'Dropdown', category: 'Choice' },
  { icon: Circle, type: 'single_select', label: 'Single Select', category: 'Choice' },
  { icon: Square, type: 'multi_select', label: 'Multi Select', category: 'Choice' },
  { icon: Grid3X3, type: 'matrix', label: 'Matrix', category: 'Choice' },
  { icon: Star, type: 'rating', label: 'Rating', category: 'Opinion' },
  { icon: ThumbsUp, type: 'nps', label: 'NPS', category: 'Opinion' },
  { icon: Gauge, type: 'scale', label: 'Scale', category: 'Opinion' },
  { icon: ListOrdered, type: 'ranking', label: 'Ranking', category: 'Choice' },
  { icon: PenTool, type: 'signature', label: 'Signature', category: 'Advanced' },
  { icon: Upload, type: 'file_upload', label: 'File Upload', category: 'Advanced' },
  { icon: CreditCard, type: 'payment', label: 'Payment', category: 'Advanced' },
  { icon: CalendarCheck, type: 'scheduler', label: 'Scheduler', category: 'Advanced' },
  { icon: Code, type: 'embed', label: 'Embed', category: 'Advanced' },
  { icon: Heading, type: 'statement', label: 'Statement', category: 'Content' },
  { icon: Image, type: 'image', label: 'Image', category: 'Content' },
];

const categories = ['Text', 'Contact', 'Number', 'Date & Time', 'Choice', 'Opinion', 'Advanced', 'Content'];

export function BlockLibrary() {
  const { form, addBlock } = useFormBuilderStore();

  const handleAddBlock = (type: string) => {
    if (!form || !form.pages.length) return;

    const currentPage = form.pages[0]; // For now, add to first page
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: type as Block['type'],
      question: `New ${type.replace('_', ' ')} question`,
      required: false,
    };

    addBlock(currentPage.id, newBlock);
  };

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Block Library</h3>
        <p className="text-sm text-muted-foreground">Drag or click to add</p>
      </div>
      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">{category}</h4>
              <div className="grid gap-2">
                {blockTypes
                  .filter((block) => block.category === category)
                  .map((block) => {
                    const Icon = block.icon;
                    return (
                      <motion.div
                        key={block.type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-auto py-3"
                          onClick={() => handleAddBlock(block.type)}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{block.label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}