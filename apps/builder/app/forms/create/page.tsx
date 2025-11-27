"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FormBuilder } from "../../../components/builder/FormBuilder";
import { useFormBuilderStore } from "../../../lib/stores/form-builder-store";
import { useAuthStore } from "../../../lib/stores/auth-store";
import { formsApi } from "../../../lib/api/forms";
import { toast } from "react-hot-toast";

export default function CreateFormPage() {
  const router = useRouter();
  const { setForm, form } = useFormBuilderStore();
  const { organization } = useAuthStore();
  const hasCreated = useRef(false);

  useEffect(() => {
    const createNewForm = async () => {
      // Prevent multiple calls
      if (hasCreated.current) {
        return;
      }

      try {
        // Check if organization is available
        if (!organization?.id) {
          console.error("No organization available for form creation");
          toast.error("Unable to create form: No organization found");
          router.push("/forms");
          return;
        }

        // Check if we already have a form loaded
        if (form?.id) {
          router.replace(`/forms/${form.id}/edit`);
          return;
        }

        // Mark as creating to prevent duplicate calls
        hasCreated.current = true;

        // Create a new empty form
        const newFormData = {
          title: "Untitled Form",
          description: "",
          organization_id: organization.id,
          blocks: [],
          settings: {
            theme: "default",
            layout: "one-at-a-time",
            allowBackNavigation: true,
          },
        };

        console.log("Creating form with data:", newFormData);
        const newForm = await formsApi.create(newFormData);
        console.log("Form created successfully:", newForm);

        setForm(newForm);

        // Redirect to the edit page with the new form ID
        router.replace(`/forms/${newForm.id}/edit`);
      } catch (error) {
        hasCreated.current = false; // Reset on error so user can retry
        console.error("Failed to create form:", error);
        toast.error("Failed to create form");
        // Fallback: redirect back to forms list
        router.push("/forms");
      }
    };

    // Only create if we have organization and haven't created yet
    if (organization?.id && !hasCreated.current) {
      createNewForm();
    }
  }, [organization?.id, form?.id, setForm, router]);

  // Show loading while creating
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="mt-2 text-gray-600">Creating your new form...</p>
      </div>
    </div>
  );
}
