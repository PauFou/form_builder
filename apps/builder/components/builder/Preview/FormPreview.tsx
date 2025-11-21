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
  // Only use full container if layout is split/wallpaper AND there's actually a cover image
  const layout = (currentBlock as any).layout || "stack";
  const hasCoverImage = !!(currentBlock as any).coverImage;
  const needsFullContainer = hasCoverImage && (layout === "split" || layout === "wallpaper");

  return (
    <div
      className={cn(
        "w-full min-h-full bg-white",
        needsFullContainer ? "" : "flex flex-col items-center py-12 px-8"
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
      case "contact_info": {
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
          : "space-y-5 w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

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
      }

      case "text":
      case "short_text": {
        const placeholder = (block as any).placeholder || "Type your answer here...";

        // In split layout, don't use mx-auto px-12 (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="w-full px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base text-left">
              {placeholder}
            </div>
          </div>
        );
      }

      case "long_text": {
        const placeholder = (block as any).placeholder || "Type your answer here...";
        const textBoxSize = (block as any).textBoxSize || "small";
        const maxCharacters = (block as any).maxChars; // Use maxChars to match PropertiesPanel

        // Determine height based on size
        const heightClass =
          textBoxSize === "large"
            ? "min-h-[200px]"
            : textBoxSize === "medium"
              ? "min-h-[120px]"
              : "min-h-[80px]";

        // In split layout, don't use mx-auto px-12 (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div
              className={cn(
                "w-full px-3 py-2.5 border border-gray-300 rounded text-gray-400 text-base text-left",
                heightClass
              )}
            >
              {placeholder}
            </div>
            {/* Character counter - only shown if maxCharacters is set */}
            {maxCharacters && (
              <div className="text-right mt-1">
                <span className="text-xs text-gray-400">0 / {maxCharacters}</span>
              </div>
            )}
          </div>
        );
      }

      case "phone":
      case "phone_number": {
        const defaultCountry = (block as any).defaultCountry || "FR";

        // Country data with flags and formats
        const countryData: Record<string, { flag: string; code: string; format: string }> = {
          FR: { flag: "🇫🇷", code: "+33", format: "6 12 34 56 78" },
          US: { flag: "🇺🇸", code: "+1", format: "(555) 123-4567" },
          GB: { flag: "🇬🇧", code: "+44", format: "7911 123456" },
          DE: { flag: "🇩🇪", code: "+49", format: "170 1234567" },
          ES: { flag: "🇪🇸", code: "+34", format: "612 345 678" },
          IT: { flag: "🇮🇹", code: "+39", format: "312 345 6789" },
          BE: { flag: "🇧🇪", code: "+32", format: "470 12 34 56" },
          CH: { flag: "🇨🇭", code: "+41", format: "78 123 45 67" },
          CA: { flag: "🇨🇦", code: "+1", format: "(555) 123-4567" },
          AU: { flag: "🇦🇺", code: "+61", format: "412 345 678" },
          NL: { flag: "🇳🇱", code: "+31", format: "6 12345678" },
          PT: { flag: "🇵🇹", code: "+351", format: "912 345 678" },
          BR: { flag: "🇧🇷", code: "+55", format: "11 91234-5678" },
          JP: { flag: "🇯🇵", code: "+81", format: "90-1234-5678" },
          CN: { flag: "🇨🇳", code: "+86", format: "131 2345 6789" },
          IN: { flag: "🇮🇳", code: "+91", format: "98765 43210" },
        };

        const country = countryData[defaultCountry] || countryData.FR;

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="flex items-center gap-2 max-w-[280px]">
              {/* Country selector */}
              <div className="flex items-center gap-1.5 px-3 py-2.5 border-b-2 border-gray-300 bg-gray-50 rounded-t">
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm text-gray-600">{country.code}</span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {/* Phone input */}
              <div className="flex-1 px-0 py-2.5 border-b-2 border-gray-300 text-gray-400 text-base">
                {country.format}
              </div>
            </div>
          </div>
        );
      }

      case "website":
      case "website_url": {
        const placeholder = (block as any).placeholder || "https://";

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="flex items-center gap-2 border-b-2 border-gray-300 py-2.5 max-w-sm">
              {/* Link icon */}
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {/* URL input placeholder */}
              <span className="text-gray-400 text-base">{placeholder}</span>
            </div>
          </div>
        );
      }

      case "number": {
        const placeholder = (block as any).placeholder || "0";

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="border-b-2 border-gray-300 py-2.5 max-w-[280px]">
              <span className="text-gray-400 text-base">{placeholder}</span>
            </div>
          </div>
        );
      }

      case "single_select":
      case "multi_select": {
        const options = (block as any).options || [
          { id: "1", label: "Option 1" },
          { id: "2", label: "Option 2" },
        ];
        const horizontalAlign = (block as any).horizontalAlign || false;
        const columnsDesktop = (block as any).columnsDesktop || 2;
        const allowOther = (block as any).allowOther || false;
        const randomize = (block as any).randomize || false;

        // Shuffle options if randomize is enabled (using a seeded shuffle for preview consistency)
        let displayOptions = [...options];
        if (randomize) {
          // Simple shuffle for preview
          displayOptions = displayOptions.sort(() => 0.5 - Math.random());
        }

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        // All options with same width - inline-grid with 1fr columns
        // The inline-grid takes only the width of its content while 1fr ensures equal column widths
        return (
          <div className={containerClasses}>
            <div
              className="inline-grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${horizontalAlign ? columnsDesktop : 1}, 1fr)`,
              }}
            >
              {displayOptions.map((option: any, index: number) => (
                <div
                  key={option.id || index}
                  className={`flex ${option.image ? "flex-col" : "flex-row items-center"} gap-2 px-5 py-2.5 border border-gray-200 rounded bg-white hover:border-indigo-400 transition-colors`}
                >
                  {/* Option image */}
                  {option.image && (
                    <div className="flex justify-center">
                      <img
                        src={option.image}
                        alt={option.label}
                        className="max-w-full max-h-40 object-contain rounded"
                      />
                    </div>
                  )}
                  <span
                    className="text-gray-700 text-sm"
                    style={{ hyphens: "auto", wordBreak: "break-word" }}
                    lang="fr"
                  >
                    {option.label}
                  </span>
                </div>
              ))}
              {/* "Other" option - shown at the end if enabled */}
              {allowOther && (
                <div className="flex flex-col gap-2 px-5 py-2.5 border border-gray-200 rounded bg-white hover:border-indigo-400 transition-colors">
                  <span className="text-gray-700 text-sm">Other</span>
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="w-full px-0 py-1 border-0 border-b border-gray-300 text-sm text-gray-400 bg-transparent focus:outline-none"
                    disabled
                  />
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Special handling for blocks that need left alignment: contact_info, short_text, long_text, phone
  const isContactInfo = block.type === "contact_info";
  const isShortText = block.type === "text" || block.type === "short_text";
  const isLongText = block.type === "long_text";
  const isPhone = block.type === "phone" || block.type === "phone_number";
  const isWebsite = block.type === "website" || block.type === "website_url";
  const isNumber = block.type === "number";
  const isSingleSelect = block.type === "single_select";
  const isMultiSelect = block.type === "multi_select";
  const isSelectBlock = isSingleSelect || isMultiSelect;
  const needsLeftAlignment =
    isContactInfo || isShortText || isLongText || isPhone || isWebsite || isNumber || isSelectBlock;
  const isSplitLayout = layout === "split" && block.coverImage;

  // Render text content
  const textContent = (
    <>
      {/* Main Question/Title - Clickable */}
      <h1
        className={cn(
          "text-3xl font-normal text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors leading-tight",
          needsLeftAlignment && !isSplitLayout && "w-full max-w-2xl mx-auto px-8 text-left"
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
            needsLeftAlignment && !isSplitLayout && "w-full max-w-2xl mx-auto px-8 text-left"
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
          needsLeftAlignment && !isSplitLayout
            ? "w-full max-w-2xl mx-auto px-8 flex justify-start"
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
            className="text-3xl font-normal text-white cursor-pointer hover:text-indigo-200 transition-colors leading-tight drop-shadow-lg"
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
    // For split layout, use different alignment (no mx-auto for blocks needing left alignment)
    const splitAlignmentClass = needsLeftAlignment ? "text-left" : alignmentClass;

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
