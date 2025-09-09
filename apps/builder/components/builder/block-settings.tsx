'use client';

import { Card } from '@forms/ui';
import { Button } from '@forms/ui';
import { Input } from '@forms/ui';
import { Label } from '@forms/ui';
import { Switch } from '@forms/ui';
import { Textarea } from '@forms/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@forms/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@forms/ui';
import { X, Plus, Trash2 } from 'lucide-react';
import { useFormBuilderStore } from '../../lib/stores/form-builder-store';
import { motion, AnimatePresence } from 'framer-motion';

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

  const block = form.pages.flatMap(p => p.blocks).find(b => b.id === selectedBlockId);
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => selectBlock(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-60px)]">
            <Tabs defaultValue="general" className="h-full">
              <TabsList className="w-full rounded-none">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="validation" className="flex-1">Validation</TabsTrigger>
                <TabsTrigger value="logic" className="flex-1">Logic</TabsTrigger>
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
                    value={block.description || ''}
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

                {/* Options for choice-based blocks */}
                {['single_select', 'multi_select', 'dropdown', 'ranking'].includes(block.type) && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {(block.options || []).map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(block.options || [])];
                              newOptions[index] = e.target.value;
                              updateBlock(block.id, { options: newOptions });
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newOptions = (block.options || []).filter((_, i) => i !== index);
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
                          const newOptions = [...(block.options || []), ''];
                          updateBlock(block.id, { options: newOptions });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* Scale/Rating specific settings */}
                {['scale', 'rating', 'nps'].includes(block.type) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="min">Minimum Value</Label>
                      <Input
                        id="min"
                        type="number"
                        value={block.min || 1}
                        onChange={(e) => updateBlock(block.id, { min: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max">Maximum Value</Label>
                      <Input
                        id="max"
                        type="number"
                        value={block.max || (block.type === 'nps' ? 10 : 5)}
                        onChange={(e) => updateBlock(block.id, { max: parseInt(e.target.value) })}
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="validation" className="p-4 space-y-4">
                {['text', 'long_text'].includes(block.type) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={block.validation?.find(v => v.type === 'min')?.value || ''}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const minIndex = validations.findIndex(v => v.type === 'min');
                          if (e.target.value) {
                            const minValidation = {
                              type: 'min' as const,
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
                        value={block.validation?.find(v => v.type === 'max')?.value || ''}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const maxIndex = validations.findIndex(v => v.type === 'max');
                          if (e.target.value) {
                            const maxValidation = {
                              type: 'max' as const,
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

                {block.type === 'number' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="minValue">Minimum Value</Label>
                      <Input
                        id="minValue"
                        type="number"
                        value={block.validation?.find(v => v.type === 'min')?.value || ''}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const minIndex = validations.findIndex(v => v.type === 'min');
                          if (e.target.value) {
                            const minValidation = {
                              type: 'min' as const,
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
                        value={block.validation?.find(v => v.type === 'max')?.value || ''}
                        onChange={(e) => {
                          const validations = block.validation || [];
                          const maxIndex = validations.findIndex(v => v.type === 'max');
                          if (e.target.value) {
                            const maxValidation = {
                              type: 'max' as const,
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
                    value={block.validation?.[0]?.message || ''}
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