"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Eye,
  EyeOff,
  Zap,
  Code,
  Settings,
} from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import type { LogicRule } from "@skemya/contracts";

export function LogicEditor() {
  const { form, addLogicRule, updateLogicRule, deleteLogicRule } = useFormBuilderStore();
  const [expandedRules, setExpandedRules] = useState<string[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  if (!form) return null;

  const allFields = form.pages.flatMap((page) =>
    page.blocks.map((block) => ({
      id: block.id,
      label: block.question || block.type,
      type: block.type,
    }))
  );

  const handleAddRule = () => {
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
          id: `act-${Date.now()}`,
          type: "show",
          target: "",
        },
      ],
    };
    addLogicRule(newRule);
    setSelectedRuleId(newRule.id);
  };

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const renderCondition = (rule: LogicRule, condition: any, index: number) => (
    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      {index > 0 && <span className="text-sm font-medium">AND</span>}

      <Select
        value={condition.field}
        onValueChange={(value) => {
          const newConditions = [...rule.conditions];
          newConditions[index].field = value;
          updateLogicRule(rule.id, { conditions: newConditions });
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {allFields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(value) => {
          const newConditions = [...rule.conditions];
          newConditions[index].operator = value;
          updateLogicRule(rule.id, { conditions: newConditions });
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">Equals</SelectItem>
          <SelectItem value="not_equals">Not Equals</SelectItem>
          <SelectItem value="contains">Contains</SelectItem>
          <SelectItem value="not_contains">Not Contains</SelectItem>
          <SelectItem value="greater_than">Greater Than</SelectItem>
          <SelectItem value="less_than">Less Than</SelectItem>
        </SelectContent>
      </Select>

      <Input
        className="flex-1"
        placeholder="Value"
        value={condition.value}
        onChange={(e) => {
          const newConditions = [...rule.conditions];
          newConditions[index].value = e.target.value;
          updateLogicRule(rule.id, { conditions: newConditions });
        }}
      />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const newConditions = rule.conditions.filter((_, i) => i !== index);
          updateLogicRule(rule.id, { conditions: newConditions });
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderAction = (rule: LogicRule, action: any, index: number) => (
    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      <Zap className="h-4 w-4 text-primary" />

      <Select
        value={action.type}
        onValueChange={(value) => {
          const newActions = [...rule.actions];
          newActions[index].type = value;
          updateLogicRule(rule.id, { actions: newActions });
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="show">Show</SelectItem>
          <SelectItem value="hide">Hide</SelectItem>
          <SelectItem value="skip">Skip to</SelectItem>
          <SelectItem value="jump">Jump to</SelectItem>
          <SelectItem value="set_value">Set Value</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={action.target}
        onValueChange={(value) => {
          const newActions = [...rule.actions];
          newActions[index].target = value;
          updateLogicRule(rule.id, { actions: newActions });
        }}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select target" />
        </SelectTrigger>
        <SelectContent>
          {allFields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {action.type === "set_value" && (
        <Input
          className="w-[200px]"
          placeholder="Value"
          value={action.value || ""}
          onChange={(e) => {
            const newActions = [...rule.actions];
            newActions[index].value = e.target.value;
            updateLogicRule(rule.id, { actions: newActions });
          }}
        />
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const newActions = rule.actions.filter((_, i) => i !== index);
          updateLogicRule(rule.id, { actions: newActions });
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderRule = (rule: LogicRule) => {
    const isExpanded = expandedRules.includes(rule.id);
    const isSelected = selectedRuleId === rule.id;

    return (
      <motion.div
        key={rule.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className={isSelected ? "ring-2 ring-primary" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => {
              toggleRuleExpanded(rule.id);
              setSelectedRuleId(rule.id);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <GitBranch className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Rule {rule.id.split("-")[1]}</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">{rule.conditions.length} conditions</Badge>
                <Badge variant="secondary">{rule.actions.length} actions</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLogicRule(rule.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {isExpanded && (
            <CardContent className="space-y-4">
              {/* Conditions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">When these conditions are met:</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newConditions = [
                        ...rule.conditions,
                        {
                          id: `cond-${Date.now()}`,
                          field: "",
                          operator: "equals",
                          value: "",
                        },
                      ];
                      updateLogicRule(rule.id, { conditions: newConditions });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Condition
                  </Button>
                </div>
                {rule.conditions.map((condition, index) => renderCondition(rule, condition, index))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Then perform these actions:</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newActions = [
                        ...rule.actions,
                        {
                          id: `act-${Date.now()}`,
                          type: "show",
                          target: "",
                        },
                      ];
                      updateLogicRule(rule.id, { actions: newActions });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Action
                  </Button>
                </div>
                {rule.actions.map((action, index) => renderAction(rule, action, index))}
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Logic Editor</h1>
          <p className="text-muted-foreground mt-1">
            Create conditional logic to control form behavior
          </p>
        </div>

        <Button onClick={handleAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="visual">
            <GitBranch className="h-4 w-4 mr-2" />
            Visual Editor
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-2" />
            Code View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-6 space-y-4">
          {form.logic?.rules?.length ? (
            form.logic.rules.map((rule) => renderRule(rule))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No logic rules yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Create rules to show/hide fields, skip pages, or perform actions based on user
                  responses
                </p>
                <Button onClick={handleAddRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="code" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <pre className="text-xs overflow-auto">{JSON.stringify(form.logic, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
