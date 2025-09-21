"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  GitBranch,
  ArrowRight,
  Eye,
  EyeOff,
  SkipForward,
  Edit2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { useFormBuilderStore } from "@/lib/stores/form-builder-store";
import { useFormBlocks } from "@/lib/hooks/use-form-blocks";
import type { LogicRule } from "@skemya/contracts";

interface LogicGraphProps {
  rules: LogicRule[];
  onEditRule?: (rule: LogicRule) => void;
}

interface GraphNode {
  id: string;
  type: "field" | "condition" | "action";
  label: string;
  data: any;
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export function LogicGraph({ rules, onEditRule }: LogicGraphProps) {
  const { form } = useFormBuilderStore();
  const blocks = useFormBlocks();

  const { nodes, edges } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeId = 0;
    let edgeId = 0;

    // Create field nodes
    const fieldMap = new Map<string, GraphNode>();
    blocks.forEach((block, index) => {
      const node: GraphNode = {
        id: `field-${block.id}`,
        type: "field",
        label: block.label || block.question || block.id,
        data: block,
        x: 50,
        y: 100 + index * 120,
      };
      nodes.push(node);
      fieldMap.set(block.id, node);
    });

    // Process rules
    rules.forEach((rule, ruleIndex) => {
      const ruleX = 400 + ruleIndex * 350;

      // Create condition node
      const conditionNode: GraphNode = {
        id: `condition-${rule.id}`,
        type: "condition",
        label: `Rule ${ruleIndex + 1}`,
        data: rule,
        x: ruleX,
        y: 200 + ruleIndex * 200,
      };
      nodes.push(conditionNode);

      // Connect fields to conditions
      rule.conditions.forEach((condition) => {
        const sourceField = fieldMap.get(condition.field);
        if (sourceField) {
          edges.push({
            id: `edge-${edgeId++}`,
            source: sourceField.id,
            target: conditionNode.id,
            label: `${condition.operator} ${condition.value}`,
          });
        }
      });

      // Create action nodes and connect them
      rule.actions.forEach((action, actionIndex) => {
        const actionNode: GraphNode = {
          id: `action-${rule.id}-${actionIndex}`,
          type: "action",
          label: action.type,
          data: action,
          x: ruleX + 200,
          y: conditionNode.y + actionIndex * 80,
        };
        nodes.push(actionNode);

        // Connect condition to action
        edges.push({
          id: `edge-${edgeId++}`,
          source: conditionNode.id,
          target: actionNode.id,
        });

        // Connect action to target field
        const targetField = fieldMap.get(action.target || "");
        if (targetField) {
          edges.push({
            id: `edge-${edgeId++}`,
            source: actionNode.id,
            target: targetField.id,
            label: action.value ? `= ${action.value}` : undefined,
          });
        }
      });
    });

    return { nodes, edges };
  }, [rules, blocks]);

  const getNodeIcon = (node: GraphNode) => {
    if (node.type === "condition") {
      return <GitBranch className="h-4 w-4" />;
    }
    if (node.type === "action") {
      switch (node.data.type) {
        case "show":
          return <Eye className="h-4 w-4" />;
        case "hide":
          return <EyeOff className="h-4 w-4" />;
        case "skip":
        case "jump":
          return <SkipForward className="h-4 w-4" />;
        default:
          return <ArrowRight className="h-4 w-4" />;
      }
    }
    return <Circle className="h-3 w-3" />;
  };

  const getNodeColor = (node: GraphNode) => {
    switch (node.type) {
      case "field":
        return "bg-blue-100 border-blue-300 text-blue-900";
      case "condition":
        return "bg-amber-100 border-amber-300 text-amber-900";
      case "action":
        return "bg-green-100 border-green-300 text-green-900";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4" />
          <p>No logic rules to visualize</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <div className="relative p-6" style={{ width: "1200px", height: "800px" }}>
        {/* Render edges */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.x + 100;
            const y1 = sourceNode.y + 30;
            const x2 = targetNode.x;
            const y2 = targetNode.y + 30;

            // Simple curved path
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dr = Math.sqrt(dx * dx + dy * dy);
            const curve = dr * 0.3;

            return (
              <g key={edge.id}>
                <path
                  d={`M ${x1} ${y1} Q ${midX} ${midY - curve} ${x2} ${y2}`}
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - curve / 2}
                    textAnchor="middle"
                    className="fill-gray-600 text-xs"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute border-2 rounded-lg p-3 min-w-[120px] ${getNodeColor(node)}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
            }}
          >
            <div className="flex items-center gap-2">
              {getNodeIcon(node)}
              <span className="text-sm font-medium">{node.label}</span>
            </div>

            {node.type === "condition" && onEditRule && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm"
                onClick={() => onEditRule(node.data)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white border rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
              <span>Form Field</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
              <span>Condition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span>Action</span>
            </div>
          </div>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
