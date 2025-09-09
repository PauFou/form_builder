'use client';

import { TabsContent, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Textarea } from '@forms/ui';
import { Plus } from 'lucide-react';
import { useFormBuilderStore } from '../../lib/stores/form-builder-store';
import { Block } from '@forms/contracts';

interface BlockInspectorProps {
  blockId: string;
}

export function BlockInspector({ blockId }: BlockInspectorProps) {
  const { form, updateBlock } = useFormBuilderStore();
  
  // Find the block across all pages
  let block: Block | undefined;
  form?.pages.forEach(page => {
    const found = page.blocks.find(b => b.id === blockId);
    if (found) block = found;
  });

  if (!block) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Block not found
      </div>
    );
  }

  return (
    <>
      <TabsContent value="field" className="p-4 space-y-4 m-0">
        <div>
          <Label htmlFor="question" className="text-sm font-medium mb-2 block">
            Question
          </Label>
          <Input
            id="question"
            value={block.question || ''}
            onChange={(e) => updateBlock(blockId, { question: e.target.value })}
            placeholder="Enter your question"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium mb-2 block">
            Description
          </Label>
          <Textarea
            id="description"
            value={block.description || ''}
            onChange={(e) => updateBlock(blockId, { description: e.target.value })}
            placeholder="Add a description to help respondents"
            rows={3}
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Switch
              checked={block.required || false}
              onCheckedChange={(checked) => updateBlock(blockId, { required: checked })}
            />
            <span className="text-sm">Required field</span>
          </Label>
        </div>

        {/* Options for select and checkbox_group blocks */}
        {(block.type === 'select' || block.type === 'checkbox_group') && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Options</Label>
            <div className="space-y-2">
              {(block.options || []).map((option, index) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...(block.options || [])];
                      newOptions[index] = { ...option, label: e.target.value };
                      updateBlock(blockId, { options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newOption = {
                    id: crypto.randomUUID(),
                    label: `Option ${(block.options?.length || 0) + 1}`,
                    value: `option_${(block.options?.length || 0) + 1}`
                  };
                  updateBlock(blockId, { 
                    options: [...(block.options || []), newOption] 
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add option
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="helpText" className="text-sm font-medium mb-2 block">
            Help text
          </Label>
          <Input
            id="helpText"
            value={block.helpText || ''}
            onChange={(e) => updateBlock(blockId, { helpText: e.target.value })}
            placeholder="Additional help text"
          />
        </div>
      </TabsContent>

      <TabsContent value="logic" className="p-4 space-y-4 m-0">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Visibility Conditions
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Show or hide this field based on previous answers
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add condition
          </Button>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Skip Logic
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Jump to a different page based on the answer
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add skip rule
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="design" className="p-4 space-y-4 m-0">
        <div>
          <Label htmlFor="width" className="text-sm font-medium mb-2 block">
            Field width
          </Label>
          <Select defaultValue="full">
            <SelectTrigger id="width">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full width</SelectItem>
              <SelectItem value="half">Half width</SelectItem>
              <SelectItem value="third">Third width</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="placeholder" className="text-sm font-medium mb-2 block">
            Placeholder text
          </Label>
          <Input
            id="placeholder"
            value={block.placeholder || ''}
            onChange={(e) => updateBlock(blockId, { placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">
            Custom CSS classes
          </Label>
          <Input
            placeholder="e.g., custom-field highlight"
            disabled
          />
        </div>
      </TabsContent>

      <TabsContent value="data" className="p-4 space-y-4 m-0">
        <div>
          <Label htmlFor="fieldKey" className="text-sm font-medium mb-2 block">
            Field key
          </Label>
          <Input
            id="fieldKey"
            value={block.key || block.id}
            onChange={(e) => updateBlock(blockId, { key: e.target.value })}
            className="font-mono text-sm"
            placeholder="e.g., customer_email"
          />
        </div>

        <div>
          <Label htmlFor="defaultValue" className="text-sm font-medium mb-2 block">
            Default value
          </Label>
          <Input
            id="defaultValue"
            value={block.defaultValue || ''}
            onChange={(e) => updateBlock(blockId, { defaultValue: e.target.value })}
            placeholder="Default value"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Switch />
            <span className="text-sm">Contains PII</span>
          </Label>
          <Label className="flex items-center gap-2">
            <Switch />
            <span className="text-sm">Exclude from analytics</span>
          </Label>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
            Internal notes
          </Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Notes for your team..."
          />
        </div>
      </TabsContent>
    </>
  );
}