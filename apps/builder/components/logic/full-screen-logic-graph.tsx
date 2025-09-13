"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@forms/ui";
import { Badge } from "@forms/ui";
import { Input } from "@forms/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@forms/ui";
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Maximize2,
  Move,
  ZoomIn,
  ZoomOut,
  GitBranch,
  Circle,
  Target,
  Flag,
  ArrowRight,
  Eye,
  EyeOff,
  SkipForward,
} from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";
import { CommandPalette } from "../builder/command-palette";
import type { LogicRule, LogicCondition, LogicAction } from "@forms/contracts";
import { cn } from "../../lib/utils";

interface Node {
  id: string;
  type: "start" | "field" | "condition" | "action" | "outcome" | "end";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: any;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

interface FullScreenLogicGraphProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullScreenLogicGraph({ isOpen, onClose }: FullScreenLogicGraphProps) {
  const { form, addLogicRule, updateLogicRule, deleteLogicRule } = useFormBuilderStore();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  // Initialize nodes and edges from form data
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Initialize graph from form data
  useEffect(() => {
    if (!form || !isOpen) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let edgeIdCounter = 0;

    // Start node
    newNodes.push({
      id: "start",
      type: "start",
      label: "Start",
      x: 100,
      y: 200,
      width: 80,
      height: 40,
    });

    // Field nodes from form pages
    let yOffset = 100;
    form.pages.forEach((page, pageIndex) => {
      page.blocks.forEach((block, blockIndex) => {
        newNodes.push({
          id: `field-${block.id}`,
          type: "field",
          label: block.question || `Field ${blockIndex + 1}`,
          x: 300 + pageIndex * 200,
          y: yOffset + blockIndex * 80,
          width: 150,
          height: 60,
          data: block,
        });
      });
      yOffset += page.blocks.length * 80 + 50;
    });

    // Logic rule nodes
    const logicRules = form.logic?.rules || [];
    logicRules.forEach((rule, ruleIndex) => {
      // Condition node
      const conditionNode: Node = {
        id: `condition-${rule.id}`,
        type: "condition",
        label: `Rule ${ruleIndex + 1}`,
        x: 600 + ruleIndex * 250,
        y: 150 + ruleIndex * 120,
        width: 120,
        height: 80,
        data: rule,
      };
      newNodes.push(conditionNode);

      // Connect fields that trigger this rule
      rule.conditions.forEach((condition) => {
        const sourceField = newNodes.find((n) => n.id === `field-${condition.field}`);
        if (sourceField) {
          newEdges.push({
            id: `edge-${edgeIdCounter++}`,
            source: sourceField.id,
            target: conditionNode.id,
            label: `${condition.operator} ${condition.value}`,
          });
        }
      });

      // Action nodes
      rule.actions.forEach((action, actionIndex) => {
        const actionNode: Node = {
          id: `action-${rule.id}-${actionIndex}`,
          type: "action",
          label: action.type,
          x: conditionNode.x + 180,
          y: conditionNode.y + actionIndex * 60 - 20,
          width: 100,
          height: 50,
          data: action,
        };
        newNodes.push(actionNode);

        // Connect condition to action
        newEdges.push({
          id: `edge-${edgeIdCounter++}`,
          source: conditionNode.id,
          target: actionNode.id,
        });

        // Connect action to target field if applicable
        if (action.target) {
          const targetField = newNodes.find((n) => n.id === `field-${action.target}`);
          if (targetField) {
            newEdges.push({
              id: `edge-${edgeIdCounter++}`,
              source: actionNode.id,
              target: targetField.id,
              label: action.value ? `= ${action.value}` : undefined,
            });
          }
        }
      });
    });

    // End node
    newNodes.push({
      id: "end",
      type: "end",
      label: "End",
      x: 1000,
      y: 200,
      width: 80,
      height: 40,
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [form, isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setSelectedNode(null);
      }
      if (e.key === "=" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === "-" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === "0" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleResetView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.1));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;

      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseUp = () => {
    isPanning.current = false;
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "start":
        return <Circle className="h-4 w-4" />;
      case "field":
        return <Target className="h-4 w-4" />;
      case "condition":
        return <GitBranch className="h-4 w-4" />;
      case "action":
        return <ArrowRight className="h-4 w-4" />;
      case "outcome":
        return <Flag className="h-4 w-4" />;
      case "end":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getNodeColor = (type: string, isSelected: boolean) => {
    const baseClasses = isSelected ? "ring-2 ring-primary shadow-lg" : "";

    switch (type) {
      case "start":
        return `bg-green-100 border-green-400 text-green-800 ${baseClasses}`;
      case "field":
        return `bg-blue-100 border-blue-400 text-blue-800 ${baseClasses}`;
      case "condition":
        return `bg-amber-100 border-amber-400 text-amber-800 ${baseClasses}`;
      case "action":
        return `bg-purple-100 border-purple-400 text-purple-800 ${baseClasses}`;
      case "outcome":
        return `bg-pink-100 border-pink-400 text-pink-800 ${baseClasses}`;
      case "end":
        return `bg-red-100 border-red-400 text-red-800 ${baseClasses}`;
      default:
        return `bg-gray-100 border-gray-400 text-gray-800 ${baseClasses}`;
    }
  };

  const renderMinimap = () => {
    if (!showMinimap) return null;

    const minimapScale = 0.1;
    const minimapWidth = 200;
    const minimapHeight = 150;

    return (
      <div className="absolute bottom-4 right-4 bg-white border rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <span className="text-xs font-medium">Minimap</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => setShowMinimap(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div
          className="relative bg-gray-100"
          style={{ width: minimapWidth, height: minimapHeight }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className={cn(
                "absolute border rounded",
                getNodeColor(node.type, false).split(" ").slice(0, 2).join(" ")
              )}
              style={{
                left: node.x * minimapScale,
                top: node.y * minimapScale,
                width: node.width * minimapScale,
                height: node.height * minimapScale,
              }}
            />
          ))}

          {/* Viewport indicator */}
          <div
            className="absolute border-2 border-red-500 bg-red-200 bg-opacity-20"
            style={{
              left: -pan.x * minimapScale,
              top: -pan.y * minimapScale,
              width: ((canvasRef.current?.clientWidth || 800) * minimapScale) / zoom,
              height: ((canvasRef.current?.clientHeight || 600) * minimapScale) / zoom,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Logic Flow Graph
          </DialogTitle>

          {/* Top toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md">
              <Button size="icon" variant="ghost" onClick={handleZoomOut}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="icon" variant="ghost" onClick={handleZoomIn}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button size="icon" variant="ghost" onClick={handleResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48"
              />
            </div>

            <Button size="sm" variant="outline" onClick={() => setIsCommandPaletteOpen(true)}>
              Add Rule <kbd className="ml-2">⌘K</kbd>
            </Button>

            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          <div
            ref={canvasRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div
              className="relative origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                width: "2000px",
                height: "1500px",
              }}
            >
              {/* Grid background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Render edges */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
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

                  const x1 = sourceNode.x + sourceNode.width;
                  const y1 = sourceNode.y + sourceNode.height / 2;
                  const x2 = targetNode.x;
                  const y2 = targetNode.y + targetNode.height / 2;

                  // Curved path
                  const midX = (x1 + x2) / 2;
                  const controlX1 = x1 + 50;
                  const controlX2 = x2 - 50;

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${x1} ${y1} C ${controlX1} ${y1} ${controlX2} ${y2} ${x2} ${y2}`}
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      {edge.label && (
                        <text
                          x={midX}
                          y={(y1 + y2) / 2 - 5}
                          textAnchor="middle"
                          className="fill-gray-600 text-xs font-medium"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Render nodes */}
              {nodes
                .filter(
                  (node) =>
                    !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      "absolute border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md",
                      getNodeColor(node.type, selectedNode === node.id)
                    )}
                    style={{
                      left: node.x,
                      top: node.y,
                      width: node.width,
                      height: node.height,
                    }}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-center gap-2 h-full">
                      {getNodeIcon(node.type)}
                      <span className="text-sm font-medium truncate">{node.label}</span>
                    </div>

                    {/* Show additional info for conditions */}
                    {node.type === "condition" && node.data && (
                      <div className="absolute -bottom-6 left-0 right-0 text-xs text-center">
                        <Badge variant="outline" className="text-xs">
                          {node.data.conditions?.length || 0} conditions
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Minimap */}
          {renderMinimap()}

          {/* Help text */}
          <div className="absolute bottom-4 left-4 bg-white border rounded-lg p-3 shadow-lg text-xs">
            <div className="space-y-1">
              <div>
                <kbd>⌘ + / ⌘ -</kbd> Zoom
              </div>
              <div>
                <kbd>⌘ 0</kbd> Reset view
              </div>
              <div>
                <kbd>⌘ K</kbd> Add rule
              </div>
              <div>
                <kbd>Drag</kbd> Pan canvas
              </div>
            </div>
          </div>
        </div>

        {/* Command palette for adding rules */}
        {isCommandPaletteOpen && (
          <CommandPalette
            onSave={() => setIsCommandPaletteOpen(false)}
            onPreview={() => {}}
            onPublish={() => {}}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

FullScreenLogicGraph.displayName = "FullScreenLogicGraph";
