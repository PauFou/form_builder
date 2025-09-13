"use client";

import { Button } from "@forms/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormBuilderStore } from "../../lib/stores/form-builder-store";

export function PageNavigation() {
  const { form, selectedPageId, selectPage } = useFormBuilderStore();

  if (!form || form.pages.length <= 1) {
    return null;
  }

  const currentPageIndex = form.pages.findIndex((p) => p.id === selectedPageId);
  const currentPage = form.pages[currentPageIndex];
  const canGoPrevious = currentPageIndex > 0;
  const canGoNext = currentPageIndex < form.pages.length - 1;

  const goToPreviousPage = () => {
    if (canGoPrevious) {
      selectPage(form.pages[currentPageIndex - 1].id);
    }
  };

  const goToNextPage = () => {
    if (canGoNext) {
      selectPage(form.pages[currentPageIndex + 1].id);
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <Button variant="ghost" size="sm" onClick={goToPreviousPage} disabled={!canGoPrevious}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {currentPageIndex + 1} of {form.pages.length}
        </span>
        {currentPage?.title && (
          <>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm font-medium">{currentPage.title}</span>
          </>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={!canGoNext}>
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
