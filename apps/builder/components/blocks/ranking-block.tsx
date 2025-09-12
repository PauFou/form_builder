import { GripVertical } from "lucide-react";
import { Block } from "./types";

interface RankingBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function RankingBlock({ block, isSelected, isPreview }: RankingBlockProps) {
  const options = block.properties?.options || [
    { id: "opt1", label: "Option 1", value: "option_1" },
    { id: "opt2", label: "Option 2", value: "option_2" },
    { id: "opt3", label: "Option 3", value: "option_3" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <p className="text-xs text-gray-500">Drag items to rank them from most to least important</p>
      <div className="space-y-2">
        {options.map((option: any, index: number) => (
          <div
            key={option.id}
            className={`flex items-center gap-3 p-3 border rounded-md bg-white transition-colors ${
              isSelected ? "border-blue-500" : "border-gray-300"
            } ${isPreview ? "cursor-default" : "cursor-move hover:border-gray-400"}`}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">{index + 1}</span>
            <span className="text-sm text-gray-700 flex-1">{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
