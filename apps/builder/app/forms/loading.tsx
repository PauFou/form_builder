"use client";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function FormsLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text="Loading forms..." />
    </div>
  );
}
