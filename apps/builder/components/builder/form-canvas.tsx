'use client';

import { useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { BlockItem } from './block-item';
import { motion, AnimatePresence } from 'framer-motion';

export function FormCanvas() {
  const { form, addPage, movePage, moveBlock } = useFormBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!form) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No form selected</h3>
          <p className="text-muted-foreground">Create a new form or select an existing one</p>
        </div>
      </Card>
    );
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'block' && overData?.type === 'block') {
      moveBlock(
        activeData.blockId,
        overData.pageId,
        overData.index
      );
    }
  };

  return (
    <Card className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">{form.title}</h2>
          {form.description && (
            <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
          )}
        </div>

        <Tabs defaultValue={form.pages[0]?.id} className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <div className="flex items-center gap-2">
              <TabsList className="h-auto p-0 bg-transparent">
                {form.pages.map((page, index) => (
                  <TabsTrigger
                    key={page.id}
                    value={page.id}
                    className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {page.title || `Page ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addPage('New Page')}
                className="ml-2"
              >
                <Plus className="h-4 w-4" />
                Add Page
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {form.pages.map((page) => (
                <TabsContent key={page.id} value={page.id} className="m-0 h-full">
                  <div className="p-6 space-y-4 min-h-full">
                    <AnimatePresence>
                      {page.blocks.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg"
                        >
                          <div className="text-center">
                            <p className="text-muted-foreground mb-2">No blocks yet</p>
                            <p className="text-sm text-muted-foreground">
                              Add blocks from the library or drag them here
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <SortableContext
                          items={page.blocks.map(b => b.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {page.blocks.map((block, index) => (
                            <BlockItem
                              key={block.id}
                              block={block}
                              pageId={page.id}
                              index={index}
                            />
                          ))}
                        </SortableContext>
                      )}
                    </AnimatePresence>
                  </div>
                </TabsContent>
              ))}
            </DndContext>
          </div>
        </Tabs>
      </div>
    </Card>
  );
}