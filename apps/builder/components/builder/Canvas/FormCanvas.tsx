"use client";

import React, { useState } from "react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { FormPreview } from "../Preview/FormPreview";
import { CanvasToolbar } from "./CanvasToolbar";
import { ChooseBlockModal } from "../BlockLibrary/ChooseBlockModal";
import { PreviewModal } from "../Preview/PreviewModal";

interface FormCanvasProps {
  dropPosition: { overId: string; isAbove: boolean } | null;
}

export function FormCanvas({ dropPosition }: FormCanvasProps) {
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

  const handleOpenDesign = () => {
    // TODO: Implement design panel
    console.log("Open design panel");
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
          onOpenDesign={handleOpenDesign}
          onOpenPreview={handleOpenPreview}
        />

        {/* Canvas Content with dotted border (matching YouForm) */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Canvas with dotted border like YouForm */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white min-h-[600px] p-6">
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
