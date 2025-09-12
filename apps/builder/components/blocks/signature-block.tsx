import { PenTool } from "lucide-react";
import { Block } from "./types";

interface SignatureBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function SignatureBlock({ block, isSelected, isPreview }: SignatureBlockProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div
        className={`relative border-2 rounded-lg bg-gray-50 transition-colors ${
          isSelected ? "border-blue-500" : "border-gray-300"
        } ${isPreview ? "cursor-default" : "cursor-crosshair"}`}
        style={{ height: "200px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <PenTool className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Click and drag to sign</p>
          </div>
        </div>
        {/* Signature canvas would be implemented here in the runtime */}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`text-sm text-blue-600 hover:text-blue-700 ${
            isPreview ? "pointer-events-none opacity-50" : ""
          }`}
          disabled={isPreview}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
