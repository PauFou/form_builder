'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { FormBlock } from '@/types/form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Lock } from 'lucide-react'

interface PaymentBlockProps {
  block: FormBlock & {
    properties: {
      amount?: number
      currency?: string
      description?: string
      label?: string
      stripePublicKey?: string
      allowCoupons?: boolean
      required?: boolean
    }
  }
  value?: {
    paymentIntentId?: string
    amount?: number
    status?: 'pending' | 'succeeded' | 'failed'
  }
  onChange: (value: any) => void
  onError?: (error: string | null) => void
  disabled?: boolean
  className?: string
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '')

function PaymentForm({
  block,
  value,
  onChange,
  onError,
  disabled,
  className,
}: PaymentBlockProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  const amount = appliedCoupon
    ? block.properties.amount! * (1 - appliedCoupon.percentOff / 100)
    : block.properties.amount!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || disabled) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Create payment intent on backend
      const response = await fetch('/api/v1/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency: block.properties.currency || 'usd',
          description: block.properties.description,
          coupon: appliedCoupon?.id,
        }),
      })

      const { clientSecret, intentId } = await response.json()

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
        onError?.(result.error.message || 'Payment failed')
      } else {
        onChange({
          paymentIntentId: intentId,
          amount: amount,
          status: 'succeeded',
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment processing failed'
      setError(message)
      onError?.(message)
    } finally {
      setProcessing(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      const response = await fetch('/api/v1/payments/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode }),
      })

      if (response.ok) {
        const coupon = await response.json()
        setAppliedCoupon(coupon)
        setError(null)
      } else {
        setError('Invalid coupon code')
      }
    } catch {
      setError('Failed to validate coupon')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {block.properties.label && (
        <Label className="text-base font-medium">
          {block.properties.label}
          {block.properties.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            {block.properties.description || 'Payment'}
          </span>
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: block.properties.currency || 'USD',
            }).format(amount)}
          </span>
        </div>

        {block.properties.allowCoupons && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              disabled={!!appliedCoupon || processing}
            />
            <Button
              type="button"
              variant="outline"
              onClick={applyCoupon}
              disabled={!!appliedCoupon || processing || !couponCode.trim()}
            >
              Apply
            </Button>
          </div>
        )}

        {appliedCoupon && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Coupon applied: {appliedCoupon.percentOff}% off
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Card Details</Label>
          <div className="p-3 border rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
                disabled: disabled || processing,
              }}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {value?.status === 'succeeded' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Payment completed successfully!
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={!stripe || processing || value?.status === 'succeeded'}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : value?.status === 'succeeded' ? (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Completed
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Pay {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: block.properties.currency || 'USD',
              }).format(amount)}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Powered by Stripe. Your payment info is secure and encrypted.
        </p>
      </div>
    </form>
  )
}

export function PaymentBlock(props: PaymentBlockProps) {
  const stripeKey = props.block.properties.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY

  if (!stripeKey) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Payment block is not configured. Please add a Stripe public key.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Elements stripe={loadStripe(stripeKey)}>
      <PaymentForm {...props} />
    </Elements>
  )
}