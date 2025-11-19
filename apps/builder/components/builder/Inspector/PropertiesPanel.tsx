"use client";

import React, { useEffect } from "react";
import { Settings, Plus, AlignLeft, AlignCenter, Eye } from "lucide-react";
import { Input, Label, Textarea, Button } from "@skemya/ui";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import { RichTextToolbar } from "./RichTextToolbar";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";

export function PropertiesPanel() {
  const { form, selectedBlockId, updateBlock, selectBlock } = useFormBuilderStore();
  const descriptionRef = React.useRef<HTMLDivElement>(null);
  const questionRef = React.useRef<HTMLDivElement>(null);
  const descRef = React.useRef<HTMLDivElement>(null);
  const buttonTextRef = React.useRef<HTMLDivElement>(null);

  // Auto-select first block if none selected
  useEffect(() => {
    if (form && !selectedBlockId) {
      const firstBlock = form.pages?.[0]?.blocks?.[0];
      if (firstBlock) {
        selectBlock(firstBlock.id);
      }
    }
  }, [form, selectedBlockId, selectBlock]);

  // Function to shake a box
  const shakeBox = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.classList.add("animate-shake");
      setTimeout(() => {
        ref.current?.classList.remove("animate-shake");
      }, 500);
    }
  };

  // Expose shake function to parent (FormCanvas)
  useEffect(() => {
    (window as any).shakePropertyBox = (field: string) => {
      if (field === "question") shakeBox(questionRef);
      else if (field === "description") shakeBox(descRef);
      else if (field === "buttonText") shakeBox(buttonTextRef);
    };
    return () => {
      delete (window as any).shakePropertyBox;
    };
  }, []);

  if (!form) return null;

  const selectedBlock = form.pages.flatMap((p) => p.blocks).find((b) => b.id === selectedBlockId);

  if (!selectedBlock) return null;

  const handleUpdate = (updates: any) => {
    if (selectedBlockId) {
      updateBlock(selectedBlockId, updates);
    }
  };

  // Determine if this is a contact_info block (needs field management)
  const isContactInfo = selectedBlock.type === "contact_info";

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Question/Title */}
          <div ref={questionRef} className="space-y-2">
            <Label htmlFor="question" className="text-base font-semibold text-gray-900">
              {isContactInfo ? "Question" : "Title"}
            </Label>
            <Textarea
              id="question"
              value={selectedBlock.question || ""}
              onChange={(e) => handleUpdate({ question: e.target.value })}
              placeholder={isContactInfo ? "Please fill the following" : "Hey there 😊"}
              className="resize-none min-h-[60px] text-sm"
            />
          </div>

          {/* Description */}
          <div ref={descRef} className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold text-gray-900">
              Description
            </Label>

            {/* Formatting Toolbar */}
            <RichTextToolbar
              value={selectedBlock.description || ""}
              onChange={(newDescription) => handleUpdate({ description: newDescription })}
              textareaRef={descriptionRef}
            />

            <RichTextEditor
              ref={descriptionRef}
              value={selectedBlock.description || ""}
              onChange={(newDescription) => handleUpdate({ description: newDescription })}
              placeholder="Add a description..."
              className="mt-2"
            />
          </div>

          {/* Button Text */}
          <div ref={buttonTextRef} className="space-y-2">
            <Label htmlFor="buttonText" className="text-base font-semibold text-gray-900">
              Button Text
            </Label>
            <Input
              id="buttonText"
              value={selectedBlock.buttonText || ""}
              onChange={(e) => handleUpdate({ buttonText: e.target.value })}
              placeholder="Next"
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              For submit button, set it from settings.{" "}
              <a href="#" className="text-indigo-600 hover:underline">
                Learn more
              </a>
              .
            </p>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-900">Cover Image</Label>
            <ImageUpload
              value={(selectedBlock as any).coverImage}
              onChange={(url) => handleUpdate({ coverImage: url })}
              label=""
            />
          </div>

          {/* Text Align - Only for statement blocks */}
          {selectedBlock.type === "statement" && (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-900">Text align</Label>
              <div className="flex gap-2">
                <button className="flex-1 p-2.5 hover:bg-gray-50 rounded border border-gray-200 transition-colors flex items-center justify-center bg-white">
                  <AlignLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button className="flex-1 p-2.5 hover:bg-gray-50 rounded border border-gray-200 transition-colors flex items-center justify-center bg-white">
                  <AlignCenter className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Layout - Only for statement blocks */}
          {selectedBlock.type === "statement" && (
            <div className="space-y-2">
              <Label htmlFor="layout" className="text-base font-semibold text-gray-900">
                Layout
              </Label>
              <select
                id="layout"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
                defaultValue="stack"
              >
                <option value="stack">Stack</option>
                <option value="split">Split</option>
                <option value="wallpaper">Wallpaper</option>
              </select>
            </div>
          )}

          {/* Embed - Only for statement blocks */}
          {selectedBlock.type === "statement" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-gray-900">Embed</Label>
                <button className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors bg-white">
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Contact Info Fields */}
          {isContactInfo && (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-900">Fields</Label>
              <div className="space-y-2">
                {["First Name", "Last Name", "Email", "Phone Number", "Company"].map(
                  (fieldName, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100"
                    >
                      <span className="text-sm text-gray-700">{fieldName}</span>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
