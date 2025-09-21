"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
} from "@skemya/ui";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import {
  ValidationRule,
  ValidationType,
  COMMON_PATTERNS,
  DEFAULT_VALIDATION_MESSAGES,
} from "../../lib/types/validation";
import type { Block } from "@skemya/contracts";

interface ValidationEditorProps {
  block: Block;
  onUpdate: (validation: ValidationRule[]) => void;
}

export function ValidationEditor({ block, onUpdate }: ValidationEditorProps) {
  const validation: ValidationRule[] = block.validation || [];

  const addRule = () => {
    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      type: "min",
      value: "",
      message: "",
    };
    onUpdate([...validation, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    const updated = validation.map((rule: ValidationRule) =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    onUpdate(updated);
  };

  const deleteRule = (ruleId: string) => {
    onUpdate(validation.filter((rule: ValidationRule) => rule.id !== ruleId));
  };

  const getValidationTypes = (): ValidationType[] => {
    switch (block.type) {
      case "number":
      case "currency":
        return ["min", "max", "custom"];
      case "text":
      case "long_text":
      case "email":
      case "phone":
        return ["minLength", "maxLength", "pattern", "custom"];
      case "date":
        return ["min", "max", "custom"];
      default:
        return ["custom"];
    }
  };

  const getValueLabel = (type: ValidationType): string => {
    switch (type) {
      case "min":
        return block.type === "date" ? "Minimum date" : "Minimum value";
      case "max":
        return block.type === "date" ? "Maximum date" : "Maximum value";
      case "minLength":
        return "Minimum characters";
      case "maxLength":
        return "Maximum characters";
      case "pattern":
        return "Regex pattern";
      case "custom":
        return "Custom expression";
      default:
        return "Value";
    }
  };

  const getValueType = (type: ValidationType): string => {
    switch (type) {
      case "min":
      case "max":
        return block.type === "date" ? "date" : "number";
      case "minLength":
      case "maxLength":
        return "number";
      default:
        return "text";
    }
  };

  return (
    <div className="space-y-3">
      {validation.map((rule: ValidationRule) => (
        <Card key={rule.id}>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Rule Type */}
                <div className="space-y-2">
                  <Label htmlFor={`type-${rule.id}`}>Type</Label>
                  <Select
                    value={rule.type}
                    onValueChange={(value: ValidationType) => updateRule(rule.id, { type: value })}
                  >
                    <SelectTrigger id={`type-${rule.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getValidationTypes().map((type) => (
                        <SelectItem key={type} value={type}>
                          {type
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value */}
                <div className="space-y-2">
                  <Label htmlFor={`value-${rule.id}`}>{getValueLabel(rule.type)}</Label>
                  {rule.type === "pattern" ? (
                    <div className="space-y-2">
                      <Select
                        value={rule.pattern || "custom"}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            updateRule(rule.id, { pattern: "", value: "" });
                          } else {
                            const pattern = COMMON_PATTERNS[value as keyof typeof COMMON_PATTERNS];
                            updateRule(rule.id, {
                              pattern: value,
                              value: pattern.pattern,
                              message: pattern.message,
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COMMON_PATTERNS).map(([key, pattern]) => (
                            <SelectItem key={key} value={key}>
                              {pattern.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom pattern</SelectItem>
                        </SelectContent>
                      </Select>
                      {(!rule.pattern || rule.pattern === "custom") && (
                        <Input
                          id={`value-${rule.id}`}
                          type="text"
                          value={rule.value || ""}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder="Enter regex pattern"
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      id={`value-${rule.id}`}
                      type={getValueType(rule.type)}
                      value={rule.value || ""}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      placeholder={`Enter ${getValueLabel(rule.type).toLowerCase()}`}
                    />
                  )}
                </div>

                {/* Error Message */}
                <div className="space-y-2">
                  <Label htmlFor={`message-${rule.id}`}>Error message</Label>
                  <Input
                    id={`message-${rule.id}`}
                    value={rule.message || ""}
                    onChange={(e) => updateRule(rule.id, { message: e.target.value })}
                    placeholder={
                      DEFAULT_VALIDATION_MESSAGES[
                        rule.type as keyof typeof DEFAULT_VALIDATION_MESSAGES
                      ]?.replace("{{value}}", String(rule.value)) || ""
                    }
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteRule(rule.id)}
                className="ml-2 mt-6"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={addRule} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Validation Rule
      </Button>

      {validation.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          No validation rules configured
        </div>
      )}
    </div>
  );
}
