"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Download,
  Trash2,
  Tag,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@skemya/ui";
import { cn } from "../../../lib/utils";
import { format } from "date-fns";

interface Submission {
  id: string;
  completed_at: string;
  respondent_email?: string;
  respondent_name?: string;
  completion_time?: number;
  tags?: string[];
  answers: Record<string, any>;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  blocks: any[];
  onView: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onAddTags: (ids: string[], tags: string[]) => void;
  onExport: (ids: string[]) => void;
}

export function SubmissionsTable({
  submissions,
  blocks,
  onView,
  onDelete,
  onAddTags,
  onExport,
}: SubmissionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "completed_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Build columns dynamically from blocks
  const columns = React.useMemo<ColumnDef<Submission>[]>(() => {
    const baseColumns: ColumnDef<Submission>[] = [
      // Checkbox column
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 50,
      },

      // Submitted date
      {
        accessorKey: "completed_at",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Submitted
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="w-4 h-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return (
            <span className="text-sm text-gray-900">
              {format(new Date(date), "MMM d, yyyy HH:mm")}
            </span>
          );
        },
        size: 180,
      },
    ];

    // Add columns for each block's answer
    const answerColumns: ColumnDef<Submission>[] = blocks.slice(0, 5).map((block) => ({
      id: `answer_${block.id}`,
      header: () => (
        <div className="text-left">
          <div className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
            {block.question || block.type}
          </div>
          <div className="text-xs text-gray-500 capitalize">{block.type}</div>
        </div>
      ),
      cell: ({ row }) => {
        const answer = row.original.answers[block.id];
        if (!answer) return <span className="text-gray-400 text-sm">—</span>;

        // Format answer based on block type
        if (Array.isArray(answer)) {
          return (
            <span className="text-sm text-gray-900">{answer.join(", ")}</span>
          );
        }

        if (typeof answer === "object") {
          return (
            <span className="text-sm text-gray-900">
              {JSON.stringify(answer)}
            </span>
          );
        }

        const answerStr = String(answer);
        return (
          <span className="text-sm text-gray-900 truncate max-w-[200px] block">
            {answerStr.length > 50 ? `${answerStr.slice(0, 50)}...` : answerStr}
          </span>
        );
      },
      size: 220,
    }));

    // Completion time column
    const metaColumns: ColumnDef<Submission>[] = [
      {
        accessorKey: "completion_time",
        header: "Time",
        cell: ({ getValue }) => {
          const seconds = getValue() as number | undefined;
          if (!seconds) return <span className="text-gray-400 text-sm">—</span>;

          const minutes = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return (
            <span className="text-sm text-gray-900">
              {minutes > 0 ? `${minutes}m ` : ""}
              {secs}s
            </span>
          );
        },
        size: 100,
      },

      // Tags column
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ getValue }) => {
          const tags = getValue() as string[] | undefined;
          if (!tags || tags.length === 0) {
            return <span className="text-gray-400 text-sm">—</span>;
          }
          return (
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-xs text-gray-500">+{tags.length - 2}</span>
              )}
            </div>
          );
        },
        size: 150,
      },

      // Actions column
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => onView(row.original.id)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ),
        size: 100,
      },
    ];

    return [...baseColumns, ...answerColumns, ...metaColumns];
  }, [blocks, onView]);

  const table = useReactTable({
    data: submissions,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-200">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} {selectedCount === 1 ? "submission" : "submissions"}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="youform-secondary"
              size="youform-sm"
              onClick={() => onAddTags(selectedIds, [])}
              className="gap-2"
            >
              <Tag className="w-4 h-4" />
              Add Tags
            </Button>
            <Button
              variant="youform-secondary"
              size="youform-sm"
              onClick={() => onExport(selectedIds)}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="youform-destructive"
              size="youform-sm"
              onClick={() => {
                if (
                  confirm(
                    `Delete ${selectedCount} submission${selectedCount === 1 ? "" : "s"}?`
                  )
                ) {
                  onDelete(selectedIds);
                }
              }}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  row.getIsSelected() && "bg-blue-50"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 whitespace-nowrap"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No submissions found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
        <div className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              submissions.length
            )}
          </span>{" "}
          of <span className="font-medium">{submissions.length}</span> results
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="youform-secondary"
            size="youform-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="youform-secondary"
            size="youform-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
