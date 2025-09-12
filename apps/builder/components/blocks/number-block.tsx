import { Block } from "./types";

interface NumberBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function NumberBlock({ block, isSelected, isPreview }: NumberBlockProps) {
  const placeholder = block.properties?.placeholder || "Enter a number";
  const min = block.properties?.min;
  const max = block.properties?.max;
  const step = block.properties?.step || 1;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <input
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isSelected ? "border-blue-500" : "border-gray-300"
        } ${isPreview ? "pointer-events-none" : ""}`}
        disabled={isPreview}
      />
    </div>
  );
}
