import { Upload } from "lucide-react";
import { Block } from "./types";

interface FileUploadBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function FileUploadBlock({ block, isSelected, isPreview }: FileUploadBlockProps) {
  const accept = block.properties?.accept || "*";
  const maxSize = block.properties?.maxSize || 10; // MB
  const maxFiles = block.properties?.maxFiles || 1;
  const allowMultiple = maxFiles > 1;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        } ${isPreview ? "cursor-default" : "cursor-pointer"}`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {allowMultiple
            ? `Drop files here or click to upload`
            : `Drop a file here or click to upload`}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {accept !== "*" && `Accepted formats: ${accept}`}
          {accept !== "*" && maxSize && " • "}
          {maxSize && `Max size: ${maxSize}MB`}
          {allowMultiple && ` • Up to ${maxFiles} files`}
        </p>
        <input
          type="file"
          accept={accept}
          multiple={allowMultiple}
          className="hidden"
          disabled={isPreview}
        />
      </div>
    </div>
  );
}
