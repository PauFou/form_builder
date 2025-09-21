"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Label,
  Switch,
  Button,
  Separator,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import { Settings, Palette, Shield, Trash2 } from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

export function PropertiesPanel() {
  const { selectedBlockId, form, updateBlock, deleteBlock } = useFormBuilderStore();

  const selectedBlock = form?.pages.flatMap((p) => p.blocks).find((b) => b.id === selectedBlockId);

  if (!selectedBlock) {
    return (
      <div className="border-l h-full flex items-center justify-center p-6">
        <p className="text-muted-foreground text-center">Select a block to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="border-l h-full">
      <ScrollArea className="h-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Block Properties</h2>
            <span className="text-sm text-muted-foreground capitalize">
              {selectedBlock.type.replace(/_/g, " ")}
            </span>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="logic">Logic</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={selectedBlock.question || ""}
                  onChange={(e) => updateBlock(selectedBlock.id, { question: e.target.value })}
                  placeholder="Enter your question"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedBlock.description || ""}
                  onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })}
                  placeholder="Add helpful text or instructions"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={selectedBlock.placeholder || ""}
                  onChange={(e) => updateBlock(selectedBlock.id, { placeholder: e.target.value })}
                  placeholder="Placeholder text"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="required">Required field</Label>
                <Switch
                  id="required"
                  checked={selectedBlock.required || false}
                  onCheckedChange={(checked) =>
                    updateBlock(selectedBlock.id, { required: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Add validation rules to ensure data quality
              </p>
              <Button variant="outline" className="w-full">
                Add Validation Rule
              </Button>
            </TabsContent>

            <TabsContent value="logic" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Control when this field is shown or hidden
              </p>
              <Button variant="outline" className="w-full">
                Add Logic Rule
              </Button>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => deleteBlock(selectedBlock.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Block
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
