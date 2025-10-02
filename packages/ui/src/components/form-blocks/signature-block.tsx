'use client'

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Download, PenTool } from 'lucide-react'

interface SignatureBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      backgroundColor?: string
      penColor?: string
      width?: number
      height?: number
      allowDownload?: boolean
    }
  }
  value?: string // Base64 data URL
  onChange: (value: string | null) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

export function SignatureBlock({
  block,
  value,
  onChange,
  onError,
  disabled,
  className,
}: SignatureBlockProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 400, height: 200 })

  useEffect(() => {
    // Load existing signature if available
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value)
      setIsEmpty(false)
    }
  }, [value])

  useEffect(() => {
    // Handle responsive sizing
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const width = Math.min(
          containerWidth - 2, // Account for border
          block.properties.width || 400
        )
        const height = block.properties.height || 200
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [block.properties.width, block.properties.height])

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setIsEmpty(true)
      onChange(null)
      onError?.(null)
    }
  }

  const handleEnd = () => {
    setIsDrawing(false)
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL('image/png')
      onChange(dataUrl)
      setIsEmpty(false)
    }
  }

  const handleBegin = () => {
    setIsDrawing(true)
    onError?.(null)
  }

  const handleDownload = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataUrl = sigCanvas.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `signature-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    }
  }

  const isRequired = block.properties.required
  const hasError = isRequired && isEmpty && !isDrawing

  return (
    <div className={cn('space-y-2', className)}>
      {block.properties.label && (
        <Label className="text-base font-medium">
          {block.properties.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {block.properties.description && (
        <p className="text-sm text-gray-600">{block.properties.description}</p>
      )}

      <div ref={containerRef} className="space-y-2">
        <div
          className={cn(
            'border-2 rounded-lg relative overflow-hidden',
            hasError ? 'border-red-500' : 'border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            backgroundColor: block.properties.backgroundColor || '#ffffff',
          }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: dimensions.width,
              height: dimensions.height,
              className: 'touch-none',
              style: { display: 'block' },
            }}
            penColor={block.properties.penColor || '#000000'}
            onBegin={handleBegin}
            onEnd={handleEnd}
            backgroundColor={block.properties.backgroundColor || '#ffffff'}
          />

          {disabled && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50" />
          )}

          {isEmpty && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-400 flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                <span>Sign here</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || isEmpty}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>

          {block.properties.allowDownload && !isEmpty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
        </div>

        {hasError && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              Please provide your signature
            </AlertDescription>
          </Alert>
        )}
      </div>

    </div>
  )
}