"use client";

import React, { useState } from "react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { FormPreview } from "../Preview/FormPreview";
import { CanvasToolbar } from "./CanvasToolbar";
import { ChooseBlockModal } from "../BlockLibrary/ChooseBlockModal";
import { PreviewModal } from "../Preview/PreviewModal";

interface FormCanvasProps {
  dropPosition: { overId: string; isAbove: boolean } | null;
  onOpenDesign?: () => void;
}

export function FormCanvas({ dropPosition, onOpenDesign }: FormCanvasProps) {
  const { form, addBlock } = useFormBuilderStore();
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!form) return null;

  const handleAddBlock = () => {
    setIsBlockModalOpen(true);
  };

  const handleSelectBlock = (blockType: string) => {
    // Add block to the first page at the end
    const firstPage = form.pages[0];
    if (firstPage) {
      const newBlock = {
        id: crypto.randomUUID(),
        type: blockType,
        question: `New ${blockType.replace(/_/g, " ")} question`,
        required: false,
      };
      addBlock(newBlock, firstPage.id, firstPage.blocks.length);
    }
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Canvas Toolbar */}
        <CanvasToolbar
          formId={form.id}
          onAddBlock={handleAddBlock}
          onOpenDesign={onOpenDesign}
          onOpenPreview={handleOpenPreview}
        />

        {/* Canvas Content with dotted border (matching YouForm) */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-2 sm:p-3 lg:p-4 flex flex-col min-h-0">
          <div className="w-full max-w-full mx-auto flex-1 flex flex-col min-h-0">
            {/* Canvas with dotted border - fixed height, scrolls internally without visible scrollbar */}
            <div className="border-2 border-dashed border-gray-300 rounded bg-white flex-1 shadow-sm overflow-y-auto min-h-0 scrollbar-none">
              <FormPreview />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChooseBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSelectBlock={handleSelectBlock}
      />

      <PreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        formId={form.id}
        mode="one-question"
      />
    </>
  );
}
