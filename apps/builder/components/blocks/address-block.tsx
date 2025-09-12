import { Block } from "./types";

interface AddressBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function AddressBlock({ block, isSelected, isPreview }: AddressBlockProps) {
  const showLine2 = block.properties?.showLine2 ?? true;
  const defaultCountry = block.properties?.defaultCountry || "US";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Street address"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isSelected ? "border-blue-500" : "border-gray-300"
          } ${isPreview ? "pointer-events-none" : ""}`}
          disabled={isPreview}
        />
        {showLine2 && (
          <input
            type="text"
            placeholder="Apartment, suite, etc. (optional)"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSelected ? "border-blue-500" : "border-gray-300"
            } ${isPreview ? "pointer-events-none" : ""}`}
            disabled={isPreview}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="City"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSelected ? "border-blue-500" : "border-gray-300"
            } ${isPreview ? "pointer-events-none" : ""}`}
            disabled={isPreview}
          />
          <input
            type="text"
            placeholder="State / Province"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSelected ? "border-blue-500" : "border-gray-300"
            } ${isPreview ? "pointer-events-none" : ""}`}
            disabled={isPreview}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="ZIP / Postal code"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSelected ? "border-blue-500" : "border-gray-300"
            } ${isPreview ? "pointer-events-none" : ""}`}
            disabled={isPreview}
          />
          <select
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSelected ? "border-blue-500" : "border-gray-300"
            } ${isPreview ? "pointer-events-none" : ""}`}
            disabled={isPreview}
            defaultValue={defaultCountry}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="NL">Netherlands</option>
            <option value="BE">Belgium</option>
            <option value="CH">Switzerland</option>
          </select>
        </div>
      </div>
    </div>
  );
}
