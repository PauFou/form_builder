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

  // Check if we're using split or wallpaper layout (they need full container)
  const layout = (currentBlock as any).layout || "stack";
  const needsFullContainer = layout === "split" || layout === "wallpaper";

  return (
    <div
      className={cn(
        "w-full h-full bg-white",
        needsFullContainer ? "" : "flex flex-col items-center justify-center p-8"
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Main content */}
      {needsFullContainer ? (
        renderBlockContent(
          currentBlock,
          currentBlockIndex,
          blocks.length,
          handleTitleClick,
          handleDescriptionClick,
          handleButtonClick
        )
      ) : (
        <div className="w-full max-w-3xl">
          {renderBlockContent(
            currentBlock,
            currentBlockIndex,
            blocks.length,
            handleTitleClick,
            handleDescriptionClick,
            handleButtonClick
          )}
        </div>
      )}
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

  // Get text alignment (default to center)
  const textAlign = (block as any).textAlign || "center";
  const alignmentClass =
    textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : "text-center";

  // Get layout settings
  const layout = (block as any).layout || "stack";
  const imagePosition = (block as any).imagePosition || "left";

  // Render block-specific fields
  const renderBlockFields = () => {
    switch (block.type) {
      case "contact_info":
        // Get field settings from block
        const fields = (block as any).contactFields || {
          firstName: { label: "First Name", placeholder: "John", visible: true, required: false },
          lastName: { label: "Last Name", placeholder: "Doe", visible: true, required: false },
          email: {
            label: "Email",
            placeholder: "john@example.com",
            visible: true,
            required: false,
          },
          phone: {
            label: "Phone Number",
            placeholder: "(201) 555-0123",
            visible: true,
            required: false,
          },
          company: { label: "Company", placeholder: "Acme Inc", visible: true, required: false },
        };

        // Check visibility for each row
        const row1Visible = fields.firstName.visible || fields.lastName.visible;
        const row2Visible = fields.email.visible || fields.phone.visible;
        const row1BothVisible = fields.firstName.visible && fields.lastName.visible;
        const row2BothVisible = fields.email.visible && fields.phone.visible;

        // In split layout, don't use mx-auto px-12 (parent already has padding)
        const isSplitLayout = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayout
          ? "space-y-5 w-full pointer-events-none select-none text-left"
          : "space-y-5 w-full max-w-xl mx-auto px-12 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            {/* Row 1: First Name + Last Name */}
            {row1Visible && (
              <div className={cn("grid gap-4", row1BothVisible ? "grid-cols-2" : "grid-cols-1")}>
                {fields.firstName.visible && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      {fields.firstName.label}
                      {fields.firstName.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="w-full px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base text-left">
                      {fields.firstName.placeholder}
                    </div>
                  </div>
                )}
                {fields.lastName.visible && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      {fields.lastName.label}
                      {fields.lastName.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="w-full px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base text-left">
                      {fields.lastName.placeholder}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 2: Email + Phone */}
            {row2Visible && (
              <div className={cn("grid gap-4", row2BothVisible ? "grid-cols-2" : "grid-cols-1")}>
                {fields.email.visible && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      {fields.email.label}
                      {fields.email.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="w-full px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base text-left">
                      {fields.email.placeholder}
                    </div>
                  </div>
                )}
                {fields.phone.visible && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      {fields.phone.label}
                      {fields.phone.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="w-full px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base text-left">
                      {fields.phone.placeholder}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 3: Company (full width) */}
            {fields.company.visible && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  {fields.company.label}
                  {fields.company.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="w-full px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base text-left">
                  {fields.company.placeholder}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Special handling for contact_info: title, description, and button aligned with fields
  const isContactInfo = block.type === "contact_info";
  const isSplitLayout = layout === "split" && block.coverImage;

  // Render text content
  const textContent = (
    <>
      {/* Main Question/Title - Clickable */}
      <h1
        className={cn(
          "text-2xl font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors leading-tight",
          isContactInfo && !isSplitLayout && "w-full max-w-xl mx-auto px-12 text-left"
        )}
        onClick={onTitleClick}
      >
        {block.question || "Hey there 😊"}
      </h1>

      {/* Description - Clickable */}
      {block.description && (
        <div
          className={cn(
            "text-base text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors leading-relaxed",
            isContactInfo && !isSplitLayout && "w-full max-w-xl mx-auto px-12 text-left"
          )}
          onClick={onDescriptionClick}
          dangerouslySetInnerHTML={{ __html: block.description }}
        />
      )}

      {/* Block-specific fields */}
      {renderBlockFields()}

      {/* Button - Clickable */}
      <div
        className={cn(
          "mt-10",
          isContactInfo && !isSplitLayout
            ? "w-full max-w-xl mx-auto px-12 flex justify-start"
            : textAlign === "left"
              ? "flex justify-start"
              : textAlign === "right"
                ? "flex justify-end"
                : "flex justify-center"
        )}
      >
        <button
          className="inline-flex items-center justify-center px-5 py-2.5 h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-1 cursor-pointer"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </>
  );

  // WALLPAPER LAYOUT
  if (layout === "wallpaper" && block.coverImage) {
    return (
      <div
        className="relative w-full h-full flex items-center justify-center p-8"
        style={{
          backgroundImage: `url(${block.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Content with white text */}
        <div className={cn("relative z-10 w-full max-w-3xl space-y-6", alignmentClass)}>
          <h1
            className="text-2xl font-semibold text-white cursor-pointer hover:text-indigo-200 transition-colors leading-tight drop-shadow-lg"
            onClick={onTitleClick}
          >
            {block.question || "Hey there 😊"}
          </h1>

          {block.description && (
            <div
              className="text-base text-white cursor-pointer hover:text-indigo-200 transition-colors leading-relaxed drop-shadow-lg"
              onClick={onDescriptionClick}
              dangerouslySetInnerHTML={{ __html: block.description }}
            />
          )}

          <div
            className={cn(
              "mt-10",
              textAlign === "left"
                ? "flex justify-start"
                : textAlign === "right"
                  ? "flex justify-end"
                  : "flex justify-center"
            )}
          >
            <button
              className="inline-flex items-center justify-center px-5 py-2.5 h-11 bg-white hover:bg-gray-100 text-gray-900 text-base font-medium rounded transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 cursor-pointer"
              onClick={onButtonClick}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SPLIT LAYOUT
  if (layout === "split" && block.coverImage) {
    // For split layout, use different alignment (no mx-auto for contact_info)
    const splitAlignmentClass = isContactInfo ? "text-left" : alignmentClass;

    return (
      <div className="flex items-stretch h-full w-full">
        {/* Left side - Image or Content */}
        {imagePosition === "left" ? (
          <>
            <div className="w-1/2 flex-shrink-0">
              <img src={block.coverImage} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div
              className={cn(
                "w-1/2 flex flex-col justify-center p-12 space-y-6",
                splitAlignmentClass
              )}
            >
              {textContent}
            </div>
          </>
        ) : (
          <>
            <div
              className={cn(
                "w-1/2 flex flex-col justify-center p-12 space-y-6",
                splitAlignmentClass
              )}
            >
              {textContent}
            </div>
            <div className="w-1/2 flex-shrink-0">
              <img src={block.coverImage} alt="Cover" className="w-full h-full object-cover" />
            </div>
          </>
        )}
      </div>
    );
  }

  // STACK LAYOUT (default)
  return (
    <div className={cn("space-y-6", alignmentClass)}>
      {/* Cover Image/Icon */}
      {block.coverImage && (
        <div
          className={cn(
            "flex mb-8",
            textAlign === "left"
              ? "justify-start"
              : textAlign === "right"
                ? "justify-end"
                : "justify-center"
          )}
        >
          <img src={block.coverImage} alt="Cover" className="w-40 h-40 rounded object-cover" />
        </div>
      )}

      {textContent}
    </div>
  );
}
