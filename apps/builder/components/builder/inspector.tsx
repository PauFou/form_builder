"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea,
  Label,
  Input,
  Textarea,
  Switch,
  Button,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@forms/ui";
import { Settings, Palette, Database, Plus, Trash2, AlertCircle } from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { generateFieldKey } from "../../lib/utils/slug";
import { ValidationEditor } from "./validation-editor";
import { ThemeEditor } from "./theme-editor";
import { LogicEditor } from "./logic-editor";
import { WebhookEditor } from "./webhook-editor";
import type { Block } from "@forms/contracts";

interface InspectorProps {
  className?: string;
}

export function Inspector({ className }: InspectorProps) {
  const { selectedBlockId, form, updateBlock, updateForm, updateTheme } = useFormBuilderStore();
  const [fieldKey, setFieldKey] = useState("");
  const [autoGenerateKey, setAutoGenerateKey] = useState(true);

  const selectedBlock = form?.pages.flatMap((p) => p.blocks).find((b) => b.id === selectedBlockId);

  // Get all existing field keys for uniqueness check
  const existingKeys = useMemo(
    () => form?.pages.flatMap((p) => p.blocks).map((b) => b.key || b.id) || [],
    [form]
  );

  // Auto-generate field key when label changes
  useEffect(() => {
    if (selectedBlock && autoGenerateKey && selectedBlock.question) {
      const newKey = generateFieldKey(
        selectedBlock.question,
        existingKeys.filter((k) => k !== (selectedBlock.key || selectedBlock.id))
      );
      setFieldKey(newKey);
    }
  }, [selectedBlock?.question, autoGenerateKey, existingKeys, selectedBlock]);

  // Update field key when block changes
  useEffect(() => {
    if (selectedBlock) {
      setFieldKey(selectedBlock.key || selectedBlock.id);
    }
  }, [selectedBlockId, selectedBlock]);

  const handleKeyChange = (value: string) => {
    setFieldKey(value);
    setAutoGenerateKey(false);
    if (selectedBlock) {
      updateBlock(selectedBlock.id, { key: value });
    }
  };

  const handleLabelChange = (value: string) => {
    if (selectedBlock) {
      updateBlock(selectedBlock.id, { question: value });
    }
  };

  if (!selectedBlock) {
    return (
      <div className={`border-l h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Select a block to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-l h-full ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inspector</h2>
          <span className="text-sm text-muted-foreground capitalize">
            {selectedBlock.type.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <Tabs defaultValue="field" className="h-[calc(100%-73px)]">
        <TabsList className="grid w-full grid-cols-3 px-4">
          <TabsTrigger value="field" className="gap-2">
            <Settings className="h-4 w-4" />
            Field
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100%-48px)]">
          {/* Field Tab */}
          <TabsContent value="field" className="p-4 space-y-4 mt-0">
            <div className="space-y-4">
              {/* Label */}
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={selectedBlock.question || ""}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Enter field label"
                />
              </div>

              {/* Field Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="key">Field Key</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-key" className="text-xs font-normal">
                      Auto-generate
                    </Label>
                    <Switch
                      id="auto-key"
                      checked={autoGenerateKey}
                      onCheckedChange={setAutoGenerateKey}
                      className="scale-75"
                    />
                  </div>
                </div>
                <Input
                  id="key"
                  value={fieldKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="field_key"
                  disabled={autoGenerateKey}
                  className={autoGenerateKey ? "opacity-60" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for API and integrations
                </p>
              </div>

              {/* Required */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="required">Required field</Label>
                  <p className="text-xs text-muted-foreground">Users must fill this field</p>
                </div>
                <Switch
                  id="required"
                  checked={selectedBlock.required || false}
                  onCheckedChange={(checked) =>
                    updateBlock(selectedBlock.id, { required: checked })
                  }
                />
              </div>

              <Separator />

              {/* Placeholder */}
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={selectedBlock.placeholder || ""}
                  onChange={(e) => updateBlock(selectedBlock.id, { placeholder: e.target.value })}
                  placeholder="Placeholder text"
                />
              </div>

              {/* Help Text */}
              <div className="space-y-2">
                <Label htmlFor="help">Help text</Label>
                <Textarea
                  id="help"
                  value={selectedBlock.helpText || ""}
                  onChange={(e) => updateBlock(selectedBlock.id, { helpText: e.target.value })}
                  placeholder="Add helpful instructions"
                  rows={2}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedBlock.description || ""}
                  onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })}
                  placeholder="Additional context or instructions"
                  rows={2}
                />
              </div>

              <Separator />

              {/* Validation */}
              <div className="space-y-2">
                <Label>Validation Rules</Label>
                <ValidationEditor
                  block={selectedBlock}
                  onUpdate={(validation) => updateBlock(selectedBlock.id, { validation })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="p-4 space-y-4 mt-0">
            <ThemeEditor form={form} onUpdateForm={updateForm} onUpdateTheme={updateTheme} />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="p-4 space-y-6 mt-0">
            {/* Logic Rules */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">Logic Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Show, hide, or skip this field based on conditions
                </p>
              </div>
              <LogicEditor
                form={form}
                selectedBlockId={selectedBlockId}
                onUpdate={(rules) => updateForm({ logic: { rules } })}
              />
            </div>

            <Separator />

            {/* Outcomes Mapping */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">Outcomes</h3>
                <p className="text-sm text-muted-foreground">Map responses to outcomes or scores</p>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Configure Outcomes
              </Button>
            </div>

            <Separator />

            {/* Webhooks */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">Webhooks</h3>
                <p className="text-sm text-muted-foreground">Send form data to external services</p>
              </div>
              <WebhookEditor form={form} onUpdate={(webhooks) => updateForm({ webhooks })} />
            </div>

            <Separator />

            {/* Tracking */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">Analytics</h3>
                <p className="text-sm text-muted-foreground">Custom tracking and analytics</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-id">Tracking ID</Label>
                <Input
                  id="tracking-id"
                  value={form?.trackingId || ""}
                  onChange={(e) => updateForm({ trackingId: e.target.value })}
                  placeholder="GA-XXXXXXXXX"
                />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
