import { CreditCard, Shield } from "lucide-react";
import { Block } from "./types";

interface PaymentBlockProps {
  block: Block;
  isSelected?: boolean;
  isPreview?: boolean;
}

export function PaymentBlock({ block, isSelected, isPreview }: PaymentBlockProps) {
  const amount = block.properties?.amount || 0;
  const currency = block.properties?.currency || "USD";
  const currencySymbol = block.properties?.currencySymbol || "$";
  const description = block.properties?.paymentDescription || "";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-700">{block.question}</span>
        {block.required && <span className="text-red-500">*</span>}
      </div>
      {block.description && <p className="text-sm text-gray-600">{block.description}</p>}

      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Payment Amount</span>
          <span className="text-2xl font-semibold">
            {currencySymbol}
            {amount.toFixed(2)} {currency}
          </span>
        </div>

        {description && <p className="text-sm text-gray-600">{description}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Card Information</label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="1234 1234 1234 1234"
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected ? "border-blue-500" : "border-gray-300"
                } ${isPreview ? "pointer-events-none" : ""}`}
                disabled={isPreview}
              />
              <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="MM / YY"
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected ? "border-blue-500" : "border-gray-300"
              } ${isPreview ? "pointer-events-none" : ""}`}
              disabled={isPreview}
            />
            <input
              type="text"
              placeholder="CVC"
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected ? "border-blue-500" : "border-gray-300"
              } ${isPreview ? "pointer-events-none" : ""}`}
              disabled={isPreview}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-4 w-4" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}
