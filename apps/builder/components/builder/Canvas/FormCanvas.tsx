"use client";

import React, { useState } from "react";
import { DragOverlay, pointerWithin, rectIntersection } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText } from "lucide-react";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@skemya/ui";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { PageView } from "./PageView";
import { BlockRenderer } from "./BlockRenderer";
// Use native crypto.randomUUID instead of uuid package

interface FormCanvasProps {
  dragState: {
    activeId: string | null;
    overId: string | null;
    draggedItem: any;
  };
}

export function FormCanvas({ dragState }: FormCanvasProps) {
  const { form, selectedPageId, selectPage, addPage } = useFormBuilderStore();

  if (!form) return null;

  const currentPageId = selectedPageId || form.pages[0]?.id;

  const handleAddPage = () => {
    const pageNumber = form.pages.length + 1;
    addPage(`Page ${pageNumber}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Tabs */}
      {form.pages.length > 1 && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4">
            <Tabs value={currentPageId} onValueChange={selectPage}>
              <div className="flex items-center justify-between py-2">
                <TabsList className="h-9">
                  {form.pages.map((page, index) => (
                    <TabsTrigger key={page.id} value={page.id} className="text-xs">
                      {page.title || `Page ${index + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <Button size="sm" variant="ghost" onClick={handleAddPage} className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Page
                </Button>
              </div>
            </Tabs>
          </div>
        </div>
      )}

      {/* Canvas Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl mx-auto py-8 px-4">
          <AnimatePresence mode="wait">
            {form.pages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: currentPageId === page.id ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: currentPageId === page.id ? "block" : "none" }}
              >
                <PageView page={page} isActive={currentPageId === page.id} dragState={dragState} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add page button when no pages */}
          {form.pages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first page to start building your form
              </p>
              <Button onClick={handleAddPage}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Page
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
