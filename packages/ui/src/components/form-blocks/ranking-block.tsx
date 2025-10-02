'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GripVertical } from 'lucide-react'

interface RankingBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      choices: Array<{ id: string; label: string }>
      minRankings?: number
      maxRankings?: number
      allowPartialRanking?: boolean
    }
  }
  value?: string[] // Array of choice IDs in ranked order
  onChange: (value: string[]) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

interface SortableItemProps {
  id: string
  label: string
  rank: number
  disabled?: boolean
}

function SortableItem({ id, label, rank, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm',
        'hover:shadow-md transition-shadow',
        isDragging && 'opacity-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        className={cn(
          'cursor-grab active:cursor-grabbing p-1',
          'hover:bg-gray-100 rounded',
          disabled && 'cursor-not-allowed'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-1 flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          #{rank}
        </span>
      </div>
    </div>
  )
}

export function RankingBlock({
  block,
  value = [],
  onChange,
  onError,
  disabled,
  className,
}: RankingBlockProps) {
  const [items, setItems] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    // Initialize items with value or default order
    if (value.length > 0) {
      setItems(value)
    } else {
      setItems(block.properties.choices.map((c) => c.id))
    }
  }, [value, block.properties.choices])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)
      onChange(newItems)
      validateRanking(newItems)
    }

    setActiveId(null)
  }

  const validateRanking = (ranking: string[]) => {
    if (block.properties.required && ranking.length === 0) {
      onError?.('Please rank the items')
      return false
    }

    if (
      block.properties.minRankings &&
      ranking.length < block.properties.minRankings
    ) {
      onError?.(
        `Please rank at least ${block.properties.minRankings} items`
      )
      return false
    }

    if (
      block.properties.maxRankings &&
      ranking.length > block.properties.maxRankings
    ) {
      onError?.(
        `Please rank at most ${block.properties.maxRankings} items`
      )
      return false
    }

    onError?.(null)
    return true
  }

  const getChoiceLabel = (id: string) => {
    return block.properties.choices.find((c) => c.id === id)?.label || ''
  }

  const activeItem = activeId
    ? block.properties.choices.find((c) => c.id === activeId)
    : null

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

      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {items.map((id, index) => (
              <SortableItem
                key={id}
                id={id}
                label={getChoiceLabel(id)}
                rank={index + 1}
                disabled={disabled}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeItem && (
              <div className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-lg">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <span className="font-medium">{activeItem.label}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {!disabled && (
        <p className="text-sm text-gray-500">
          Drag and drop items to rank them from most to least important
        </p>
      )}

      {block.properties.required && items.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>Please rank the items</AlertDescription>
        </Alert>
      )}
    </div>
  )
}