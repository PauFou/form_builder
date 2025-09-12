import { Block } from "./types";

interface SingleSelectBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function SingleSelectBlock({ block, isSelected, isPreview }: SingleSelectBlockProps) {
  const options = block.properties?.options || [];
  const layout = block.properties?.layout || "vertical";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className={`${layout === "horizontal" ? "flex flex-wrap gap-4" : "space-y-2"}`}>
        {options.map((option: any, index: number) => (
          <label key={option.id || index} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`radio-${block.id}`}
              value={option.value}
              className={`w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 ${
                isPreview ? "pointer-events-none" : ""
              }`}
              disabled={isPreview}
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
