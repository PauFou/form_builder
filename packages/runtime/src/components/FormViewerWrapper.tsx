import React, { useState, useEffect } from "react";
import { FormViewer } from "./FormViewer";
import { GridFormViewer } from "./GridFormViewer";
import { ModeSwitcher } from "./ModeSwitcher";
import type { FormSchema, RuntimeConfig } from "../types";

interface FormViewerWrapperProps {
  schema: FormSchema;
  config: RuntimeConfig;
  className?: string;
}

export function FormViewerWrapper({ schema, config, className = "" }: FormViewerWrapperProps) {
  // Get initial mode from schema settings or default to one-question
  const [displayMode, setDisplayMode] = useState<"one-question" | "grid">(
    schema.settings?.displayMode || "one-question"
  );

  // Store mode preference in localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem(`form-${config.formId}-mode`);
    if (savedMode === "grid" || savedMode === "one-question") {
      setDisplayMode(savedMode);
    }
  }, [config.formId]);

  const handleModeChange = (mode: "one-question" | "grid") => {
    setDisplayMode(mode);
    localStorage.setItem(`form-${config.formId}-mode`, mode);
  };

  const showModeSwitcher = schema.settings?.allowModeSwitch !== false;

  return (
    <div className={`fr-viewer-wrapper ${className}`}>
      {showModeSwitcher && (
        <div className="fr-viewer-header">
          <ModeSwitcher
            currentMode={displayMode}
            onModeChange={handleModeChange}
            disabled={false}
          />
        </div>
      )}

      {displayMode === "grid" ? (
        <GridFormViewer schema={schema} config={config} className={className} />
      ) : (
        <FormViewer schema={schema} config={config} className={className} />
      )}
    </div>
  );
}
