import { Block } from "./types";

interface ScaleBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function ScaleBlock({ block, isSelected, isPreview }: ScaleBlockProps) {
  const min = block.properties?.min || 1;
  const max = block.properties?.max || 10;
  const step = block.properties?.step || 1;
  const showLabels = block.properties?.showLabels ?? true;
  const showValue = block.properties?.showValue ?? true;

  const steps = Math.floor((max - min) / step) + 1;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="space-y-3">
        <div className="relative pt-6">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
              isPreview ? "pointer-events-none" : ""
            }`}
            disabled={isPreview}
          />
          {showLabels && (
            <div className="absolute w-full flex justify-between text-xs text-gray-500 -bottom-5">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          )}
        </div>
        {showValue && (
          <div className="text-center">
            <span className="text-2xl font-semibold text-gray-700">-</span>
          </div>
        )}
      </div>
    </div>
  );
}
