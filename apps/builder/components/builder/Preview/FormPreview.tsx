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
    // Show professional toast notification
    toast("To edit the content, use the properties panel on the right.", {
      duration: 3000,
      position: "top-center",
      style: {
        background: "#ffffff",
        color: "#374151",
        border: "1px solid #E5E7EB",
        borderRadius: "4px",
        padding: "12px 16px",
        fontSize: "13px",
        fontWeight: "400",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      },
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
        "w-full bg-white",
        needsFullContainer
          ? "h-full"
          : "min-h-full flex flex-col items-center justify-center py-12 px-8"
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

      case "dropdown": {
        const options = (block as any).options || [
          { id: "1", label: "Option 1" },
          { id: "2", label: "Option 2" },
        ];
        const randomize = (block as any).randomize || false;

        // Shuffle options if randomize is enabled
        let displayOptions = [...options];
        if (randomize) {
          displayOptions = displayOptions.sort(() => 0.5 - Math.random());
        }

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-gray-600 bg-white hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em",
                paddingRight: "2rem",
              }}
              disabled
            >
              <option value="" disabled selected>
                Select an option...
              </option>
              {displayOptions.map((option: any, index: number) => (
                <option key={option.id || index} value={option.id || option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case "date": {
        const dateFormat = (block as any).dateFormat || "FR";

        // Get placeholder based on date format
        const getPlaceholder = () => {
          switch (dateFormat) {
            case "US":
              return "MM/DD/YYYY";
            case "DE":
              return "DD.MM.YYYY";
            case "JP":
            case "CN":
            case "ISO":
              return "YYYY-MM-DD";
            default:
              return "DD/MM/YYYY";
          }
        };

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="relative">
              <input
                type="text"
                placeholder={getPlaceholder()}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded text-sm text-gray-600 bg-white hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                disabled
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      }

      case "star_rating":
      case "rating": {
        const maxRating = (block as any).maxRating || 5;

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="flex items-center gap-2">
              {Array.from({ length: maxRating }, (_, i) => (
                <svg
                  key={i}
                  className="w-10 h-10 text-gray-300 transition-colors cursor-pointer"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              ))}
            </div>
          </div>
        );
      }

      case "opinion_scale":
      case "nps": {
        const scaleStart = (block as any).scaleStart ?? 1;
        const scaleEnd = (block as any).scaleEnd ?? 10;
        const leftLabel = (block as any).leftLabel || "Not likely";
        const rightLabel = (block as any).rightLabel || "Highly likely";

        // Generate scale numbers array
        const scaleNumbers = [];
        for (let i = scaleStart; i <= scaleEnd; i++) {
          scaleNumbers.push(i);
        }

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            {/* Scale buttons */}
            <div className="flex items-center gap-1.5">
              {scaleNumbers.map((num) => (
                <button
                  key={num}
                  className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded text-base font-medium text-gray-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>
            {/* Labels below the scale - aligned under first and last buttons */}
            <div
              className="flex mt-2"
              style={{ width: `${scaleNumbers.length * 48 + (scaleNumbers.length - 1) * 6}px` }}
            >
              <span
                className="text-sm text-gray-500 text-left"
                style={{ maxWidth: "45%", hyphens: "auto", wordBreak: "break-word" }}
                lang="fr"
              >
                {leftLabel}
              </span>
              <span className="flex-1 min-w-4" />
              <span
                className="text-sm text-gray-500 text-right"
                style={{ maxWidth: "45%", hyphens: "auto", wordBreak: "break-word" }}
                lang="fr"
              >
                {rightLabel}
              </span>
            </div>
          </div>
        );
      }

      case "scheduler": {
        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Coming Soon</p>
                <p className="text-xs text-gray-400">Scheduler integration</p>
              </div>
            </div>
          </div>
        );
      }

      case "payment": {
        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Coming Soon</p>
                <p className="text-xs text-gray-400">Payment integration</p>
              </div>
            </div>
          </div>
        );
      }

      case "ranking": {
        const options = (block as any).options || [
          { id: "1", label: "Option 1" },
          { id: "2", label: "Option 2" },
          { id: "3", label: "Option 3" },
        ];

        // Note: randomize is applied only in live form, not in editor preview
        const displayOptions = [...options];

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="inline-grid gap-2" style={{ gridTemplateColumns: "1fr" }}>
              {displayOptions.map((option: any, index: number) => (
                <div
                  key={option.id || index}
                  className="flex items-start gap-3 px-5 py-2.5 border border-gray-200 rounded bg-white hover:border-indigo-400 transition-colors cursor-grab"
                >
                  {/* Rank number dropdown - fixed size, clickable for alternative ranking */}
                  <div className="flex-shrink-0 relative group/rank">
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-semibold text-gray-500 cursor-pointer hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
                      {index + 1}
                    </span>
                    {/* Small dropdown indicator */}
                    <svg
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-2 text-gray-400 opacity-0 group-hover/rank:opacity-100 transition-opacity"
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
                  {/* Option label - flex-1 to take remaining space */}
                  <span
                    className="text-gray-700 text-sm flex-1 pt-0.5"
                    style={{ hyphens: "auto", wordBreak: "break-word" }}
                    lang="fr"
                  >
                    {option.label}
                  </span>
                  {/* Drag handle - fixed size */}
                  <svg
                    className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "signature": {
        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            {/* Signature canvas area */}
            <div className="relative">
              <div className="w-4/5 h-60 bg-white border border-gray-300 rounded flex items-center justify-center">
                {/* Placeholder text */}
                <span className="text-gray-400 text-sm">Sign here</span>
              </div>
              {/* Clear button - shown at bottom left */}
              <button className="absolute bottom-2 left-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                Clear
              </button>
            </div>
          </div>
        );
      }

      case "file_upload": {
        const allowMultiple = (block as any).allowMultiple || false;

        // In split layout, don't use mx-auto (parent already has padding)
        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            {/* Upload drop zone */}
            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-indigo-400 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center text-center">
                {/* Upload icon */}
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {allowMultiple
                    ? "Drop files here or click to upload"
                    : "Drop a file here or click to upload"}
                </p>
                <p className="text-xs text-gray-500">Max file size: 10MB</p>
              </div>
            </div>
          </div>
        );
      }

      case "matrix": {
        const rows = (block as any).rows || [
          { id: "1", label: "Option 1" },
          { id: "2", label: "Option 2" },
          { id: "3", label: "Option 3" },
        ];
        const columns = (block as any).columns || [
          { id: "1", label: "1" },
          { id: "2", label: "2" },
          { id: "3", label: "3" },
          { id: "4", label: "4" },
          { id: "5", label: "5" },
        ];
        const multipleSelection = (block as any).multipleSelection || false;

        const isSplitLayoutForField = layout === "split" && block.coverImage;
        const containerClasses = isSplitLayoutForField
          ? "w-full pointer-events-none select-none text-left"
          : "w-full max-w-2xl mx-auto px-8 pointer-events-none select-none text-left";

        return (
          <div className={containerClasses}>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <table className="border-collapse" style={{ minWidth: "max-content" }}>
                <thead>
                  <tr>
                    <th className="p-2 text-left sticky left-0 bg-white z-10 min-w-[120px]"></th>
                    {columns.map((col: { id: string; label: string }) => (
                      <th
                        key={col.id}
                        className="p-2 text-center text-sm font-medium text-gray-600 min-w-[60px]"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: { id: string; label: string }) => (
                    <tr key={row.id} className="border-t border-gray-200">
                      <td className="p-3 text-sm text-gray-700 sticky left-0 bg-white z-10 min-w-[120px] whitespace-nowrap">
                        {row.label}
                      </td>
                      {columns.map((col: { id: string; label: string }) => (
                        <td key={col.id} className="p-2 text-center">
                          <span
                            className={cn(
                              "w-5 h-5 border-2 border-gray-300 inline-flex items-center justify-center",
                              multipleSelection ? "rounded" : "rounded-full"
                            )}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
  const isDate = block.type === "date";
  const isStarRating = block.type === "star_rating" || block.type === "rating";
  const isOpinionScale = block.type === "opinion_scale" || block.type === "nps";
  const isRanking = block.type === "ranking";
  const isSignature = block.type === "signature";
  const isFileUpload = block.type === "file_upload";
  const isMatrix = block.type === "matrix";
  const isSingleSelect = block.type === "single_select";
  const isMultiSelect = block.type === "multi_select";
  const isDropdown = block.type === "dropdown";
  const isSelectBlock = isSingleSelect || isMultiSelect || isDropdown;
  const needsLeftAlignment =
    isContactInfo ||
    isShortText ||
    isLongText ||
    isPhone ||
    isWebsite ||
    isNumber ||
    isDate ||
    isStarRating ||
    isOpinionScale ||
    isRanking ||
    isSignature ||
    isFileUpload ||
    isSelectBlock ||
    isMatrix;
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
      {block.description && block.description.replace(/<[^>]*>/g, "").trim() !== "" && (
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

  // WALLPAPER LAYOUT - Same as stack but with background image
  if (layout === "wallpaper" && block.coverImage) {
    return (
      <div
        className="relative w-full h-full"
        style={{
          backgroundImage: `url(${block.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Semi-transparent overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Same content as stack layout */}
        <div
          className={cn(
            "relative z-10 h-full flex flex-col items-center justify-center py-12 px-8"
          )}
        >
          <div className={cn("space-y-6 w-full max-w-3xl", alignmentClass)}>{textContent}</div>
        </div>
      </div>
    );
  }

  // SPLIT LAYOUT
  if (layout === "split" && block.coverImage) {
    // For split layout, use different alignment (no mx-auto for blocks needing left alignment)
    const splitAlignmentClass = needsLeftAlignment ? "text-left" : alignmentClass;

    const imageElement = (
      <div
        className="w-1/2 flex-shrink-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${block.coverImage})`,
        }}
      />
    );

    const contentElement = (
      <div className={cn("w-1/2 flex flex-col justify-center p-12 space-y-6", splitAlignmentClass)}>
        {textContent}
      </div>
    );

    return (
      <div className="flex h-full w-full" style={{ minHeight: "100%" }}>
        {imagePosition === "left" ? (
          <>
            {imageElement}
            {contentElement}
          </>
        ) : (
          <>
            {contentElement}
            {imageElement}
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
