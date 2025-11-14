"use client";

import React from "react";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import type { Block } from "@skemya/contracts";

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
  const currentBlockIndex = selectedBlockId
    ? blocks.findIndex((b) => b.id === selectedBlockId)
    : 0;
  const currentBlock = blocks[currentBlockIndex >= 0 ? currentBlockIndex : 0];

  if (!currentBlock) {
    return null;
  }

  const handleBlockClick = () => {
    selectBlock(currentBlock.id);
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-white p-12 cursor-pointer"
      onClick={handleBlockClick}
    >
      {/* Main content */}
      <div className="w-full max-w-2xl text-center">
        {renderBlockContent(currentBlock, currentBlockIndex, blocks.length)}
      </div>
    </div>
  );
}

function renderBlockContent(block: Block, currentIndex: number, totalBlocks: number) {
  const isLastBlock = currentIndex === totalBlocks - 1;
  const buttonText = block.buttonText || (isLastBlock ? "Submit" : "Let's start");

  // Simple default render for welcome screen style
  return (
    <div className="space-y-6">
      {/* Cover Image/Icon */}
      {block.coverImage && (
        <div className="flex justify-center mb-8">
          <img
            src={block.coverImage}
            alt="Cover"
            className="w-48 h-48 rounded-3xl object-cover"
          />
        </div>
      )}

      {/* Main Question/Title */}
      <h1 className="text-5xl font-bold text-gray-900">
        {block.question || "Hey there 😊"}
      </h1>

      {/* Description */}
      {block.description && (
        <p className="text-lg text-gray-600">
          {block.description}
        </p>
      )}

      {/* Button */}
      <button className="mt-8 px-8 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-md font-medium transition-colors text-base">
        {buttonText}
      </button>
    </div>
  );
}
