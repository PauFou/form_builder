'use client'

import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface NPSBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      notLikelyLabel?: string
      extremelyLikelyLabel?: string
      showLabels?: boolean
      showFollowUp?: boolean
      followUpQuestion?: string
    }
  }
  value?: {
    score?: number
    feedback?: string
  }
  onChange: (value: { score?: number; feedback?: string }) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

export function NPSBlock({
  block,
  value = {},
  onChange,
  onError,
  disabled,
  className,
}: NPSBlockProps) {
  const handleScoreChange = (score: number) => {
    onChange({ ...value, score })
    onError?.(null)
  }

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, feedback: e.target.value })
  }

  const getScoreColor = (score: number) => {
    if (score <= 6) return 'bg-red-500 hover:bg-red-600 text-white'
    if (score <= 8) return 'bg-yellow-500 hover:bg-yellow-600 text-white'
    return 'bg-green-500 hover:bg-green-600 text-white'
  }

  const getSelectedColor = (score: number) => {
    if (score <= 6) return 'ring-red-500 bg-red-500 text-white'
    if (score <= 8) return 'ring-yellow-500 bg-yellow-500 text-white'
    return 'ring-green-500 bg-green-500 text-white'
  }

  const showError = block.properties.required && !value.score && !disabled

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
        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
          <span>{block.properties.notLikelyLabel || 'Not at all likely'}</span>
          <span>{block.properties.extremelyLikelyLabel || 'Extremely likely'}</span>
        </div>

        <div className="grid grid-cols-11 gap-1 sm:gap-2">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handleScoreChange(i)}
              className={cn(
                'aspect-square rounded-lg font-medium transition-all duration-200',
                'border-2 border-transparent',
                'flex items-center justify-center text-sm sm:text-base',
                value.score === i
                  ? cn('ring-2 ring-offset-2', getSelectedColor(i))
                  : cn(
                      'bg-gray-100 hover:bg-gray-200 text-gray-700',
                      disabled && 'cursor-not-allowed opacity-50'
                    )
              )}
            >
              {i}
            </button>
          ))}
        </div>

        {block.properties.showLabels && (
          <div className="grid grid-cols-11 gap-1 sm:gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'text-xs text-center',
                  value.score === i ? 'font-semibold' : 'text-gray-400'
                )}
              >
                {i}
              </div>
            ))}
          </div>
        )}

        {value.score !== undefined && (
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">You selected: </span>
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getScoreColor(value.score))}>
              {value.score}
            </span>
            <span className="text-sm text-gray-600 ml-2">
              ({value.score <= 6 ? 'Detractor' : value.score <= 8 ? 'Passive' : 'Promoter'})
            </span>
          </div>
        )}
      </div>

      {block.properties.showFollowUp && value.score !== undefined && (
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor={`${block.id}-feedback`} className="text-sm font-medium">
            {block.properties.followUpQuestion ||
              (value.score <= 6
                ? 'What can we do to improve?'
                : value.score <= 8
                ? 'What would make you more likely to recommend us?'
                : 'What do you like most about us?')}
          </Label>
          <textarea
            id={`${block.id}-feedback`}
            value={value.feedback || ''}
            onChange={handleFeedbackChange}
            disabled={disabled}
            rows={3}
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'resize-none'
            )}
            placeholder="Your feedback helps us improve..."
          />
        </div>
      )}

      {showError && (
        <Alert variant="destructive">
          <AlertDescription>Please select a score from 0 to 10</AlertDescription>
        </Alert>
      )}
    </div>
  )
}