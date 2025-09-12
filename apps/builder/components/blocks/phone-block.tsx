import { Block } from "./types";

interface PhoneBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function PhoneBlock({ block, isSelected, isPreview }: PhoneBlockProps) {
  const placeholder = block.properties?.placeholder || "+1 (555) 123-4567";
  const defaultCountry = block.properties?.defaultCountry || "US";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <input
        type="tel"
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isSelected ? "border-blue-500" : "border-gray-300"
        } ${isPreview ? "pointer-events-none" : ""}`}
        disabled={isPreview}
      />
    </div>
  );
}
