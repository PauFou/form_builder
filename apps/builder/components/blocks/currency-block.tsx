import { Block } from "./types";

interface CurrencyBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function CurrencyBlock({ block, isSelected, isPreview }: CurrencyBlockProps) {
  const placeholder = block.properties?.placeholder || "0.00";
  const currency = block.properties?.currency || "USD";
  const currencySymbol = block.properties?.currencySymbol || "$";
  const min = block.properties?.min;
  const max = block.properties?.max;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {currencySymbol}
        </span>
        <input
          type="number"
          placeholder={placeholder}
          min={min}
          max={max}
          step="0.01"
          className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isSelected ? "border-blue-500" : "border-gray-300"
          } ${isPreview ? "pointer-events-none" : ""}`}
          disabled={isPreview}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {currency}
        </span>
      </div>
    </div>
  );
}
