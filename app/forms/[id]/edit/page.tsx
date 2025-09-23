"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { FormBuilder } from "../../../../components/builder/FormBuilder";
import { useFormBuilderStore } from "../../../../lib/stores/form-builder-store";
import { formsApi } from "../../../../lib/api/forms";
import { toast } from "react-hot-toast";

export default function EditFormPage() {
  const params = useParams();
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

  return <FormBuilder formId={formId} />;
}
