"use client";

import React, { useEffect, useState } from "react";
import { Settings, Plus, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff, X } from "lucide-react";
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

  // State for editing contact field
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");

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
            <Label htmlFor="question" className="text-sm font-medium text-gray-900">
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
            <Label htmlFor="description" className="text-sm font-medium text-gray-900">
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

          {/* Contact Info Fields */}
          {isContactInfo && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Fields</Label>
              <div className="space-y-2">
                {(() => {
                  const fieldKeys = ["firstName", "lastName", "email", "phone", "company"];
                  const defaultFields = {
                    firstName: {
                      label: "First Name",
                      placeholder: "John",
                      visible: true,
                      required: false,
                    },
                    lastName: {
                      label: "Last Name",
                      placeholder: "Doe",
                      visible: true,
                      required: false,
                    },
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
                    company: {
                      label: "Company",
                      placeholder: "Acme Inc",
                      visible: true,
                      required: false,
                    },
                  };
                  const currentFields = (selectedBlock as any).contactFields || defaultFields;

                  const toggleFieldVisibility = (fieldKey: string) => {
                    const newFields = { ...currentFields };
                    newFields[fieldKey] = {
                      ...newFields[fieldKey],
                      visible: !newFields[fieldKey].visible,
                    };
                    handleUpdate({ contactFields: newFields });
                  };

                  const toggleFieldEditor = (fieldKey: string) => {
                    setEditingField(editingField === fieldKey ? null : fieldKey);
                    if (editingField !== fieldKey) {
                      const field = currentFields[fieldKey];
                      setFieldLabel(field.label);
                      setFieldPlaceholder(field.placeholder);
                    }
                  };

                  const updateFieldSettings = (fieldKey: string, updates: any) => {
                    const newFields = { ...currentFields };
                    newFields[fieldKey] = {
                      ...newFields[fieldKey],
                      ...updates,
                    };
                    handleUpdate({ contactFields: newFields });
                  };

                  return (
                    <>
                      {fieldKeys.map((fieldKey) => {
                        const field = currentFields[fieldKey];
                        const isEditing = editingField === fieldKey;

                        return (
                          <div
                            key={fieldKey}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Field Header */}
                            <div className="flex items-center justify-between p-3 bg-gray-50">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  field.visible ? "text-gray-700" : "text-gray-400"
                                )}
                              >
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleFieldVisibility(fieldKey)}
                                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {field.visible ? (
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                                <button
                                  onClick={() => toggleFieldEditor(fieldKey)}
                                  className={cn(
                                    "p-1.5 rounded transition-colors",
                                    isEditing
                                      ? "bg-indigo-100 text-indigo-600"
                                      : "hover:bg-gray-200 text-gray-600"
                                  )}
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Editor */}
                            {isEditing && (
                              <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                                <div>
                                  <Label
                                    htmlFor={`${fieldKey}-label`}
                                    className="text-xs font-medium text-gray-700"
                                  >
                                    Field Label
                                  </Label>
                                  <Input
                                    id={`${fieldKey}-label`}
                                    value={field.label}
                                    onChange={(e) =>
                                      updateFieldSettings(fieldKey, { label: e.target.value })
                                    }
                                    className="mt-1 text-sm h-9"
                                    placeholder="Enter field label"
                                  />
                                </div>

                                <div>
                                  <Label
                                    htmlFor={`${fieldKey}-placeholder`}
                                    className="text-xs font-medium text-gray-700"
                                  >
                                    Placeholder
                                  </Label>
                                  <Input
                                    id={`${fieldKey}-placeholder`}
                                    value={field.placeholder}
                                    onChange={(e) =>
                                      updateFieldSettings(fieldKey, { placeholder: e.target.value })
                                    }
                                    className="mt-1 text-sm h-9"
                                    placeholder="Enter placeholder text"
                                  />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                  <Label
                                    htmlFor={`${fieldKey}-required`}
                                    className="text-xs font-medium text-gray-700"
                                  >
                                    Required field
                                  </Label>
                                  <button
                                    id={`${fieldKey}-required`}
                                    role="switch"
                                    aria-checked={field.required}
                                    onClick={() =>
                                      updateFieldSettings(fieldKey, { required: !field.required })
                                    }
                                    className={cn(
                                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                      field.required ? "bg-indigo-600" : "bg-gray-200"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        field.required ? "translate-x-5" : "translate-x-0.5"
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Button Text */}
          <div ref={buttonTextRef} className="space-y-2">
            <Label htmlFor="buttonText" className="text-sm font-medium text-gray-900">
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

          {/* Text Align */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Text align</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdate({ textAlign: "left" })}
                className={cn(
                  "flex-1 p-2.5 rounded border transition-colors flex items-center justify-center",
                  (selectedBlock as any).textAlign === "left"
                    ? "bg-indigo-100 border-indigo-600"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <AlignLeft
                  className={cn(
                    "w-4 h-4",
                    (selectedBlock as any).textAlign === "left"
                      ? "text-indigo-600"
                      : "text-gray-600"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ textAlign: "center" })}
                className={cn(
                  "flex-1 p-2.5 rounded border transition-colors flex items-center justify-center",
                  !(selectedBlock as any).textAlign || (selectedBlock as any).textAlign === "center"
                    ? "bg-indigo-100 border-indigo-600"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <AlignCenter
                  className={cn(
                    "w-4 h-4",
                    !(selectedBlock as any).textAlign ||
                      (selectedBlock as any).textAlign === "center"
                      ? "text-indigo-600"
                      : "text-gray-600"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ textAlign: "right" })}
                className={cn(
                  "flex-1 p-2.5 rounded border transition-colors flex items-center justify-center",
                  (selectedBlock as any).textAlign === "right"
                    ? "bg-indigo-100 border-indigo-600"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <AlignRight
                  className={cn(
                    "w-4 h-4",
                    (selectedBlock as any).textAlign === "right"
                      ? "text-indigo-600"
                      : "text-gray-600"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Cover Image</Label>
            <ImageUpload
              value={(selectedBlock as any).coverImage}
              onChange={(url) => handleUpdate({ coverImage: url })}
              label=""
            />
          </div>

          {/* Layout - Only show if cover image exists */}
          {(selectedBlock as any).coverImage && (
            <div className="space-y-2">
              <Label htmlFor="layout" className="text-sm font-medium text-gray-900">
                Layout
              </Label>
              <div className="flex gap-2">
                {/* Layout selector */}
                <div className={(selectedBlock as any).layout === "split" ? "flex-1" : "w-full"}>
                  <select
                    id="layout"
                    value={(selectedBlock as any).layout || "stack"}
                    onChange={(e) => handleUpdate({ layout: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
                  >
                    <option value="stack">Stack</option>
                    <option value="split">Split</option>
                    <option value="wallpaper">Wallpaper</option>
                  </select>
                </div>

                {/* Image Position - Only show if layout is split */}
                {(selectedBlock as any).layout === "split" && (
                  <div className="flex-1">
                    <select
                      id="imagePosition"
                      value={(selectedBlock as any).imagePosition || "left"}
                      onChange={(e) => handleUpdate({ imagePosition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
