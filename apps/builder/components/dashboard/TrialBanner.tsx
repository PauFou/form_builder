import React from "react";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";

interface TrialBannerProps {
  daysLeft?: number;
  onDismiss?: () => void;
}

export function TrialBanner({ daysLeft = 2, onDismiss }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <div className="max-w-7xl mx-auto px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{daysLeft}-day free trial</span>
            <span className="text-sm opacity-90">•</span>
            <span className="text-sm opacity-90">Unlock all features with Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-semibold hover:underline inline-flex items-center gap-1"
            >
              Buy PRO
              <span className="text-lg">→</span>
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss trial banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
