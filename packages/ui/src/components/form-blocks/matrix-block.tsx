'use client'

import { useState } from 'react'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MatrixBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      rows: Array<{ id: string; label: string }>
      columns: Array<{ id: string; label: string }>
      multiple?: boolean // Allow multiple selections per row
      minSelectionsPerRow?: number
      maxSelectionsPerRow?: number
    }
  }
  value?: Record<string, string | string[]> // { rowId: columnId(s) }
  onChange: (value: Record<string, string | string[]>) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

export function MatrixBlock({
  block,
  value = {},
  onChange,
  onError,
  disabled,
  className,
}: MatrixBlockProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleSingleChange = (rowId: string, columnId: string) => {
    const newValue = { ...value, [rowId]: columnId }
    onChange(newValue)
    setTouched({ ...touched, [rowId]: true })
    validateValue(newValue)
  }

  const handleMultipleChange = (rowId: string, columnId: string, checked: boolean) => {
    const currentValues = Array.isArray(value[rowId]) ? value[rowId] : []
    const newValues = checked
      ? [...currentValues, columnId]
      : currentValues.filter((id) => id !== columnId)

    const newValue = { ...value, [rowId]: newValues }
    onChange(newValue)
    setTouched({ ...touched, [rowId]: true })
    validateValue(newValue)
  }

  const validateValue = (val: Record<string, string | string[]>) => {
    if (block.properties.required) {
      const missingRows = block.properties.rows.filter((row) => {
        const rowValue = val[row.id]
        if (!rowValue) return true
        if (Array.isArray(rowValue) && rowValue.length === 0) return true
        return false
      })

      if (missingRows.length > 0) {
        onError?.(`Please answer all required questions`)
        return false
      }
    }

    if (block.properties.multiple) {
      for (const row of block.properties.rows) {
        const selections = val[row.id]
        if (Array.isArray(selections)) {
          const count = selections.length
          if (block.properties.minSelectionsPerRow && count < block.properties.minSelectionsPerRow) {
            onError?.(`Please select at least ${block.properties.minSelectionsPerRow} options for each question`)
            return false
          }
          if (block.properties.maxSelectionsPerRow && count > block.properties.maxSelectionsPerRow) {
            onError?.(`Please select at most ${block.properties.maxSelectionsPerRow} options for each question`)
            return false
          }
        }
      }
    }

    onError?.(null)
    return true
  }

  const isRowComplete = (rowId: string) => {
    const rowValue = value[rowId]
    if (!rowValue) return false
    if (Array.isArray(rowValue)) return rowValue.length > 0
    return true
  }

  const showError = block.properties.required && Object.values(touched).some(Boolean) &&
    block.properties.rows.some((row) => !isRowComplete(row.id))

  return (
    <div className={cn('space-y-4', className)}>
      {block.properties.label && (
        <Label className="text-base font-medium">
          {block.properties.label}
          {block.properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {block.properties.description && (
        <p className="text-sm text-gray-600">{block.properties.description}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 border-b-2 border-gray-200 bg-gray-50 min-w-[200px]">
                {/* Empty cell for row labels */}
              </th>
              {block.properties.columns.map((column) => (
                <th
                  key={column.id}
                  className="text-center p-3 border-b-2 border-gray-200 bg-gray-50 min-w-[120px]"
                >
                  <span className="text-sm font-medium">{column.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.properties.rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-gray-200',
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                )}
              >
                <td className="p-3 text-sm font-medium">
                  {row.label}
                  {block.properties.required && !isRowComplete(row.id) && touched[row.id] && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </td>
                {block.properties.columns.map((column) => (
                  <td key={column.id} className="text-center p-3">
                    {block.properties.multiple ? (
                      <Checkbox
                        checked={
                          Array.isArray(value[row.id]) &&
                          value[row.id].includes(column.id)
                        }
                        onCheckedChange={(checked) =>
                          handleMultipleChange(row.id, column.id, checked as boolean)
                        }
                        disabled={disabled}
                        className="mx-auto"
                      />
                    ) : (
                      <RadioGroup
                        value={value[row.id] as string}
                        onValueChange={(val) => handleSingleChange(row.id, val)}
                        disabled={disabled}
                      >
                        <div className="flex justify-center">
                          <RadioGroupItem
                            value={column.id}
                            className="mx-auto"
                          />
                        </div>
                      </RadioGroup>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showError && (
        <Alert variant="destructive">
          <AlertDescription>
            Please answer all required questions
          </AlertDescription>
        </Alert>
      )}

      {block.properties.multiple && (block.properties.minSelectionsPerRow || block.properties.maxSelectionsPerRow) && (
        <p className="text-xs text-gray-500">
          {block.properties.minSelectionsPerRow && block.properties.maxSelectionsPerRow ? (
            <>Select between {block.properties.minSelectionsPerRow} and {block.properties.maxSelectionsPerRow} options for each question</>
          ) : block.properties.minSelectionsPerRow ? (
            <>Select at least {block.properties.minSelectionsPerRow} option{block.properties.minSelectionsPerRow > 1 ? 's' : ''} for each question</>
          ) : (
            <>Select at most {block.properties.maxSelectionsPerRow} option{block.properties.maxSelectionsPerRow! > 1 ? 's' : ''} for each question</>
          )}
        </p>
      )}
    </div>
  )
}