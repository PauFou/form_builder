"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Zap, Eye, EyeOff, ArrowRight } from "lucide-react";

const actionIcons = {
  show: Eye,
  hide: EyeOff,
  jump: ArrowRight,
  calculate: Zap,
};

export function ActionNode({ data }: NodeProps) {
  const Icon = actionIcons[data.actionType as keyof typeof actionIcons] || Zap;

  return (
    <div className="px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-green-900 truncate">
            {data.label}
          </div>
          <div className="text-xs text-green-600 mt-0.5 capitalize">
            {data.actionType}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
