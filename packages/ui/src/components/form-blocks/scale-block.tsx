'use client'

import { useState } from 'react'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ScaleBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      min?: number
      max?: number
      step?: number
      defaultValue?: number
      showValue?: boolean
      showLabels?: boolean
      minLabel?: string
      maxLabel?: string
      prefix?: string
      suffix?: string
      marks?: Array<{ value: number; label: string }>
    }
  }
  value?: number
  onChange: (value: number) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

export function ScaleBlock({
  block,
  value,
  onChange,
  onError,
  disabled,
  className,
}: ScaleBlockProps) {
  const min = block.properties.min ?? 0
  const max = block.properties.max ?? 100
  const step = block.properties.step ?? 1
  const [localValue, setLocalValue] = useState(
    value ?? block.properties.defaultValue ?? min
  )

  const handleChange = (newValue: number[]) => {
    const val = newValue[0]
    setLocalValue(val)
    onChange(val)
    onError?.(null)
  }

  const formatValue = (val: number) => {
    let formatted = val.toString()
    if (block.properties.prefix) formatted = block.properties.prefix + formatted
    if (block.properties.suffix) formatted = formatted + block.properties.suffix
    return formatted
  }

  const percentage = ((localValue - min) / (max - min)) * 100

  const marks = block.properties.marks || []
  const showDefaultMarks = !marks.length && block.properties.showLabels

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

      <div className="space-y-4">
        {block.properties.showValue && (
          <div className="text-center">
            <span className="text-3xl font-bold text-blue-600">
              {formatValue(localValue)}
            </span>
          </div>
        )}

        <div className="px-2">
          <div className="relative py-4">
            <Slider
              value={[localValue]}
              onValueChange={handleChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="w-full"
            />

            {/* Custom marks */}
            {marks.length > 0 && (
              <div className="absolute inset-x-0 top-0">
                {marks.map((mark) => {
                  const markPercentage = ((mark.value - min) / (max - min)) * 100
                  return (
                    <div
                      key={mark.value}
                      className="absolute"
                      style={{ left: `${markPercentage}%` }}
                    >
                      <div className="relative -translate-x-1/2">
                        <div className="w-1 h-2 bg-gray-400" />
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                          {mark.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Progress fill indicator */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 pointer-events-none transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Labels */}
          {(block.properties.showLabels || showDefaultMarks) && (
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{block.properties.minLabel || formatValue(min)}</span>
              <span>{block.properties.maxLabel || formatValue(max)}</span>
            </div>
          )}
        </div>

        {/* Visual feedback */}
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Current: {formatValue(localValue)}</span>
          </div>
          {value !== undefined && value !== localValue && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-gray-400">Previous: {formatValue(value)}</span>
            </div>
          )}
        </div>
      </div>

      {block.properties.required && value === undefined && (
        <Alert variant="destructive">
          <AlertDescription>Please select a value on the scale</AlertDescription>
        </Alert>
      )}
    </div>
  )
}