"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  X,
  Check,
  GripVertical,
  MoreVertical,
  Image,
  Trash2,
  HelpCircle,
  Monitor,
  Smartphone,
} from "lucide-react";
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

  // State for option menu
  const [openOptionMenu, setOpenOptionMenu] = useState<string | null>(null);

  // State for dragging options
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);

  // Close option menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openOptionMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-option-menu]")) {
          setOpenOptionMenu(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openOptionMenu]);

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

  // Determine block types for conditional rendering
  const isContactInfo = selectedBlock.type === "contact_info";
  const isShortText = selectedBlock.type === "text" || selectedBlock.type === "short_text";
  const isLongText = selectedBlock.type === "long_text";
  const isPhone = selectedBlock.type === "phone" || selectedBlock.type === "phone_number";
  const isWebsite = selectedBlock.type === "website" || selectedBlock.type === "website_url";
  const isNumber = selectedBlock.type === "number";
  const isSingleSelect = selectedBlock.type === "single_select";
  const isMultiSelect = selectedBlock.type === "multi_select";
  const isSelectBlock = isSingleSelect || isMultiSelect;
  const needsLeftAlignment =
    isContactInfo || isShortText || isLongText || isPhone || isWebsite || isNumber || isSelectBlock;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {/* Type selector for Select blocks - at the very top */}
          {isSelectBlock && (
            <div className="space-y-2">
              <Label htmlFor="selectType" className="text-base font-medium text-gray-900">
                Type
              </Label>
              <select
                id="selectType"
                value={(selectedBlock as any).selectType || "single_select"}
                onChange={(e) => handleUpdate({ selectType: e.target.value, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
              >
                <option value="single_select">Single Select</option>
                <option value="multi_select">Multi Select</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>
          )}

          {/* Question/Title */}
          <div ref={questionRef} className="space-y-2">
            <Label htmlFor="question" className="text-base font-medium text-gray-900">
              {isContactInfo ? "Question" : "Title"}
            </Label>
            <Textarea
              id="question"
              value={selectedBlock.question || ""}
              onChange={(e) => handleUpdate({ question: e.target.value })}
              placeholder={isContactInfo ? "Please fill the following" : "Hey there 😊"}
              className="resize-none min-h-[70px] text-base"
            />
          </div>

          {/* Description */}
          <div ref={descRef} className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium text-gray-900">
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
              <Label className="text-base font-medium text-gray-900">Fields</Label>
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
                                    className="mt-1 text-base h-10"
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
                                    className="mt-1 text-base h-10"
                                    placeholder="Enter placeholder text"
                                  />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    id={`${fieldKey}-required`}
                                    role="checkbox"
                                    aria-checked={field.required}
                                    onClick={() =>
                                      updateFieldSettings(fieldKey, { required: !field.required })
                                    }
                                    className={cn(
                                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                      field.required
                                        ? "bg-indigo-600 border-indigo-600"
                                        : "bg-white border-gray-300 hover:border-gray-400"
                                    )}
                                  >
                                    {field.required && (
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    )}
                                  </button>
                                  <Label
                                    htmlFor={`${fieldKey}-required`}
                                    className="text-xs font-medium text-gray-700 cursor-pointer"
                                  >
                                    Required field
                                  </Label>
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
            <Label htmlFor="buttonText" className="text-base font-medium text-gray-900">
              Button Text
            </Label>
            <Input
              id="buttonText"
              value={selectedBlock.buttonText || ""}
              onChange={(e) => handleUpdate({ buttonText: e.target.value })}
              placeholder="Next"
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              For submit button, set it from settings.{" "}
              <a href="#" className="text-indigo-600 hover:underline">
                Learn more
              </a>
              .
            </p>
          </div>

          {/* Short Text specific fields */}
          {isShortText && (
            <>
              {/* Placeholder */}
              <div className="space-y-2">
                <Label htmlFor="placeholder" className="text-base font-medium text-gray-900">
                  Placeholder
                </Label>
                <Input
                  id="placeholder"
                  value={(selectedBlock as any).placeholder || ""}
                  onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                  placeholder="Type your answer here..."
                  className="text-base"
                />
              </div>

              {/* Required field */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    role="checkbox"
                    aria-checked={selectedBlock.required || false}
                    onClick={() => handleUpdate({ required: !selectedBlock.required })}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      selectedBlock.required
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {selectedBlock.required && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <div>
                    <Label className="text-base font-medium text-gray-900 cursor-pointer">
                      Required field
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If checked, users will be required to complete this field.
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto fill via URL parameter */}
              <div className="space-y-2">
                <Label htmlFor="urlParam" className="text-base font-medium text-gray-900">
                  Auto fill via URL parameter
                </Label>
                <Input
                  id="urlParam"
                  value={(selectedBlock as any).urlParam || ""}
                  onChange={(e) => handleUpdate({ urlParam: e.target.value })}
                  placeholder="e.g email"
                  className="text-base"
                />
              </div>
            </>
          )}

          {/* Long Text specific fields */}
          {isLongText && (
            <>
              {/* Placeholder */}
              <div className="space-y-2">
                <Label htmlFor="placeholder" className="text-base font-medium text-gray-900">
                  Placeholder
                </Label>
                <Input
                  id="placeholder"
                  value={(selectedBlock as any).placeholder || ""}
                  onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                  placeholder="Type your answer here..."
                  className="text-base"
                />
              </div>

              {/* Text box size */}
              <div className="space-y-2">
                <Label htmlFor="textBoxSize" className="text-base font-medium text-gray-900">
                  Text box size
                </Label>
                <select
                  id="textBoxSize"
                  value={(selectedBlock as any).textBoxSize || "small"}
                  onChange={(e) => handleUpdate({ textBoxSize: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Required field */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    role="checkbox"
                    aria-checked={selectedBlock.required || false}
                    onClick={() => handleUpdate({ required: !selectedBlock.required })}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      selectedBlock.required
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {selectedBlock.required && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <div>
                    <Label className="text-base font-medium text-gray-900 cursor-pointer">
                      Required field
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If checked, users will be required to complete this field.
                    </p>
                  </div>
                </div>
              </div>

              {/* Minimum characters */}
              <div className="space-y-2">
                <Label htmlFor="minChars" className="text-base font-medium text-gray-900">
                  Minimum characters
                </Label>
                <Input
                  id="minChars"
                  type="number"
                  value={(selectedBlock as any).minChars || ""}
                  onChange={(e) =>
                    handleUpdate({ minChars: e.target.value ? parseInt(e.target.value) : null })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g 30"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">Leave blank for no minimum limit.</p>
              </div>

              {/* Maximum characters */}
              <div className="space-y-2">
                <Label htmlFor="maxChars" className="text-base font-medium text-gray-900">
                  Maximum characters
                </Label>
                <Input
                  id="maxChars"
                  type="number"
                  value={(selectedBlock as any).maxChars || ""}
                  onChange={(e) =>
                    handleUpdate({ maxChars: e.target.value ? parseInt(e.target.value) : null })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g 300"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">Leave blank for no maximum limit.</p>
              </div>
            </>
          )}

          {/* Phone specific fields */}
          {isPhone && (
            <>
              {/* Default country */}
              <div className="space-y-2">
                <Label htmlFor="defaultCountry" className="text-base font-medium text-gray-900">
                  Default country
                </Label>
                <select
                  id="defaultCountry"
                  value={(selectedBlock as any).defaultCountry || "FR"}
                  onChange={(e) => handleUpdate({ defaultCountry: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
                >
                  <option value="FR">🇫🇷 France (+33)</option>
                  <option value="US">🇺🇸 United States (+1)</option>
                  <option value="GB">🇬🇧 United Kingdom (+44)</option>
                  <option value="DE">🇩🇪 Germany (+49)</option>
                  <option value="ES">🇪🇸 Spain (+34)</option>
                  <option value="IT">🇮🇹 Italy (+39)</option>
                  <option value="BE">🇧🇪 Belgium (+32)</option>
                  <option value="CH">🇨🇭 Switzerland (+41)</option>
                  <option value="CA">🇨🇦 Canada (+1)</option>
                  <option value="AU">🇦🇺 Australia (+61)</option>
                  <option value="NL">🇳🇱 Netherlands (+31)</option>
                  <option value="PT">🇵🇹 Portugal (+351)</option>
                  <option value="BR">🇧🇷 Brazil (+55)</option>
                  <option value="JP">🇯🇵 Japan (+81)</option>
                  <option value="CN">🇨🇳 China (+86)</option>
                  <option value="IN">🇮🇳 India (+91)</option>
                </select>
                <p className="text-xs text-gray-500">
                  Users can change the country when filling the form.
                </p>
              </div>

              {/* Required field */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    role="checkbox"
                    aria-checked={selectedBlock.required || false}
                    onClick={() => handleUpdate({ required: !selectedBlock.required })}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      selectedBlock.required
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {selectedBlock.required && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <div>
                    <Label className="text-base font-medium text-gray-900 cursor-pointer">
                      Required field
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If checked, users will be required to complete this field.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Website URL specific fields */}
          {isWebsite && (
            <>
              {/* Placeholder */}
              <div className="space-y-2">
                <Label htmlFor="placeholder" className="text-base font-medium text-gray-900">
                  Placeholder
                </Label>
                <Input
                  id="placeholder"
                  value={(selectedBlock as any).placeholder || ""}
                  onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                  placeholder="https://"
                  className="text-base"
                />
              </div>

              {/* Required field */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    role="checkbox"
                    aria-checked={selectedBlock.required || false}
                    onClick={() => handleUpdate({ required: !selectedBlock.required })}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      selectedBlock.required
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {selectedBlock.required && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <div>
                    <Label className="text-base font-medium text-gray-900 cursor-pointer">
                      Required field
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If checked, users will be required to complete this field.
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto fill via URL parameter */}
              <div className="space-y-2">
                <Label htmlFor="urlParam" className="text-base font-medium text-gray-900">
                  Auto fill via URL parameter
                </Label>
                <Input
                  id="urlParam"
                  value={(selectedBlock as any).urlParam || ""}
                  onChange={(e) => handleUpdate({ urlParam: e.target.value })}
                  placeholder="e.g website"
                  className="text-base"
                />
              </div>
            </>
          )}

          {/* Number specific fields */}
          {isNumber && (
            <>
              {/* Placeholder */}
              <div className="space-y-2">
                <Label htmlFor="placeholder" className="text-base font-medium text-gray-900">
                  Placeholder
                </Label>
                <Input
                  id="placeholder"
                  value={(selectedBlock as any).placeholder || ""}
                  onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                  placeholder="0"
                  className="text-base"
                />
              </div>

              {/* Required field */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    role="checkbox"
                    aria-checked={selectedBlock.required || false}
                    onClick={() => handleUpdate({ required: !selectedBlock.required })}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      selectedBlock.required
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {selectedBlock.required && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <div>
                    <Label className="text-base font-medium text-gray-900 cursor-pointer">
                      Required field
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If checked, users will be required to complete this field.
                    </p>
                  </div>
                </div>
              </div>

              {/* Minimum Number */}
              <div className="space-y-2">
                <Label htmlFor="minNumber" className="text-base font-medium text-gray-900">
                  Minimum Number
                </Label>
                <Input
                  id="minNumber"
                  type="number"
                  value={(selectedBlock as any).minNumber || ""}
                  onChange={(e) =>
                    handleUpdate({ minNumber: e.target.value ? parseInt(e.target.value) : null })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder=""
                  className="text-base"
                />
              </div>

              {/* Maximum Number */}
              <div className="space-y-2">
                <Label htmlFor="maxNumber" className="text-base font-medium text-gray-900">
                  Maximum Number
                </Label>
                <Input
                  id="maxNumber"
                  type="number"
                  value={(selectedBlock as any).maxNumber || ""}
                  onChange={(e) =>
                    handleUpdate({ maxNumber: e.target.value ? parseInt(e.target.value) : null })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder=""
                  className="text-base"
                />
              </div>

              {/* Auto fill via URL parameter */}
              <div className="space-y-2">
                <Label htmlFor="urlParam" className="text-base font-medium text-gray-900">
                  Auto fill via URL parameter
                </Label>
                <Input
                  id="urlParam"
                  value={(selectedBlock as any).urlParam || ""}
                  onChange={(e) => handleUpdate({ urlParam: e.target.value })}
                  placeholder="e.g age"
                  className="text-base"
                />
              </div>
            </>
          )}

          {/* Select block specific fields (Single Select & Multi Select) */}
          {isSelectBlock && (
            <>
              {/* Options */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-gray-900">Options</Label>
                <div className="space-y-1.5">
                  {(() => {
                    const options = (selectedBlock as any).options || [
                      { id: "1", label: "Option 1" },
                      { id: "2", label: "Option 2" },
                    ];

                    const updateOption = (index: number, updates: any) => {
                      const newOptions = [...options];
                      newOptions[index] = { ...newOptions[index], ...updates };
                      handleUpdate({ options: newOptions });
                    };

                    const addOption = () => {
                      const newOptions = [
                        ...options,
                        { id: crypto.randomUUID(), label: `Option ${options.length + 1}` },
                      ];
                      handleUpdate({ options: newOptions });
                    };

                    const removeOption = (index: number) => {
                      if (options.length > 1) {
                        const newOptions = options.filter((_: any, i: number) => i !== index);
                        handleUpdate({ options: newOptions });
                        setOpenOptionMenu(null);
                      }
                    };

                    const moveOption = (fromIndex: number, toIndex: number) => {
                      if (toIndex < 0 || toIndex >= options.length) return;
                      const newOptions = [...options];
                      const [removed] = newOptions.splice(fromIndex, 1);
                      newOptions.splice(toIndex, 0, removed);
                      handleUpdate({ options: newOptions });
                    };

                    const handleDragStart = (e: React.DragEvent, index: number) => {
                      setDraggedOptionIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    };

                    const handleDragOver = (e: React.DragEvent, index: number) => {
                      e.preventDefault();
                      if (draggedOptionIndex === null || draggedOptionIndex === index) return;
                      moveOption(draggedOptionIndex, index);
                      setDraggedOptionIndex(index);
                    };

                    const handleDragEnd = () => {
                      setDraggedOptionIndex(null);
                    };

                    // Handle image upload for option
                    const handleOptionImageUpload = (index: number, file: File) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateOption(index, { image: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    };

                    const removeOptionImage = (index: number) => {
                      updateOption(index, { image: null });
                    };

                    return (
                      <>
                        {options.map((option: any, index: number) => (
                          <div
                            key={option.id || index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-1 border border-gray-200 rounded bg-white group",
                              draggedOptionIndex === index && "opacity-50"
                            )}
                          >
                            {/* Drag handle */}
                            <div className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            {/* Option image thumbnail (if exists) */}
                            {option.image && (
                              <div className="flex-shrink-0">
                                <img
                                  src={option.image}
                                  alt=""
                                  className="max-w-8 max-h-6 object-contain rounded"
                                />
                              </div>
                            )}
                            {/* Option label input */}
                            <Input
                              value={option.label}
                              onChange={(e) => updateOption(index, { label: e.target.value })}
                              className="flex-1 min-w-0 text-sm border-0 shadow-none focus:ring-0 bg-transparent px-1.5 h-7"
                              placeholder={`Option ${index + 1}`}
                            />
                            {/* Settings menu - always at the end, pushed to right */}
                            <div className="relative flex-shrink-0 ml-auto" data-option-menu>
                              <button
                                onClick={() =>
                                  setOpenOptionMenu(openOptionMenu === option.id ? null : option.id)
                                }
                                className={cn(
                                  "p-1 transition-colors rounded",
                                  openOptionMenu === option.id
                                    ? "text-indigo-600 bg-indigo-50"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              {/* Hidden file input for image upload */}
                              <input
                                type="file"
                                id={`option-image-${option.id}`}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleOptionImageUpload(index, file);
                                  }
                                  e.target.value = "";
                                  setOpenOptionMenu(null);
                                }}
                              />
                              {/* Dropdown menu */}
                              {openOptionMenu === option.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-md z-50 py-1 min-w-[140px]">
                                  {option.image ? (
                                    <button
                                      onClick={() => {
                                        removeOptionImage(index);
                                        setOpenOptionMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                    >
                                      <X className="w-4 h-4 text-gray-500" />
                                      Remove image
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        document
                                          .getElementById(`option-image-${option.id}`)
                                          ?.click();
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                                    >
                                      <Image className="w-4 h-4 text-gray-500" aria-hidden="true" />
                                      Add image
                                    </button>
                                  )}
                                  {options.length > 1 && (
                                    <button
                                      onClick={() => removeOption(index)}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={addOption}
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add option
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          For bulk insert just paste them above or insert here
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Checkbox options - smaller text */}
              <div className="space-y-3">
                {/* "Other" option toggle */}
                <div className="flex items-center gap-2.5">
                  <button
                    role="checkbox"
                    aria-checked={(selectedBlock as any).allowOther || false}
                    onClick={() => handleUpdate({ allowOther: !(selectedBlock as any).allowOther })}
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      (selectedBlock as any).allowOther
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {(selectedBlock as any).allowOther && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer">"Other" option</span>
                  <div className="relative group">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-48 text-center z-50">
                      Adds an "Other" field at the end where users can type a custom answer.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>

                {/* Randomize options toggle */}
                <div className="flex items-center gap-2.5">
                  <button
                    role="checkbox"
                    aria-checked={(selectedBlock as any).randomize || false}
                    onClick={() => handleUpdate({ randomize: !(selectedBlock as any).randomize })}
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      (selectedBlock as any).randomize
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {(selectedBlock as any).randomize && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer">Randomize options</span>
                  <div className="relative group">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-48 text-center z-50">
                      Shuffles option order for each respondent to avoid selection bias.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>

                {/* Horizontally align options toggle */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      role="checkbox"
                      aria-checked={(selectedBlock as any).horizontalAlign || false}
                      onClick={() =>
                        handleUpdate({ horizontalAlign: !(selectedBlock as any).horizontalAlign })
                      }
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                        (selectedBlock as any).horizontalAlign
                          ? "bg-indigo-600 border-indigo-600"
                          : "bg-white border-gray-300 hover:border-gray-400"
                      )}
                    >
                      {(selectedBlock as any).horizontalAlign && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </button>
                    <span className="text-sm text-gray-700 cursor-pointer">
                      Horizontally align options
                    </span>
                  </div>
                  {/* Desktop and Mobile columns per row - shown when horizontal align is enabled */}
                  {(selectedBlock as any).horizontalAlign && (
                    <div className="flex gap-3 ml-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Monitor className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-600">Desktop</span>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          value={(selectedBlock as any).columnsDesktop || 2}
                          onChange={(e) =>
                            handleUpdate({ columnsDesktop: parseInt(e.target.value) || 2 })
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-8 text-sm"
                          placeholder="2"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-600">Mobile</span>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          max={4}
                          value={(selectedBlock as any).columnsMobile || 1}
                          onChange={(e) =>
                            handleUpdate({ columnsMobile: parseInt(e.target.value) || 1 })
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-8 text-sm"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Required field - placed after Horizontally align options */}
                  <div className="flex items-center gap-2.5">
                    <button
                      role="checkbox"
                      aria-checked={selectedBlock.required || false}
                      onClick={() => handleUpdate({ required: !selectedBlock.required })}
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                        selectedBlock.required
                          ? "bg-indigo-600 border-indigo-600"
                          : "bg-white border-gray-300 hover:border-gray-400"
                      )}
                    >
                      {selectedBlock.required && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </button>
                    <div>
                      <span className="text-sm text-gray-700 cursor-pointer">Required field</span>
                      <p className="text-xs text-gray-500">
                        If checked, users will be required to complete this field.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selection Limit - Only for Multi Select */}
                {isMultiSelect && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <Label className="text-sm font-medium text-gray-900">Selection Limit</Label>
                    <div className="space-y-2">
                      {/* Unlimited */}
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="selectionLimit"
                          checked={
                            (selectedBlock as any).selectionLimit === "unlimited" ||
                            !(selectedBlock as any).selectionLimit
                          }
                          onChange={() =>
                            handleUpdate({
                              selectionLimit: "unlimited",
                              exactNumber: null,
                              minSelection: null,
                              maxSelection: null,
                            })
                          }
                          className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-sm text-gray-700">Unlimited</span>
                          <p className="text-xs text-gray-500">Allow any number of options</p>
                        </div>
                      </label>

                      {/* Exact number */}
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="selectionLimit"
                          checked={(selectedBlock as any).selectionLimit === "exact"}
                          onChange={() =>
                            handleUpdate({
                              selectionLimit: "exact",
                              exactNumber: 1,
                              minSelection: null,
                              maxSelection: null,
                            })
                          }
                          className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-700">Exact number</span>
                          <p className="text-xs text-gray-500">Allow exactly this many options</p>
                        </div>
                      </label>
                      {(selectedBlock as any).selectionLimit === "exact" && (
                        <div className="ml-6">
                          <Input
                            type="number"
                            min={1}
                            value={(selectedBlock as any).exactNumber || 1}
                            onChange={(e) =>
                              handleUpdate({ exactNumber: parseInt(e.target.value) || 1 })
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            className="h-8 text-sm w-24"
                            placeholder="1"
                          />
                        </div>
                      )}

                      {/* Range */}
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="selectionLimit"
                          checked={(selectedBlock as any).selectionLimit === "range"}
                          onChange={() =>
                            handleUpdate({
                              selectionLimit: "range",
                              exactNumber: null,
                              minSelection: 1,
                              maxSelection: 3,
                            })
                          }
                          className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-700">Range</span>
                          <p className="text-xs text-gray-500">Allow between min and max options</p>
                        </div>
                      </label>
                      {(selectedBlock as any).selectionLimit === "range" && (
                        <div className="ml-6 flex gap-2">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 mb-1 block">Min</span>
                            <Input
                              type="number"
                              min={1}
                              value={(selectedBlock as any).minSelection || 1}
                              onChange={(e) =>
                                handleUpdate({ minSelection: parseInt(e.target.value) || 1 })
                              }
                              onWheel={(e) => e.currentTarget.blur()}
                              className="h-8 text-sm"
                              placeholder="1"
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 mb-1 block">Max</span>
                            <Input
                              type="number"
                              min={1}
                              value={(selectedBlock as any).maxSelection || 3}
                              onChange={(e) =>
                                handleUpdate({ maxSelection: parseInt(e.target.value) || 3 })
                              }
                              onWheel={(e) => e.currentTarget.blur()}
                              className="h-8 text-sm"
                              placeholder="3"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Auto fill via URL parameter */}
              <div className="space-y-2">
                <Label htmlFor="urlParam" className="text-base font-medium text-gray-900">
                  Auto fill via URL parameter
                </Label>
                <Input
                  id="urlParam"
                  value={(selectedBlock as any).urlParam || ""}
                  onChange={(e) => handleUpdate({ urlParam: e.target.value })}
                  placeholder="e.g choice"
                  className="text-base"
                />
              </div>
            </>
          )}

          {/* Text Align - Hidden for blocks needing left alignment */}
          {!needsLeftAlignment && (
            <div className="space-y-2">
              <Label className="text-base font-medium text-gray-900">Text align</Label>
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
                    !(selectedBlock as any).textAlign ||
                      (selectedBlock as any).textAlign === "center"
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
          )}

          {/* Cover Image */}
          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-900">Cover Image</Label>
            <ImageUpload
              value={(selectedBlock as any).coverImage}
              onChange={(url) => handleUpdate({ coverImage: url })}
              label=""
            />
          </div>

          {/* Layout - Only show if cover image exists */}
          {(selectedBlock as any).coverImage && (
            <div className="space-y-2">
              <Label htmlFor="layout" className="text-base font-medium text-gray-900">
                Layout
              </Label>
              <div className="flex gap-2">
                {/* Layout selector */}
                <div className={(selectedBlock as any).layout === "split" ? "flex-1" : "w-full"}>
                  <select
                    id="layout"
                    value={(selectedBlock as any).layout || "stack"}
                    onChange={(e) => handleUpdate({ layout: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white transition-colors"
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
