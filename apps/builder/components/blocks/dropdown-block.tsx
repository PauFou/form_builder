import { ChevronDown } from "lucide-react";
import { Block } from "./types";

interface DropdownBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function DropdownBlock({ block, isSelected, isPreview }: DropdownBlockProps) {
  const placeholder = block.properties?.placeholder || "Select an option";
  const options = block.properties?.options || [];
  const searchable = block.properties?.searchable || false;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="relative">
        <select
          className={`w-full px-3 py-2 pr-10 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isSelected ? "border-blue-500" : "border-gray-300"
          } ${isPreview ? "pointer-events-none" : ""}`}
          disabled={isPreview}
          defaultValue=""
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option: any) => (
            <option key={option.id || option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {searchable && <p className="text-xs text-gray-500">Type to search options</p>}
    </div>
  );
}
