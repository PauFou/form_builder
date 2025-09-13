"use client";

import { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Input,
  Label,
} from "@forms/ui";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import type { Form, LogicRule, LogicCondition, LogicAction } from "@forms/contracts";

interface LogicEditorProps {
  form: Form | null;
  selectedBlockId: string | null;
  onUpdate: (rules: LogicRule[]) => void;
}

export function LogicEditor({ form, selectedBlockId, onUpdate }: LogicEditorProps) {
  const rules = form?.logic?.rules || [];
  const blockRules = rules.filter((rule) =>
    rule.actions.some((action) => action.target === selectedBlockId)
  );

  const allBlocks = form?.pages.flatMap((p) => p.blocks) || [];
  const currentBlock = allBlocks.find((b) => b.id === selectedBlockId);

  const addRule = () => {
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      conditions: [
        {
          id: `cond-${Date.now()}`,
          field: "",
          operator: "equals",
          value: "",
        },
      ],
      actions: [
        {
          id: `action-${Date.now()}`,
          type: "show",
          target: selectedBlockId || "",
        },
      ],
    };
    onUpdate([...rules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    const updated = rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule));
    onUpdate(updated);
  };

  const deleteRule = (ruleId: string) => {
    onUpdate(rules.filter((rule) => rule.id !== ruleId));
  };

  const addCondition = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const newCondition: LogicCondition = {
        id: `cond-${Date.now()}`,
        field: "",
        operator: "equals",
        value: "",
      };
      updateRule(ruleId, {
        conditions: [...rule.conditions, newCondition],
      });
    }
  };

  const updateCondition = (
    ruleId: string,
    conditionId: string,
    updates: Partial<LogicCondition>
  ) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updatedConditions = rule.conditions.map((cond) =>
        cond.id === conditionId ? { ...cond, ...updates } : cond
      );
      updateRule(ruleId, { conditions: updatedConditions });
    }
  };

  const deleteCondition = (ruleId: string, conditionId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule && rule.conditions.length > 1) {
      updateRule(ruleId, {
        conditions: rule.conditions.filter((c) => c.id !== conditionId),
      });
    }
  };

  const updateAction = (ruleId: string, actionId: string, updates: Partial<LogicAction>) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updatedActions = rule.actions.map((action) =>
        action.id === actionId ? { ...action, ...updates } : action
      );
      updateRule(ruleId, { actions: updatedActions });
    }
  };

  const getOperatorLabel = (operator: string): string => {
    const labels: Record<string, string> = {
      equals: "equals",
      not_equals: "does not equal",
      contains: "contains",
      not_contains: "does not contain",
      greater_than: "is greater than",
      less_than: "is less than",
    };
    return labels[operator] || operator;
  };

  return (
    <div className="space-y-3">
      {blockRules.map((rule) => (
        <Card key={rule.id}>
          <CardContent className="p-3 space-y-3">
            {/* Conditions */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">IF</Label>
              {rule.conditions.map((condition, index) => (
                <div key={condition.id} className="space-y-2">
                  {index > 0 && (
                    <div className="text-xs text-muted-foreground text-center">AND</div>
                  )}
                  <div className="flex items-center gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={(value) =>
                        updateCondition(rule.id, condition.id, { field: value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {allBlocks
                          .filter((b) => b.id !== selectedBlockId)
                          .map((block) => (
                            <SelectItem key={block.id} value={block.id}>
                              {block.question || block.id}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateCondition(rule.id, condition.id, { operator: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">not equals</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="not_contains">not contains</SelectItem>
                        <SelectItem value="greater_than">greater than</SelectItem>
                        <SelectItem value="less_than">less than</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(rule.id, condition.id, { value: e.target.value })
                      }
                      placeholder="Value"
                      className="flex-1"
                    />

                    {rule.conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCondition(rule.id, condition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => addCondition(rule.id)}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </Button>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-1">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">THEN</Label>
              {rule.actions
                .filter((action) => action.target === selectedBlockId)
                .map((action) => (
                  <div key={action.id} className="flex items-center gap-2">
                    <Select
                      value={action.type}
                      onValueChange={(value) => updateAction(rule.id, action.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">Show this field</SelectItem>
                        <SelectItem value="hide">Hide this field</SelectItem>
                        <SelectItem value="skip">Skip to next page</SelectItem>
                        <SelectItem value="jump">Jump to specific field</SelectItem>
                      </SelectContent>
                    </Select>

                    {action.type === "jump" && (
                      <Select
                        value={action.value || ""}
                        onValueChange={(value) => updateAction(rule.id, action.id, { value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent>
                          {allBlocks
                            .filter((b) => b.id !== selectedBlockId)
                            .map((block) => (
                              <SelectItem key={block.id} value={block.id}>
                                {block.question || block.id}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
            </div>

            {/* Delete Rule */}
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteRule(rule.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={addRule} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Logic Rule
      </Button>

      {blockRules.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No logic rules for this field
        </div>
      )}
    </div>
  );
}
