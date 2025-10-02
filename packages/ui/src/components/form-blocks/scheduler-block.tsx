'use client'

import { useState, useEffect } from 'react'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isAfter, isBefore } from 'date-fns'

interface SchedulerBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      minDate?: string
      maxDate?: string
      availableSlots?: Array<{
        date: string
        slots: Array<{
          id: string
          time: string
          available: boolean
        }>
      }>
      timeSlotDuration?: number // in minutes
      timezone?: string
      allowMultiple?: boolean
      maxSelections?: number
    }
  }
  value?: Array<{
    date: string
    slotId: string
    time: string
  }>
  onChange: (value: Array<{ date: string; slotId: string; time: string }>) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

export function SchedulerBlock({
  block,
  value = [],
  onChange,
  onError,
  disabled,
  className,
}: SchedulerBlockProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const minDate = block.properties.minDate ? new Date(block.properties.minDate) : new Date()
  const maxDate = block.properties.maxDate ? new Date(block.properties.maxDate) : addDays(new Date(), 365)

  const getAvailableSlots = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const availableSlot = block.properties.availableSlots?.find(
      (s) => s.date === dateStr
    )
    return availableSlot?.slots || generateDefaultSlots(date)
  }

  const generateDefaultSlots = (date: Date) => {
    // Generate default time slots if none provided
    const slots = []
    const startHour = 9
    const endHour = 17
    const duration = block.properties.timeSlotDuration || 30

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`
        slots.push({
          id: `${format(date, 'yyyy-MM-dd')}-${time}`,
          time,
          available: true,
        })
      }
    }
    return slots
  }

  const handleDateClick = (date: Date) => {
    if (isAfter(date, maxDate) || isBefore(date, minDate)) return
    setSelectedDate(date)
    onError?.(null)
  }

  const handleSlotClick = (slot: { id: string; time: string }) => {
    if (!selectedDate || !slot.available) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const newSelection = { date: dateStr, slotId: slot.id, time: slot.time }

    if (block.properties.allowMultiple) {
      const existingIndex = value.findIndex(
        (v) => v.date === dateStr && v.slotId === slot.id
      )

      if (existingIndex >= 0) {
        // Remove selection
        const newValue = value.filter((_, index) => index !== existingIndex)
        onChange(newValue)
      } else {
        // Add selection
        if (
          block.properties.maxSelections &&
          value.length >= block.properties.maxSelections
        ) {
          onError?.(`Maximum ${block.properties.maxSelections} selections allowed`)
          return
        }
        onChange([...value, newSelection])
      }
    } else {
      // Single selection
      onChange([newSelection])
    }
  }

  const isSlotSelected = (date: Date, slotId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return value.some((v) => v.date === dateStr && v.slotId === slotId)
  }

  const renderCalendar = () => {
    const monthStart = startOfWeek(currentMonth)
    const monthEnd = endOfWeek(addDays(currentMonth, 30))
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={disabled}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            type="button"
            onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={disabled}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-500 text-center py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isDisabled =
              isAfter(day, maxDate) ||
              isBefore(day, minDate) ||
              getAvailableSlots(day).every((s) => !s.available)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasSelection = value.some((v) => v.date === format(day, 'yyyy-MM-dd'))

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={disabled || isDisabled}
                className={cn(
                  'aspect-square p-2 text-sm rounded-lg transition-colors',
                  'hover:bg-blue-50 hover:text-blue-600',
                  isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                  isSelected && 'bg-blue-500 text-white hover:bg-blue-600',
                  hasSelection && !isSelected && 'bg-blue-100 text-blue-700',
                  format(day, 'M') !== format(currentMonth, 'M') && 'text-gray-300'
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderTimeSlots = () => {
    if (!selectedDate) return null

    const slots = getAvailableSlots(selectedDate)
    const dateStr = format(selectedDate, 'EEEE, MMMM d, yyyy')

    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Available times for {dateStr}
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isSelected = isSlotSelected(selectedDate, slot.id)

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleSlotClick(slot)}
                disabled={disabled || !slot.available}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-colors',
                  slot.available
                    ? 'hover:bg-blue-50 hover:border-blue-300'
                    : 'opacity-50 cursor-not-allowed bg-gray-50',
                  isSelected &&
                    'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                )}
              >
                {slot.time}
              </button>
            )
          })}
        </div>

        {slots.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No available time slots for this date
          </p>
        )}
      </div>
    )
  }

  const renderSelections = () => {
    if (value.length === 0) return null

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-blue-900 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Selected Time{value.length > 1 ? 's' : ''}:
        </h3>
        <div className="space-y-1">
          {value.map((selection, index) => (
            <div key={index} className="text-sm text-blue-800">
              {format(new Date(selection.date), 'EEEE, MMMM d, yyyy')} at{' '}
              {selection.time}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const showError = block.properties.required && value.length === 0

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

      <div className="grid md:grid-cols-2 gap-4">
        {renderCalendar()}
        {renderTimeSlots()}
      </div>

      {renderSelections()}

      {block.properties.timezone && (
        <p className="text-xs text-gray-500">
          All times shown in {block.properties.timezone}
        </p>
      )}

      {showError && (
        <Alert variant="destructive">
          <AlertDescription>Please select a time slot</AlertDescription>
        </Alert>
      )}
    </div>
  )
}