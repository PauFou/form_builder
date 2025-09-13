"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  GitBranch,
  Eye,
  EyeOff,
  SkipForward,
  ArrowRight,
  Edit2,
  Trash2,
  AlertCircle,
  PlayCircle,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { useFormBuilderStore } from "@/lib/stores/form-builder-store";
import { useFormBlocks } from "@/lib/hooks/use-form-blocks";
import type { LogicRule } from "@forms/contracts";
import { RuleBuilder } from "./rule-builder";
import { LogicGraph } from "./logic-graph";
import { FullScreenLogicGraph } from "./full-screen-logic-graph";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function LogicEditor() {
  const { form, updateForm, addLogicRule, updateLogicRule, deleteLogicRule, validateFormData, validationErrors } =
    useFormBuilderStore();
  const blocks = useFormBlocks();
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<LogicRule | null>(null);
  const [activeView, setActiveView] = useState<"list" | "graph">("list");
  const [showFullScreenGraph, setShowFullScreenGraph] = useState(false);
  
  // Check for logic cycles whenever rules change
  useEffect(() => {
    if (form?.logic?.rules && form.logic.rules.length > 0) {
      validateFormData();
    }
  }, [form?.logic?.rules, validateFormData]);

  const logic = form?.logic?.rules || [];
  const logicCycles = validationErrors?.filter(e => e.type === "logic_cycle") || [];

  const handleAddRule = () => {
    setEditingRule(null);
    setShowRuleBuilder(true);
  };

  const handleEditRule = (rule: LogicRule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleSaveRule = (rule: LogicRule) => {
    if (!form) return;

    if (editingRule) {
      updateLogicRule(rule.id, rule);
    } else {
      addLogicRule(rule);
    }

    setShowRuleBuilder(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!form) return;
    deleteLogicRule(ruleId);
  };

  const handleDuplicateRule = (rule: LogicRule) => {
    if (!form) return;

    const newRule: LogicRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    addLogicRule(newRule);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "show":
        return <Eye className="h-3 w-3" />;
      case "hide":
        return <EyeOff className="h-3 w-3" />;
      case "skip":
        return <SkipForward className="h-3 w-3" />;
      case "jump":
        return <ArrowRight className="h-3 w-3" />;
      default:
        return <GitBranch className="h-3 w-3" />;
    }
  };

  const getFieldLabel = (fieldId: string) => {
    const block = blocks.find((b) => b.id === fieldId);
    return block?.label || block?.question || fieldId;
  };

  if (showRuleBuilder) {
    return (
      <RuleBuilder
        rule={editingRule}
        onSave={handleSaveRule}
        onCancel={() => {
          setShowRuleBuilder(false);
          setEditingRule(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Form Logic</h2>
          <p className="text-muted-foreground">Create conditional rules to control form behavior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFullScreenGraph(true)}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Full-Screen Graph
          </Button>
          <Button onClick={handleAddRule}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {logicCycles.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Logic cycles detected!</strong> Your logic rules contain circular references that could create infinite loops:
            <ul className="mt-2 space-y-1">
              {logicCycles.map((error, index) => (
                <li key={index} className="text-sm">
                  • {error.message}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">Please review and fix these cycles before publishing.</p>
          </AlertDescription>
        </Alert>
      )}

      {logic.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No logic rules yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add logic rules to create dynamic form behavior based on user responses
            </p>
            <Button onClick={handleAddRule}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "list" | "graph")}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="graph">Graph View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {logic.map((rule) => (
                  <Card
                    key={rule.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedRule === rule.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedRule(rule.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            Rule #{logic.indexOf(rule) + 1}
                          </CardTitle>
                          <CardDescription>
                            {rule.conditions.length} condition
                            {rule.conditions.length !== 1 ? "s" : ""}, {rule.actions.length} action
                            {rule.actions.length !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRule(rule);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateRule(rule);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRule(rule.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Conditions */}
                      <div>
                        <p className="text-sm font-medium mb-2">If:</p>
                        <div className="space-y-1">
                          {rule.conditions.map((condition, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{getFieldLabel(condition.field)}</Badge>
                              <span className="text-muted-foreground">
                                {condition.operator.replace("_", " ")}
                              </span>
                              <Badge variant="secondary">{String(condition.value)}</Badge>
                              {idx < rule.conditions.length - 1 && (
                                <span className="text-muted-foreground">AND</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <p className="text-sm font-medium mb-2">Then:</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.actions.map((action, idx) => (
                            <Badge key={idx} variant="default">
                              {getActionIcon(action.type)}
                              <span className="ml-1">
                                {action.type} {getFieldLabel(action.target || "")}
                                {action.value && ` = ${action.value}`}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="graph" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <LogicGraph rules={logic} onEditRule={handleEditRule} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Help Section */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Logic rules are evaluated in order.</strong> When a condition is met, its actions
          are applied immediately. Use the graph view to visualize the flow of your form logic.
        </AlertDescription>
      </Alert>

      <FullScreenLogicGraph
        isOpen={showFullScreenGraph}
        onClose={() => setShowFullScreenGraph(false)}
      />
    </div>
  );
}
