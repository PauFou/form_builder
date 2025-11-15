"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";

export function ConditionNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-lg shadow-sm min-w-[220px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-orange-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-orange-900 truncate">{data.label}</div>
          <div className="text-xs text-orange-600 mt-0.5">
            {data.operator && `${data.operator} ${data.value || "..."}`}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
