import { Block } from "./types";

interface StatementBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function StatementBlock({ block, isSelected, isPreview }: StatementBlockProps) {
  const content = block.properties?.content || block.question;
  const alignment = block.properties?.alignment || "left";

  return (
    <div
      className={`p-4 rounded-md transition-colors ${
        isSelected ? "bg-blue-50 border border-blue-200" : ""
      }`}
    >
      <div
        className={`prose prose-sm max-w-none ${
          alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
