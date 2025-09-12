"use client";

import { motion, AnimatePresence } from "framer-motion";

import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@forms/ui";
import { X, Plus, Trash2 } from "lucide-react";

import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

export function BlockSettings() {
  const { form, selectedBlockId, selectBlock, updateBlock } = useFormBuilderStore();

  if (!selectedBlockId || !form) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Select a block to edit its settings</p>
        </div>
      </Card>
    );
  }

  const block = form.pages.flatMap((p) => p.blocks).find((b) => b.id === selectedBlockId);
  if (!block) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedBlockId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full"
      >
        <Card className="h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Block Settings</h3>
            <Button size="sm" variant="ghost" onClick={() => selectBlock(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-60px)]">
            <Tabs defaultValue="general" className="h-full">
              <TabsList className="w-full rounded-none">
                <TabsTrigger value="general" className="flex-1">
                  General
                </TabsTrigger>
                <TabsTrigger value="validation" className="flex-1">
                  Validation
                </TabsTrigger>
                <TabsTrigger value="logic" className="flex-1">
                  Logic
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={block.question}
                    onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={block.description || ""}
                    onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                    placeholder="Add helpful text or instructions"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="required">Required</Label>
                  <Switch
                    id="required"
                    checked={block.required || false}
                    onCheckedChange={(checked) => updateBlock(block.id, { required: checked })}
                  />
                </div>

                {/* Placeholder for text inputs */}
                {["short_text", "long_text", "email", "phone", "number", "currency"].includes(
                  block.type
                ) && (
                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder</Label>
                    <Input
                      id="placeholder"
                      value={block.properties?.placeholder || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          properties: { ...block.properties, placeholder: e.target.value },
                        })
                      }
                      placeholder="Enter placeholder text"
                    />
                  </div>
                )}

                {/* Number specific settings */}
                {block.type === "number" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="step">Step</Label>
                      <Input
                        id="step"
                        type="number"
                        value={block.properties?.step || 1}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, step: parseFloat(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Currency specific settings */}
                {block.type === "currency" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={block.properties?.currency || "USD"}
                        onValueChange={(value) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, currency: value },
                          })
                        }
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CHF">CHF (Fr)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                          <SelectItem value="AUD">AUD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Phone specific settings */}
                {block.type === "phone" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="defaultCountry">Default Country</Label>
                      <Select
                        value={block.properties?.defaultCountry || "US"}
                        onValueChange={(value) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, defaultCountry: value },
                          })
                        }
                      >
                        <SelectTrigger id="defaultCountry">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
                          <SelectItem value="NL">Netherlands</SelectItem>
                          <SelectItem value="BE">Belgium</SelectItem>
                          <SelectItem value="CH">Switzerland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Address specific settings */}
                {block.type === "address" && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showLine2">Show Address Line 2</Label>
                      <Switch
                        id="showLine2"
                        checked={block.properties?.showLine2 ?? true}
                        onCheckedChange={(checked) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, showLine2: checked },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultCountry">Default Country</Label>
                      <Select
                        value={block.properties?.defaultCountry || "US"}
                        onValueChange={(value) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, defaultCountry: value },
                          })
                        }
                      >
                        <SelectTrigger id="defaultCountry">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
                          <SelectItem value="NL">Netherlands</SelectItem>
                          <SelectItem value="BE">Belgium</SelectItem>
                          <SelectItem value="CH">Switzerland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* File upload specific settings */}
                {block.type === "file_upload" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="accept">Accepted File Types</Label>
                      <Input
                        id="accept"
                        value={block.properties?.accept || "*"}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, accept: e.target.value },
                          })
                        }
                        placeholder="e.g., .pdf,.jpg,.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSize">Max File Size (MB)</Label>
                      <Input
                        id="maxSize"
                        type="number"
                        value={block.properties?.maxSize || 10}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, maxSize: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxFiles">Max Files</Label>
                      <Input
                        id="maxFiles"
                        type="number"
                        value={block.properties?.maxFiles || 1}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, maxFiles: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Options for choice-based blocks */}
                {[
                  "single_select",
                  "multi_select",
                  "select",
                  "checkbox_group",
                  "dropdown",
                  "ranking",
                ].includes(block.type) && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {(block.options || []).map((option, index) => (
                        <div key={option.id} className="flex gap-2">
                          <Input
                            value={option.label}
                            onChange={(e) => {
                              const newOptions = [...(block.options || [])];
                              newOptions[index] = { ...option, label: e.target.value };
                              updateBlock(block.id, { options: newOptions });
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newOptions = (block.options || []).filter(
                                (_, i) => i !== index
                              );
                              updateBlock(block.id, { options: newOptions });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const newOptions = [
                            ...(block.options || []),
                            {
                              id: `opt_${Date.now()}`,
                              label: "",
                              value: `option_${(block.options || []).length + 1}`,
                            },
                          ];
                          updateBlock(block.id, { options: newOptions });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* Choice layout options */}
                {["single_select", "multi_select", "checkbox_group"].includes(block.type) && (
                  <div className="space-y-2">
                    <Label htmlFor="layout">Layout</Label>
                    <Select
                      value={block.properties?.layout || "vertical"}
                      onValueChange={(value) =>
                        updateBlock(block.id, {
                          properties: { ...block.properties, layout: value },
                        })
                      }
                    >
                      <SelectTrigger id="layout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">Vertical</SelectItem>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Multi-select specific settings */}
                {block.type === "multi_select" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="minSelections">Min Selections</Label>
                      <Input
                        id="minSelections"
                        type="number"
                        value={block.properties?.minSelections || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: {
                              ...block.properties,
                              minSelections: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="No minimum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSelections">Max Selections</Label>
                      <Input
                        id="maxSelections"
                        type="number"
                        value={block.properties?.maxSelections || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: {
                              ...block.properties,
                              maxSelections: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                        placeholder="No maximum"
                      />
                    </div>
                  </>
                )}

                {/* Scale specific settings */}
                {block.type === "scale" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="min">Minimum Value</Label>
                      <Input
                        id="min"
                        type="number"
                        value={block.properties?.min || 1}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, min: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max">Maximum Value</Label>
                      <Input
                        id="max"
                        type="number"
                        value={block.properties?.max || 10}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, max: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="step">Step</Label>
                      <Input
                        id="step"
                        type="number"
                        value={block.properties?.step || 1}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, step: parseFloat(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showLabels">Show Labels</Label>
                      <Switch
                        id="showLabels"
                        checked={block.properties?.showLabels ?? true}
                        onCheckedChange={(checked) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, showLabels: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showValue">Show Current Value</Label>
                      <Switch
                        id="showValue"
                        checked={block.properties?.showValue ?? true}
                        onCheckedChange={(checked) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, showValue: checked },
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Rating specific settings */}
                {block.type === "rating" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="maxRating">Max Rating</Label>
                      <Input
                        id="maxRating"
                        type="number"
                        value={block.properties?.maxRating || 5}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: {
                              ...block.properties,
                              maxRating: parseInt(e.target.value),
                            },
                          })
                        }
                        min={1}
                        max={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iconSize">Icon Size</Label>
                      <Input
                        id="iconSize"
                        type="number"
                        value={block.properties?.iconSize || 24}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, iconSize: parseInt(e.target.value) },
                          })
                        }
                        min={16}
                        max={48}
                      />
                    </div>
                  </>
                )}

                {/* NPS specific settings */}
                {block.type === "nps" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="lowLabel">Low Label</Label>
                      <Input
                        id="lowLabel"
                        value={block.properties?.lowLabel || "Not at all likely"}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, lowLabel: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="highLabel">High Label</Label>
                      <Input
                        id="highLabel"
                        value={block.properties?.highLabel || "Extremely likely"}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            properties: { ...block.properties, highLabel: e.target.value },
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="validation" className="p-4 space-y-4">
                {["text", "long_text"].includes(block.type) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={block.validation?.find((v: any) => v.type === "min")?.value || ""}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const minIndex = validations.findIndex((v: any) => v.type === "min");
                          if (e.target.value) {
                            const minValidation = {
                              type: "min" as const,
                              value: parseInt(e.target.value),
                              message: `Minimum ${e.target.value} characters required`,
                            };
                            if (minIndex >= 0) {
                              validations[minIndex] = minValidation;
                            } else {
                              validations.push(minValidation);
                            }
                          } else if (minIndex >= 0) {
                            validations.splice(minIndex, 1);
                          }
                          updateBlock(block.id, { validation: validations });
                        }}
                        placeholder="No minimum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Maximum Length</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        value={block.validation?.find((v: any) => v.type === "max")?.value || ""}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const maxIndex = validations.findIndex((v: any) => v.type === "max");
                          if (e.target.value) {
                            const maxValidation = {
                              type: "max" as const,
                              value: parseInt(e.target.value),
                              message: `Maximum ${e.target.value} characters allowed`,
                            };
                            if (maxIndex >= 0) {
                              validations[maxIndex] = maxValidation;
                            } else {
                              validations.push(maxValidation);
                            }
                          } else if (maxIndex >= 0) {
                            validations.splice(maxIndex, 1);
                          }
                          updateBlock(block.id, { validation: validations });
                        }}
                        placeholder="No maximum"
                      />
                    </div>
                  </>
                )}

                {block.type === "number" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="minValue">Minimum Value</Label>
                      <Input
                        id="minValue"
                        type="number"
                        value={block.validation?.find((v: any) => v.type === "min")?.value || ""}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const minIndex = validations.findIndex((v: any) => v.type === "min");
                          if (e.target.value) {
                            const minValidation = {
                              type: "min" as const,
                              value: parseFloat(e.target.value),
                              message: `Value must be at least ${e.target.value}`,
                            };
                            if (minIndex >= 0) {
                              validations[minIndex] = minValidation;
                            } else {
                              validations.push(minValidation);
                            }
                          } else if (minIndex >= 0) {
                            validations.splice(minIndex, 1);
                          }
                          updateBlock(block.id, { validation: validations });
                        }}
                        placeholder="No minimum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxValue">Maximum Value</Label>
                      <Input
                        id="maxValue"
                        type="number"
                        value={block.validation?.find((v: any) => v.type === "max")?.value || ""}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const maxIndex = validations.findIndex((v: any) => v.type === "max");
                          if (e.target.value) {
                            const maxValidation = {
                              type: "max" as const,
                              value: parseFloat(e.target.value),
                              message: `Value must be at most ${e.target.value}`,
                            };
                            if (maxIndex >= 0) {
                              validations[maxIndex] = maxValidation;
                            } else {
                              validations.push(maxValidation);
                            }
                          } else if (maxIndex >= 0) {
                            validations.splice(maxIndex, 1);
                          }
                          updateBlock(block.id, { validation: validations });
                        }}
                        placeholder="No maximum"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="errorMessage">Custom Error Message</Label>
                  <Input
                    id="errorMessage"
                    value={block.validation?.[0]?.message || ""}
                    onChange={(e) => {
                      const validations = block.validation || [];
                      if (validations.length > 0) {
                        validations[0].message = e.target.value;
                        updateBlock(block.id, { validation: validations });
                      }
                    }}
                    placeholder="Use default error message"
                  />
                </div>
              </TabsContent>

              <TabsContent value="logic" className="p-4">
                <div className="text-center text-muted-foreground py-8">
                  <p>Logic rules coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
