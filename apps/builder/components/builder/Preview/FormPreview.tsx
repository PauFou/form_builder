"use client";

import React from "react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import type { Block } from "@skemya/contracts";
import { toast } from "react-hot-toast";

export function FormPreview() {
  const { form, selectedBlockId, selectBlock } = useFormBuilderStore();

  if (!form || !form.pages?.[0]?.blocks?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-600">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Your form is empty</h2>
          <p className="text-lg">Add blocks from the left to get started</p>
        </div>
      </div>
    );
  }

  // Get the selected block or first block
  const blocks = form.pages[0].blocks;
  const currentBlockIndex = selectedBlockId ? blocks.findIndex((b) => b.id === selectedBlockId) : 0;
  const currentBlock = blocks[currentBlockIndex >= 0 ? currentBlockIndex : 0];

  if (!currentBlock) {
    return null;
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Show friendly toast notification
    toast("💡 To edit the content, use the properties panel on the right!", {
      duration: 3000,
      position: "top-center",
      style: {
        background: "#EEF2FF",
        color: "#4338CA",
        border: "1px solid #C7D2FE",
        padding: "16px",
        fontSize: "14px",
        fontWeight: "500",
      },
      icon: "✨",
    });
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((window as any).shakePropertyBox) {
      (window as any).shakePropertyBox("question");
    }
  };

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((window as any).shakePropertyBox) {
      (window as any).shakePropertyBox("description");
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((window as any).shakePropertyBox) {
      (window as any).shakePropertyBox("buttonText");
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-white p-12"
      onDoubleClick={handleDoubleClick}
    >
      {/* Main content */}
      <div className="w-full max-w-2xl text-center">
        {renderBlockContent(
          currentBlock,
          currentBlockIndex,
          blocks.length,
          handleTitleClick,
          handleDescriptionClick,
          handleButtonClick
        )}
      </div>
    </div>
  );
}

function renderBlockContent(
  block: Block,
  currentIndex: number,
  totalBlocks: number,
  onTitleClick: (e: React.MouseEvent) => void,
  onDescriptionClick: (e: React.MouseEvent) => void,
  onButtonClick: (e: React.MouseEvent) => void
) {
  const isLastBlock = currentIndex === totalBlocks - 1;
  const buttonText = block.buttonText || (isLastBlock ? "Submit" : "Let's start");

  // Simple default render for welcome screen style
  return (
    <div className="space-y-6">
      {/* Cover Image/Icon */}
      {block.coverImage && (
        <div className="flex justify-center mb-8">
          <img src={block.coverImage} alt="Cover" className="w-48 h-48 rounded-3xl object-cover" />
        </div>
      )}

      {/* Main Question/Title - Clickable */}
      <h1
        className="text-5xl font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
        onClick={onTitleClick}
      >
        {block.question || "Hey there 😊"}
      </h1>

      {/* Description - Clickable */}
      {block.description && (
        <div
          className="text-lg text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={onDescriptionClick}
          dangerouslySetInnerHTML={{ __html: block.description }}
        />
      )}

      {/* Button - Clickable */}
      <button
        className="mt-8 px-8 py-3 bg-slate-700 hover:bg-indigo-600 text-white rounded-md font-medium transition-colors text-base cursor-pointer"
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    </div>
  );
}
