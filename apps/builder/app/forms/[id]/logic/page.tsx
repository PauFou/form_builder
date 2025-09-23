"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@skemya/ui";
import { LogicEditor } from "../../../../components/logic/LogicEditor";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { formsApi } from "../../../../lib/api/forms";
import { toast } from "react-hot-toast";

export default function FormLogicPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const { setForm } = useFormBuilderStore();

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/forms/${formId}/edit`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Builder
          </Button>
        </div>
      </header>

      <LogicEditor />
    </div>
  );
}
