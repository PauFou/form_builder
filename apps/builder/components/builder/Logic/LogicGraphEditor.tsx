"use client";

import React, { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Plus } from "lucide-react";
import { Button } from "@skemya/ui";
import { BlockNode } from "./nodes/BlockNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ActionNode } from "./nodes/ActionNode";

interface LogicGraphEditorProps {
  formId: string;
  blocks: any[];
  logicRules?: any[];
  onChange: (rules: any[]) => void;
}

// Define custom node types
const nodeTypes: NodeTypes = {
  block: BlockNode,
  condition: ConditionNode,
  action: ActionNode,
};

export function LogicGraphEditor({
  formId,
  blocks,
  logicRules = [],
  onChange,
}: LogicGraphEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Initialize nodes from blocks
  React.useEffect(() => {
    if (blocks.length > 0 && nodes.length === 0) {
      const initialNodes: Node[] = blocks.map((block, index) => ({
        id: block.id,
        type: "block",
        position: { x: 100, y: index * 120 },
        data: {
          label: block.question || block.type,
          blockType: block.type,
          blockId: block.id,
        },
      }));
      setNodes(initialNodes);
    }
  }, [blocks, nodes.length, setNodes]);

  // Initialize edges from logic rules
  React.useEffect(() => {
    if (logicRules.length > 0 && edges.length === 0) {
      const initialEdges: Edge[] = logicRules.flatMap((rule, ruleIndex) => {
        const ruleEdges: Edge[] = [];

        // Create condition node
        const conditionId = `condition-${rule.id || ruleIndex}`;

        // Edge from source block to condition
        if (rule.source_block_id) {
          ruleEdges.push({
            id: `${rule.source_block_id}-${conditionId}`,
            source: rule.source_block_id,
            target: conditionId,
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }

        // Edges from condition to actions
        if (rule.actions) {
          rule.actions.forEach((action: any, actionIndex: number) => {
            const actionId = `action-${conditionId}-${actionIndex}`;
            ruleEdges.push({
              id: `${conditionId}-${actionId}`,
              source: conditionId,
              target: actionId,
              type: "smoothstep",
              label: action.type,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            });

            // Edge from action to target block
            if (action.target_block_id) {
              ruleEdges.push({
                id: `${actionId}-${action.target_block_id}`,
                source: actionId,
                target: action.target_block_id,
                type: "smoothstep",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              });
            }
          });
        }

        return ruleEdges;
      });

      setEdges(initialEdges);
    }
  }, [logicRules, edges.length, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleAddCondition = () => {
    const newConditionNode: Node = {
      id: `condition-${Date.now()}`,
      type: "condition",
      position: { x: 400, y: 200 },
      data: {
        label: "New Condition",
        operator: "equals",
        value: "",
      },
    };
    setNodes((nds) => [...nds, newConditionNode]);
  };

  const handleAddAction = () => {
    const newActionNode: Node = {
      id: `action-${Date.now()}`,
      type: "action",
      position: { x: 700, y: 200 },
      data: {
        label: "New Action",
        actionType: "show",
        targetBlockId: null,
      },
    };
    setNodes((nds) => [...nds, newActionNode]);
  };

  const handleSave = () => {
    // Convert nodes and edges back to logic rules format
    const rules = edges
      .filter((edge) => edge.source && edge.target)
      .map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (sourceNode?.type === "block" && targetNode?.type === "condition") {
          // This is a rule
          return {
            source_block_id: sourceNode.id,
            conditions: targetNode.data,
            actions: edges
              .filter((e) => e.source === targetNode.id)
              .map((actionEdge) => {
                const actionNode = nodes.find((n) => n.id === actionEdge.target);
                return actionNode?.data;
              }),
          };
        }
        return null;
      })
      .filter(Boolean);

    onChange(rules);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Logic Graph</h3>
          <span className="text-xs text-gray-500">
            {nodes.length} nodes, {edges.length} connections
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddCondition}
            variant="youform-secondary"
            size="youform-sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Condition
          </Button>
          <Button
            onClick={handleAddAction}
            variant="youform-secondary"
            size="youform-sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </Button>
          <Button onClick={handleSave} variant="youform-primary" size="youform-sm">
            Save Logic
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1" style={{ backgroundColor: "#fafafa" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#1f2937", strokeWidth: 3 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#1f2937",
            },
          }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "block":
                  return "#dbeafe";
                case "condition":
                  return "#f59e0b";
                case "action":
                  return "#10b981";
                default:
                  return "#6b7280";
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Inspector Panel */}
      {selectedNode && (
        <div className="absolute right-4 top-20 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {selectedNode.type === "block" && "Block Properties"}
            {selectedNode.type === "condition" && "Condition Settings"}
            {selectedNode.type === "action" && "Action Settings"}
          </h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium">ID:</span> {selectedNode.id}
            </div>
            <div>
              <span className="font-medium">Type:</span> {selectedNode.type}
            </div>
            <div>
              <span className="font-medium">Label:</span> {selectedNode.data.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
