"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button, Skeleton } from "@forms/ui";
import { ArrowLeft, Download, Share2 } from "lucide-react";

import { formsApi } from "../../../../lib/api/forms";
import { AnalyticsDashboard } from "../../../../components/analytics/analytics-dashboard";

export default function FormAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const {
    data: form,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["form", id],
    queryFn: () => formsApi.get(id),
  });

  if (error) {
    notFound();
  }

  const handleExport = async () => {
    // TODO: Implement analytics export
    console.log("Export analytics for form:", id);
  };

  const handleShare = async () => {
    // TODO: Implement share analytics dashboard
    console.log("Share analytics for form:", id);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/forms/${id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">{form?.title} - Analytics</h1>
                {form?.description && <p className="text-muted-foreground">{form.description}</p>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : form ? (
        <AnalyticsDashboard formId={id} />
      ) : null}
    </div>
  );
}
