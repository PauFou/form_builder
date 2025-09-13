"use client";

import { Card, CardContent, Button, ScrollArea, Input } from "@forms/ui";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { BlockItem } from "./block-item";
import { PageNavigation } from "./page-navigation";
import { motion, AnimatePresence } from "framer-motion";

export function Canvas() {
  const { form, updateForm, addBlock, selectedPageId } = useFormBuilderStore();
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
    data: { type: "canvas" },
  });

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-muted-foreground">No form selected</p>
      </div>
    );
  }

  const currentPage = form.pages.find((p) => p.id === selectedPageId) || form.pages[0];
  const blocks = currentPage?.blocks || [];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b p-6">
        <div className="max-w-3xl mx-auto">
          <Input
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
            placeholder="Untitled form"
          />
          <textarea
            value={form.description || ""}
            onChange={(e) => updateForm({ description: e.target.value })}
            className="w-full mt-2 text-muted-foreground border-0 p-0 resize-none focus:outline-none"
            placeholder="Add a description for your form..."
            rows={2}
          />
        </div>
      </div>

      {form.pages.length > 1 && (
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto">
            <PageNavigation />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6">
          <div
            ref={setNodeRef}
            className={`min-h-[400px] space-y-4 rounded-lg transition-all ${
              isOver ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
          >
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {blocks.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        Drop blocks here to start building your form
                      </p>
                      <Button
                        onClick={() => {
                          const newBlock = {
                            id: crypto.randomUUID(),
                            type: "short_text" as const,
                            question: "",
                            required: false,
                          };
                          addBlock(newBlock, currentPage.id);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Block
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  blocks.map((block, index) => (
                    <BlockItem key={block.id} block={block} pageId={currentPage.id} index={index} />
                  ))
                )}
              </AnimatePresence>
            </SortableContext>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
