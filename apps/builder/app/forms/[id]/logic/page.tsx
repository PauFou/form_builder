"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid, List } from "lucide-react";
import { Button } from "@skemya/ui";
import { cn } from "../../../../lib/utils";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { formsApi } from "../../../../lib/api/forms";
import { toast } from "react-hot-toast";
import { LogicGraphEditor } from "../../../../components/builder/Logic/LogicGraphEditor";
import { RuleBuilder } from "../../../../components/builder/Logic/RuleBuilder";

type ViewMode = "graph" | "list";

export default function FormLogicPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const { form, setForm, updateForm } = useFormBuilderStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await formsApi.get(formId);
        setForm(response.data);
      } catch (error) {
        console.error("Failed to load form:", error);
        toast.error("Failed to load form");
      }
    };

    if (formId) {
      loadForm();
    }
  }, [formId, setForm]);

  const blocks = form?.pages?.flatMap((page) => page.blocks) || [];
  const logicRules = form?.logic_rules || [];

  const handleUpdateLogic = async (rules: any[]) => {
    if (form) {
      try {
        updateForm({ logic_rules: rules });
        await formsApi.update(formId, { logic_rules: rules });
        toast.success("Logic rules saved");
      } catch (error) {
        console.error("Failed to save logic:", error);
        toast.error("Failed to save logic rules");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="youform-ghost"
            size="youform-sm"
            onClick={() => router.push(`/forms/${formId}/edit`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Builder
          </Button>
          <div className="border-l h-6 border-gray-300" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Logic Editor</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Create conditional logic and branching
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              viewMode === "graph"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Graph View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "list" ? (
          <RuleBuilder
            blocks={blocks}
            rules={logicRules}
            onChange={handleUpdateLogic}
          />
        ) : (
          <LogicGraphEditor
            formId={formId}
            blocks={blocks}
            logicRules={logicRules}
            onChange={handleUpdateLogic}
          />
        )}
      </div>
    </div>
  );
}
