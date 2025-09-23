"use client";

import React from "react";
import { motion } from "framer-motion";
import { Type, Settings, ShieldCheck, Eye, EyeOff, Info, X } from "lucide-react";
import {
  Input,
  Label,
  Switch,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";

export function PropertiesPanel() {
  const { form, selectedBlockId, updateBlock, selectBlock } = useFormBuilderStore();

  if (!form || !selectedBlockId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Settings className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const selectedBlock = form.pages.flatMap((p) => p.blocks).find((b) => b.id === selectedBlockId);

  if (!selectedBlock) return null;

  const handleClose = () => {
    selectBlock(null);
  };

  const handleUpdate = (updates: any) => {
    updateBlock(selectedBlockId, updates);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="general" className="text-xs">
            General
          </TabsTrigger>
          <TabsTrigger value="validation" className="text-xs">
            Validation
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 p-4">
          {/* Field Type */}
          <div className="space-y-2">
            <Label className="text-xs">Field Type</Label>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedBlock.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label" className="text-xs">
              Label
            </Label>
            <Input
              id="label"
              value={selectedBlock.label || ""}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs">
              Description
            </Label>
            <Textarea
              id="description"
              value={selectedBlock.description || ""}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              placeholder="Add help text for this field"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Placeholder */}
          {["short_text", "long_text", "email", "phone", "number"].includes(selectedBlock.type) && (
            <div className="space-y-2">
              <Label htmlFor="placeholder" className="text-xs">
                Placeholder
              </Label>
              <Input
                id="placeholder"
                value={selectedBlock.settings?.placeholder || ""}
                onChange={(e) =>
                  handleUpdate({
                    settings: { ...selectedBlock.settings, placeholder: e.target.value },
                  })
                }
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          {/* Options for choice fields */}
          {["single_select", "multi_select", "dropdown"].includes(selectedBlock.type) && (
            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              <div className="space-y-2">
                {(selectedBlock.settings?.options || ["Option 1", "Option 2"]).map(
                  (option: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(selectedBlock.settings?.options || [])];
                          newOptions[index] = e.target.value;
                          handleUpdate({
                            settings: { ...selectedBlock.settings, options: newOptions },
                          });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newOptions = (selectedBlock.settings?.options || []).filter(
                            (_: any, i: number) => i !== index
                          );
                          handleUpdate({
                            settings: { ...selectedBlock.settings, options: newOptions },
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newOptions = [
                      ...(selectedBlock.settings?.options || []),
                      `Option ${(selectedBlock.settings?.options || []).length + 1}`,
                    ];
                    handleUpdate({
                      settings: { ...selectedBlock.settings, options: newOptions },
                    });
                  }}
                  className="w-full"
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4 p-4">
          {/* Required */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="required" className="text-xs font-medium">
                Required
              </Label>
              <p className="text-xs text-muted-foreground">Make this field mandatory</p>
            </div>
            <Switch
              id="required"
              checked={selectedBlock.required || false}
              onCheckedChange={(checked) => handleUpdate({ required: checked })}
            />
          </div>

          {/* Min/Max Length for text fields */}
          {["short_text", "long_text"].includes(selectedBlock.type) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="minLength" className="text-xs">
                  Min Length
                </Label>
                <Input
                  id="minLength"
                  type="number"
                  value={selectedBlock.validation?.minLength || ""}
                  onChange={(e) =>
                    handleUpdate({
                      validation: {
                        ...selectedBlock.validation,
                        minLength: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLength" className="text-xs">
                  Max Length
                </Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={selectedBlock.validation?.maxLength || ""}
                  onChange={(e) =>
                    handleUpdate({
                      validation: {
                        ...selectedBlock.validation,
                        maxLength: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="No maximum"
                />
              </div>
            </>
          )}

          {/* Min/Max for number fields */}
          {selectedBlock.type === "number" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="min" className="text-xs">
                  Min Value
                </Label>
                <Input
                  id="min"
                  type="number"
                  value={selectedBlock.validation?.min || ""}
                  onChange={(e) =>
                    handleUpdate({
                      validation: {
                        ...selectedBlock.validation,
                        min: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max" className="text-xs">
                  Max Value
                </Label>
                <Input
                  id="max"
                  type="number"
                  value={selectedBlock.validation?.max || ""}
                  onChange={(e) =>
                    handleUpdate({
                      validation: {
                        ...selectedBlock.validation,
                        max: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="No maximum"
                />
              </div>
            </>
          )}

          {/* Custom Error Message */}
          <div className="space-y-2">
            <Label htmlFor="errorMessage" className="text-xs">
              Custom Error Message
            </Label>
            <Input
              id="errorMessage"
              value={selectedBlock.validation?.errorMessage || ""}
              onChange={(e) =>
                handleUpdate({
                  validation: { ...selectedBlock.validation, errorMessage: e.target.value },
                })
              }
              placeholder="Default error message will be used"
            />
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 p-4">
          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hidden" className="text-xs font-medium">
                Hidden
              </Label>
              <p className="text-xs text-muted-foreground">Hide this field from respondents</p>
            </div>
            <Switch
              id="hidden"
              checked={selectedBlock.settings?.hidden || false}
              onCheckedChange={(checked) =>
                handleUpdate({
                  settings: { ...selectedBlock.settings, hidden: checked },
                })
              }
            />
          </div>

          {/* Size for text inputs */}
          {["short_text", "long_text", "email", "phone", "number"].includes(selectedBlock.type) && (
            <div className="space-y-2">
              <Label htmlFor="size" className="text-xs">
                Field Size
              </Label>
              <Select
                value={selectedBlock.settings?.size || "medium"}
                onValueChange={(value) =>
                  handleUpdate({
                    settings: { ...selectedBlock.settings, size: value },
                  })
                }
              >
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Layout for choice fields */}
          {["single_select", "multi_select"].includes(selectedBlock.type) && (
            <div className="space-y-2">
              <Label htmlFor="layout" className="text-xs">
                Layout
              </Label>
              <Select
                value={selectedBlock.settings?.layout || "vertical"}
                onValueChange={(value) =>
                  handleUpdate({
                    settings: { ...selectedBlock.settings, layout: value },
                  })
                }
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
