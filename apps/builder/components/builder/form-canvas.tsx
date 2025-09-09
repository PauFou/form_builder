'use client';

import { useEffect, useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, Button, Tabs, TabsContent, TabsList, TabsTrigger, cn } from '@forms/ui';
import { Plus, FileText } from 'lucide-react';
import { useFormBuilderStore } from '../../lib/stores/form-builder-store';
import { BlockItem } from './block-item';
import { motion, AnimatePresence } from 'framer-motion';

export function FormCanvas() {
  const { form, addPage, addBlock, moveBlock, selectedPageId } = useFormBuilderStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle adding new blocks from library
    if (activeData?.source === 'library' && overData?.type === 'dropzone') {
      const newBlock = {
        id: crypto.randomUUID(),
        type: activeData.blockType,
        question: '',
        required: false,
      };
      addBlock(newBlock, overData.pageId, overData.index);
    }
    // Handle reordering existing blocks
    else if (activeData?.type === 'block' && overData?.type === 'block') {
      moveBlock(
        activeData.blockId,
        overData.pageId,
        overData.index
      );
    }
    // Handle moving block to empty dropzone
    else if (activeData?.type === 'block' && overData?.type === 'dropzone') {
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
          <input
            type="text"
            value={form.title || ''}
            onChange={(e) => useFormBuilderStore.getState().updateForm({ title: e.target.value })}
            className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 w-full"
            placeholder="Untitled Form"
          />
          <input
            type="text"
            value={form.description || ''}
            onChange={(e) => useFormBuilderStore.getState().updateForm({ description: e.target.value })}
            className="text-sm text-muted-foreground bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 mt-1 w-full"
            placeholder="Add a description..."
          />
        </div>

        <Tabs 
          value={selectedPageId || form.pages[0]?.id}
          onValueChange={(value) => useFormBuilderStore.getState().selectPage?.(value)}
          className="flex-1 flex flex-col"
        >
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
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {form.pages.map((page) => (
                <TabsContent key={page.id} value={page.id} className="m-0 h-full">
                  <div className="p-6 space-y-4 min-h-full">
                    <AnimatePresence>
                      {page.blocks.length === 0 ? (
                        <Dropzone
                          pageId={page.id}
                          index={0}
                          isActive={overId === `${page.id}-dropzone-0`}
                          isEmpty
                        />
                      ) : (
                        <SortableContext
                          items={page.blocks.map(b => b.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-4">
                            {/* Initial dropzone */}
                            <Dropzone
                              pageId={page.id}
                              index={0}
                              isActive={overId === `${page.id}-dropzone-0`}
                            />
                            
                            {page.blocks.map((block, index) => (
                              <div key={block.id} className="space-y-4">
                                <BlockItem
                                  block={block}
                                  pageId={page.id}
                                  index={index}
                                />
                                
                                {/* Dropzone after each block */}
                                <Dropzone
                                  pageId={page.id}
                                  index={index + 1}
                                  isActive={overId === `${page.id}-dropzone-${index + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      )}
                    </AnimatePresence>
                  </div>
                </TabsContent>
              ))}
              
              {/* Drag overlay for visual feedback */}
              <DragOverlay>
                {activeId && (
                  <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 shadow-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </Tabs>
      </div>
    </Card>
  );
}

// Dropzone component for drag and drop
function Dropzone({ 
  pageId, 
  index, 
  isActive,
  isEmpty = false 
}: { 
  pageId: string; 
  index: number; 
  isActive: boolean;
  isEmpty?: boolean;
}) {
  const dropzoneId = `${pageId}-dropzone-${index}`;
  
  const { setNodeRef } = useDroppable({
    id: dropzoneId,
    data: {
      type: 'dropzone',
      pageId,
      index,
    },
  });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all duration-200",
        isEmpty ? "h-64" : "h-8",
        isActive && "h-20"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 transition-all duration-200",
          isEmpty
            ? "border-dashed border-muted-foreground/30 bg-muted/20"
            : isActive
            ? "border-dashed border-primary bg-primary/5"
            : "border-transparent"
        )}
      >
        {isEmpty && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No blocks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag blocks from the library or click to add
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}