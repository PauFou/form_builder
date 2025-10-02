'use client'

import { useState, useEffect } from 'react'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CurrencyBlockProps {
  block: FormBlock & {
    properties: {
      label?: string
      description?: string
      required?: boolean
      defaultCurrency?: string
      allowCurrencyChange?: boolean
      currencies?: string[]
      min?: number
      max?: number
      placeholder?: string
      decimalPlaces?: number
    }
  }
  value?: {
    amount?: number
    currency?: string
  }
  onChange: (value: { amount?: number; currency?: string }) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

const DEFAULT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
]

export function CurrencyBlock({
  block,
  value = {},
  onChange,
  onError,
  disabled,
  className,
}: CurrencyBlockProps) {
  const [localAmount, setLocalAmount] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const availableCurrencies = block.properties.currencies?.length
    ? DEFAULT_CURRENCIES.filter((c) => block.properties.currencies!.includes(c.code))
    : DEFAULT_CURRENCIES

  const currentCurrency = value.currency || block.properties.defaultCurrency || 'USD'
  const currencyInfo = DEFAULT_CURRENCIES.find((c) => c.code === currentCurrency)
  const decimalPlaces = block.properties.decimalPlaces ?? 2

  useEffect(() => {
    if (value.amount !== undefined) {
      setLocalAmount(value.amount.toFixed(decimalPlaces))
    }
  }, [value.amount, decimalPlaces])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // Allow empty input
    if (input === '') {
      setLocalAmount('')
      onChange({ ...value, amount: undefined })
      return
    }

    // Validate input format
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimalPlaces}}$`)
    if (regex.test(input)) {
      setLocalAmount(input)
      const amount = parseFloat(input)
      if (!isNaN(amount)) {
        onChange({ ...value, amount })
        validateAmount(amount)
      }
    }
  }

  const handleCurrencyChange = (currency: string) => {
    onChange({ ...value, currency })
    onError?.(null)
  }

  const handleBlur = () => {
    setTouched(true)
    if (localAmount && !isNaN(parseFloat(localAmount))) {
      const amount = parseFloat(localAmount)
      setLocalAmount(amount.toFixed(decimalPlaces))
      validateAmount(amount)
    }
  }

  const validateAmount = (amount: number) => {
    if (block.properties.required && !amount && amount !== 0) {
      onError?.('Please enter an amount')
      return false
    }

    if (block.properties.min !== undefined && amount < block.properties.min) {
      onError?.(`Amount must be at least ${formatCurrency(block.properties.min, currentCurrency)}`)
      return false
    }

    if (block.properties.max !== undefined && amount > block.properties.max) {
      onError?.(`Amount must be at most ${formatCurrency(block.properties.max, currentCurrency)}`)
      return false
    }

    onError?.(null)
    return true
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount)
  }

  const showError = touched && block.properties.required && !value.amount && value.amount !== 0

  return (
    <div className={cn('space-y-2', className)}>
      {block.properties.label && (
        <Label className="text-base font-medium">
          {block.properties.label}
          {block.properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {block.properties.description && (
        <p className="text-sm text-gray-600">{block.properties.description}</p>
      )}

      <div className="flex gap-2">
        {block.properties.allowCurrencyChange ? (
          <Select
            value={currentCurrency}
            onValueChange={handleCurrencyChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{currency.code}</span>
                    <span className="text-gray-500">{currency.symbol}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md border">
            <span className="font-mono text-sm">{currentCurrency}</span>
            <span className="ml-2 text-gray-500">{currencyInfo?.symbol}</span>
          </div>
        )}

        <div className="flex-1 relative">
          <Input
            type="text"
            inputMode="decimal"
            value={localAmount}
            onChange={handleAmountChange}
            onBlur={handleBlur}
            placeholder={block.properties.placeholder || '0.00'}
            disabled={disabled}
            className={cn(
              'pl-8',
              showError && 'border-red-500'
            )}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {currencyInfo?.symbol}
          </span>
        </div>
      </div>

      {value.amount !== undefined && value.amount !== 0 && (
        <p className="text-sm text-gray-600">
          Formatted: <span className="font-medium">{formatCurrency(value.amount, currentCurrency)}</span>
        </p>
      )}

      {showError && (
        <Alert variant="destructive">
          <AlertDescription>Please enter an amount</AlertDescription>
        </Alert>
      )}

      {(block.properties.min !== undefined || block.properties.max !== undefined) && (
        <p className="text-xs text-gray-500">
          {block.properties.min !== undefined && block.properties.max !== undefined ? (
            <>Amount must be between {formatCurrency(block.properties.min, currentCurrency)} and {formatCurrency(block.properties.max, currentCurrency)}</>
          ) : block.properties.min !== undefined ? (
            <>Minimum amount: {formatCurrency(block.properties.min, currentCurrency)}</>
          ) : (
            <>Maximum amount: {formatCurrency(block.properties.max!, currentCurrency)}</>
          )}
        </p>
      )}
    </div>
  )
}