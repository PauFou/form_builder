import { Star } from "lucide-react";
import { Block } from "./types";

interface RatingBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function RatingBlock({ block, isSelected, isPreview }: RatingBlockProps) {
  const maxRating = block.properties?.maxRating || 5;
  const icon = block.properties?.icon || "star";
  const iconSize = block.properties?.iconSize || 24;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`p-1 rounded transition-colors ${
              isPreview ? "cursor-default" : "cursor-pointer hover:text-yellow-500"
            } text-gray-300`}
            disabled={isPreview}
          >
            <Star size={iconSize} className="fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
}
