"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { FileText } from "lucide-react";

export function BlockNode({ data }: NodeProps) {
  // Determine node style based on type
  const isPink = data.blockType === "welcome" || data.blockType === "thankyou";
  const bgColor = isPink ? "#fce7f3" : "#dbeafe";
  const borderColor = isPink ? "#f9a8d4" : "#93c5fd";

  return (
    <div
      className="px-8 py-6 border-2 rounded-2xl shadow-md min-w-[280px] transition-all hover:shadow-lg"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="text-xl font-medium text-gray-900">
        {data.label}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
