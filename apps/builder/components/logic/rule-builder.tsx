"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Save, X, AlertTriangle, Info } from "lucide-react";
import { useFormBuilderStore } from "@/lib/stores/form-builder-store";
import { useFormBlocks } from "@/lib/hooks/use-form-blocks";
import type { LogicRule, LogicCondition, LogicAction } from "@skemya/contracts";

interface RuleBuilderProps {
  rule?: LogicRule | null;
  onSave: (rule: LogicRule) => void;
  onCancel: () => void;
}

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
];

const ACTION_TYPES = [
  { value: "show", label: "Show field", icon: "👁️" },
  { value: "hide", label: "Hide field", icon: "🙈" },
  { value: "skip", label: "Skip to field", icon: "⏭️" },
  { value: "jump", label: "Jump to page", icon: "➡️" },
  { value: "set_value", label: "Set field value", icon: "✏️" },
];

export function RuleBuilder({ rule, onSave, onCancel }: RuleBuilderProps) {
  const { form } = useFormBuilderStore();
  const blocks = useFormBlocks();
  const [conditions, setConditions] = useState<LogicCondition[]>(
    rule?.conditions || [{ id: `cond-${Date.now()}`, field: "", operator: "equals", value: "" }]
  );
  const [actions, setActions] = useState<LogicAction[]>(
    rule?.actions || [{ id: `action-${Date.now()}`, type: "show", target: "" }]
  );
  const [errors, setErrors] = useState<string[]>([]);

  const availableFields = blocks.filter(
    (block) => block.type !== "text" && block.type !== "button"
  );

  const validateRule = (): boolean => {
    const newErrors: string[] = [];

    // Validate conditions
    conditions.forEach((condition, idx) => {
      if (!condition.field) {
        newErrors.push(`Condition ${idx + 1}: Please select a field`);
      }
      if (condition.value === "" || condition.value === null) {
        newErrors.push(`Condition ${idx + 1}: Please enter a value`);
      }
    });

    // Validate actions
    actions.forEach((action, idx) => {
      if (!action.target) {
        newErrors.push(`Action ${idx + 1}: Please select a target`);
      }
      if (action.type === "set_value" && !action.value) {
        newErrors.push(`Action ${idx + 1}: Please enter a value`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateRule()) return;

    const newRule: LogicRule = {
      id: rule?.id || `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conditions,
      actions,
    };

    onSave(newRule);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        field: "",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<LogicCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
    setErrors([]); // Clear errors on update
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "show",
        target: "",
      },
    ]);
  };

  const updateAction = (index: number, updates: Partial<LogicAction>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    setActions(updated);
    setErrors([]); // Clear errors on update
  };

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index));
    }
  };

  const getFieldType = (fieldId: string) => {
    const field = blocks.find((b) => b.id === fieldId);
    return field?.type || "text";
  };

  const getFieldLabel = (fieldId: string) => {
    const field = blocks.find((b) => b.id === fieldId);
    return field?.label || field?.question || fieldId;
  };

  const getValueInput = (condition: LogicCondition, index: number) => {
    const fieldType = getFieldType(condition.field);

    switch (fieldType) {
      case "checkbox":
      case "switch":
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(value) => updateCondition(index, { value: value === "true" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Checked</SelectItem>
              <SelectItem value="false">Unchecked</SelectItem>
            </SelectContent>
          </Select>
        );

      case "select":
      case "radio": {
        const field = blocks.find((b) => b.id === condition.field);
        const options = field?.properties?.options || [];
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(value) => updateCondition(index, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case "number":
      case "rating":
      case "scale":
        return (
          <Input
            type="number"
            value={String(condition.value || "")}
            onChange={(e) => updateCondition(index, { value: Number(e.target.value) })}
            placeholder="Enter number"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={String(condition.value || "")}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{rule ? "Edit Logic Rule" : "Create Logic Rule"}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conditions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conditions (IF)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <div key={index} className="space-y-3">
                    {index > 0 && (
                      <div className="flex items-center gap-2">
                        <Separator className="flex-1" />
                        <Badge variant="secondary" className="text-xs">
                          AND
                        </Badge>
                        <Separator className="flex-1" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label>Field</Label>
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(index, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label || field.question}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Operator</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value: any) =>
                            updateCondition(index, { operator: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Value</Label>
                        {condition.field ? (
                          getValueInput(condition, index)
                        ) : (
                          <Input disabled placeholder="Select field first" />
                        )}
                      </div>

                      {conditions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Condition
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button onClick={addCondition} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions (THEN)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={index} className="space-y-3">
                    {index > 0 && <Separator />}

                    <div className="space-y-3">
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={action.type}
                          onValueChange={(value: any) => updateAction(index, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <span className="flex items-center gap-2">
                                  <span>{type.icon}</span>
                                  <span>{type.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Target Field</Label>
                        <Select
                          value={action.target}
                          onValueChange={(value) => updateAction(index, { target: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label || field.question}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {action.type === "set_value" && (
                        <div>
                          <Label>Value</Label>
                          <Input
                            value={String(action.value || "")}
                            onChange={(e) => updateAction(index, { value: e.target.value })}
                            placeholder="Enter value"
                          />
                        </div>
                      )}

                      {actions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button onClick={addAction} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Help Text */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Rules are evaluated when users interact with the form. All conditions must be met (AND
          logic) for the actions to be executed. Actions are applied immediately when conditions are
          satisfied.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Rule
        </Button>
      </div>
    </div>
  );
}
