import { Block } from "./types";

interface NPSBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function NPSBlock({ block, isSelected, isPreview }: NPSBlockProps) {
  const lowLabel = block.properties?.lowLabel || "Not at all likely";
  const highLabel = block.properties?.highLabel || "Extremely likely";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="space-y-3">
        <div className="flex gap-1 justify-between">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`flex-1 py-2 px-1 text-sm font-medium border rounded transition-colors ${
                isPreview
                  ? "cursor-default border-gray-200 text-gray-700"
                  : "cursor-pointer border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700"
              } ${isSelected ? "border-blue-500" : ""}`}
              disabled={isPreview}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </div>
  );
}
