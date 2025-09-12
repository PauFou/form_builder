import { Block } from "./types";

interface MatrixBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function MatrixBlock({ block, isSelected, isPreview }: MatrixBlockProps) {
  const rows = block.properties?.rows || [
    { id: "row1", label: "Row 1" },
    { id: "row2", label: "Row 2" },
  ];
  const columns = block.properties?.columns || [
    { id: "col1", label: "Column 1" },
    { id: "col2", label: "Column 2" },
  ];
  const multipleChoice = block.properties?.multipleChoice || false;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left"></th>
              {columns.map((column: any) => (
                <th key={column.id} className="p-2 text-center text-sm font-medium text-gray-700">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="p-2 text-sm text-gray-700">{row.label}</td>
                {columns.map((column: any) => (
                  <td key={column.id} className="p-2 text-center">
                    <input
                      type={multipleChoice ? "checkbox" : "radio"}
                      name={multipleChoice ? undefined : `matrix-${block.id}-${row.id}`}
                      className={`w-4 h-4 ${
                        multipleChoice ? "rounded" : ""
                      } text-blue-600 focus:ring-2 focus:ring-blue-500 ${
                        isPreview ? "pointer-events-none" : ""
                      }`}
                      disabled={isPreview}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
