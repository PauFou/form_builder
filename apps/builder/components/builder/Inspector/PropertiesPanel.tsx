"use client";

import React from "react";
import {
  Settings,
  Bold,
  Italic,
  Link as LinkIcon,
  Video,
  Plus,
  AlignLeft,
  AlignCenter,
  Eye,
  EyeOff,
} from "lucide-react";
import { Input, Label, Textarea, Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@skemya/ui";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { cn } from "../../../lib/utils";
import { RichTextToolbar } from "./RichTextToolbar";
import { ImageUpload } from "./ImageUpload";

export function PropertiesPanel() {
  const { form, selectedBlockId, updateBlock } = useFormBuilderStore();
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  if (!form || !selectedBlockId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Select a block to edit its properties</p>
        </div>
      </div>
    );
  }

  const selectedBlock = form.pages.flatMap((p) => p.blocks).find((b) => b.id === selectedBlockId);

  if (!selectedBlock) return null;

  const handleUpdate = (updates: any) => {
    updateBlock(selectedBlockId, updates);
  };

  // Determine if this is a contact_info block (needs field management)
  const isContactInfo = selectedBlock.type === "contact_info";

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <Accordion type="multiple" defaultValue={["content", "design", "options"]} className="w-full">
        {/* Content Section */}
        <AccordionItem value="content" className="border-b border-gray-200">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold text-gray-900 hover:no-underline hover:bg-gray-50">
            Content
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-4">
              {/* Question/Title */}
              <div className="space-y-2">
                <Label htmlFor="question" className="text-xs font-medium text-gray-700">
                  {isContactInfo ? "Question" : "Title"}
                </Label>
                <Textarea
                  id="question"
                  value={selectedBlock.question || ""}
                  onChange={(e) => handleUpdate({ question: e.target.value })}
                  placeholder={isContactInfo ? "Please fill the following" : "Hey there 😊"}
                  className="!border-gray-300 resize-none min-h-[60px] text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-medium text-gray-700">
                  Description
                </Label>

                {/* Formatting Toolbar */}
                <RichTextToolbar
                  value={selectedBlock.description || ""}
                  onChange={(newDescription) => handleUpdate({ description: newDescription })}
                  textareaRef={descriptionRef}
                />

                <Textarea
                  ref={descriptionRef}
                  id="description"
                  value={selectedBlock.description || ""}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  placeholder="Add a description..."
                  rows={3}
                  className="!border-gray-300 resize-none mt-2 text-sm"
                />
              </div>

              {/* Button Text */}
              <div className="space-y-2">
                <Label htmlFor="buttonText" className="text-xs font-medium text-gray-700">
                  Button Text
                </Label>
                <Input
                  id="buttonText"
                  value={selectedBlock.buttonText || ""}
                  onChange={(e) => handleUpdate({ buttonText: e.target.value })}
                  placeholder="Next"
                  className="!border-gray-300 text-sm"
                />
                <p className="text-xs text-gray-500">
                  For submit button, set it from settings.{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Learn more
                  </a>
                  .
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Design Section */}
        <AccordionItem value="design" className="border-b border-gray-200">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold text-gray-900 hover:no-underline hover:bg-gray-50">
            Design
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="space-y-4">
              {/* Cover Image */}
              <ImageUpload
                value={(selectedBlock as any).coverImage}
                onChange={(url) => handleUpdate({ coverImage: url })}
                label="Cover Image"
              />

              {/* Text Align - Only for statement blocks */}
              {selectedBlock.type === "statement" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Text align</Label>
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
                  <Label htmlFor="layout" className="text-xs font-medium text-gray-700">
                    Layout
                  </Label>
                  <select
                    id="layout"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
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
                    <Label className="text-xs font-medium text-gray-700">Embed</Label>
                    <button className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors bg-white">
                      <Plus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Options Section - Contact Info Fields */}
        {isContactInfo && (
          <AccordionItem value="options" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-3 text-sm font-semibold text-gray-900 hover:no-underline hover:bg-gray-50">
              Fields
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-2">
                {["First Name", "Last Name", "Email", "Phone Number", "Company"].map((fieldName, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-700">{fieldName}</span>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
