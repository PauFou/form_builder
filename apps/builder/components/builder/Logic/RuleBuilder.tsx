"use client";

import React, { useState } from "react";
import { Plus, Trash2, GitBranch } from "lucide-react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@skemya/ui";
import { cn } from "../../../lib/utils";

interface LogicRule {
  id: string;
  name?: string;
  source_block_id: string;
  conditions: Condition[];
  conditionOperator: "AND" | "OR";
  actions: Action[];
}

interface Condition {
  id: string;
  field_id: string;
  operator: ConditionOperator;
  value: string;
}

interface Action {
  id: string;
  type: ActionType;
  target_block_id?: string;
  value?: any;
}

type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

type ActionType = "show" | "hide" | "jump" | "calculate" | "set_value";

interface RuleBuilderProps {
  blocks: any[];
  rules: LogicRule[];
  onChange: (rules: LogicRule[]) => void;
}

export function RuleBuilder({ blocks, rules, onChange }: RuleBuilderProps) {
  const [selectedRule, setSelectedRule] = useState<LogicRule | null>(
    rules[0] || null
  );

  const handleAddRule = () => {
    const newRule: LogicRule = {
      id: crypto.randomUUID(),
      source_block_id: blocks[0]?.id || "",
      conditions: [],
      conditionOperator: "AND",
      actions: [],
    };
    onChange([...rules, newRule]);
    setSelectedRule(newRule);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter((r) => r.id !== ruleId);
    onChange(updatedRules);
    if (selectedRule?.id === ruleId) {
      setSelectedRule(updatedRules[0] || null);
    }
  };

  const handleUpdateRule = (updates: Partial<LogicRule>) => {
    if (!selectedRule) return;

    const updatedRules = rules.map((r) =>
      r.id === selectedRule.id ? { ...r, ...updates } : r
    );
    onChange(updatedRules);
    setSelectedRule({ ...selectedRule, ...updates });
  };

  const handleAddCondition = () => {
    if (!selectedRule) return;

    const newCondition: Condition = {
      id: crypto.randomUUID(),
      field_id: blocks[0]?.id || "",
      operator: "equals",
      value: "",
    };

    handleUpdateRule({
      conditions: [...selectedRule.conditions, newCondition],
    });
  };

  const handleUpdateCondition = (
    conditionId: string,
    updates: Partial<Condition>
  ) => {
    if (!selectedRule) return;

    const updatedConditions = selectedRule.conditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c
    );

    handleUpdateRule({ conditions: updatedConditions });
  };

  const handleDeleteCondition = (conditionId: string) => {
    if (!selectedRule) return;

    handleUpdateRule({
      conditions: selectedRule.conditions.filter((c) => c.id !== conditionId),
    });
  };

  const handleAddAction = () => {
    if (!selectedRule) return;

    const newAction: Action = {
      id: crypto.randomUUID(),
      type: "show",
      target_block_id: blocks[0]?.id || "",
    };

    handleUpdateRule({
      actions: [...selectedRule.actions, newAction],
    });
  };

  const handleUpdateAction = (actionId: string, updates: Partial<Action>) => {
    if (!selectedRule) return;

    const updatedActions = selectedRule.actions.map((a) =>
      a.id === actionId ? { ...a, ...updates } : a
    );

    handleUpdateRule({ actions: updatedActions });
  };

  const handleDeleteAction = (actionId: string) => {
    if (!selectedRule) return;

    handleUpdateRule({
      actions: selectedRule.actions.filter((a) => a.id !== actionId),
    });
  };

  const operatorLabels: Record<ConditionOperator, string> = {
    equals: "Equals",
    not_equals: "Not equals",
    contains: "Contains",
    not_contains: "Does not contain",
    greater_than: "Greater than",
    less_than: "Less than",
    is_empty: "Is empty",
    is_not_empty: "Is not empty",
  };

  const actionLabels: Record<ActionType, string> = {
    show: "Show block",
    hide: "Hide block",
    jump: "Jump to block",
    calculate: "Calculate value",
    set_value: "Set value",
  };

  return (
    <div className="flex h-full">
      {/* Rules List */}
      <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Rules</h3>
          <Button
            onClick={handleAddRule}
            variant="youform-secondary"
            size="youform-sm"
            className="h-7 w-7 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors group",
                selectedRule?.id === rule.id
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setSelectedRule(rule)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {rule.name || `Rule ${index + 1}`}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRule(rule.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {rule.conditions.length} condition(s), {rule.actions.length} action(s)
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              No rules yet. Click + to create one.
            </div>
          )}
        </div>
      </div>

      {/* Rule Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedRule ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Rule Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Rule Name (Optional)</label>
              <Input
                value={selectedRule.name || ""}
                onChange={(e) => handleUpdateRule({ name: e.target.value })}
                placeholder="e.g., Show payment if amount > 100"
                className="text-sm"
              />
            </div>

            {/* Source Block */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">When this block changes</label>
              <Select
                value={selectedRule.source_block_id}
                onValueChange={(value) =>
                  handleUpdateRule({ source_block_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a block" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.question || block.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Conditions</label>
                <Button
                  onClick={handleAddCondition}
                  variant="youform-secondary"
                  size="youform-sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </Button>
              </div>

              {selectedRule.conditions.length > 0 && (
                <div className="space-y-3">
                  {selectedRule.conditions.map((condition, index) => (
                    <div key={condition.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      {index > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-gray-500">Match</span>
                          <Select
                            value={selectedRule.conditionOperator}
                            onValueChange={(value: "AND" | "OR") =>
                              handleUpdateRule({ conditionOperator: value })
                            }
                          >
                            <SelectTrigger className="h-7 w-20 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">AND</SelectItem>
                              <SelectItem value="OR">OR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid grid-cols-12 gap-2 items-start">
                        {/* Field */}
                        <div className="col-span-4">
                          <Select
                            value={condition.field_id}
                            onValueChange={(value) =>
                              handleUpdateCondition(condition.id, { field_id: value })
                            }
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                              {blocks.map((block) => (
                                <SelectItem key={block.id} value={block.id}>
                                  {block.question || block.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Operator */}
                        <div className="col-span-3">
                          <Select
                            value={condition.operator}
                            onValueChange={(value: ConditionOperator) =>
                              handleUpdateCondition(condition.id, { operator: value })
                            }
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(operatorLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Value */}
                        <div className="col-span-4">
                          {!["is_empty", "is_not_empty"].includes(condition.operator) && (
                            <Input
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, { value: e.target.value })
                              }
                              placeholder="Value"
                              className="text-xs"
                            />
                          )}
                        </div>

                        {/* Delete */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleDeleteCondition(condition.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedRule.conditions.length === 0 && (
                <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  No conditions yet. Add one to get started.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Then perform actions</label>
                <Button
                  onClick={handleAddAction}
                  variant="youform-secondary"
                  size="youform-sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Action
                </Button>
              </div>

              {selectedRule.actions.length > 0 && (
                <div className="space-y-3">
                  {selectedRule.actions.map((action) => (
                    <div key={action.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        {/* Action Type */}
                        <div className="col-span-5">
                          <Select
                            value={action.type}
                            onValueChange={(value: ActionType) =>
                              handleUpdateAction(action.id, { type: value })
                            }
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(actionLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Target Block */}
                        {["show", "hide", "jump"].includes(action.type) && (
                          <div className="col-span-6">
                            <Select
                              value={action.target_block_id || ""}
                              onValueChange={(value) =>
                                handleUpdateAction(action.id, { target_block_id: value })
                              }
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Select block" />
                              </SelectTrigger>
                              <SelectContent>
                                {blocks.map((block) => (
                                  <SelectItem key={block.id} value={block.id}>
                                    {block.question || block.type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Delete */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleDeleteAction(action.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedRule.actions.length === 0 && (
                <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  No actions yet. Add one to complete the rule.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Select a rule or create a new one to get started
          </div>
        )}
      </div>
    </div>
  );
}
