import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FormViewer } from "./components/FormViewer";
import type { FormSchema, RuntimeConfig } from "./types";

interface PopoverEmbedProps {
  schema: FormSchema;
  config: RuntimeConfig & {
    triggerText?: string;
    triggerClassName?: string;
    popoverClassName?: string;
    position?: "bottom-right" | "bottom-left" | "center";
  };
}

export function PopoverEmbed({ schema, config }: PopoverEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const div = document.createElement("div");
    div.className = "fr-popover-container";
    document.body.appendChild(div);
    setContainer(div);

    return () => {
      document.body.removeChild(div);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (data: any) => {
    if (config.onSubmit) {
      await config.onSubmit(data);
    }
    handleClose();
  };

  const positionClasses = {
    "bottom-right": "fixed bottom-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    center: "fixed inset-0 flex items-center justify-center",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={config.triggerClassName || "fr-popover-trigger"}
      >
        {config.triggerText || "Open Form"}
      </button>

      {isOpen &&
        container &&
        createPortal(
          <div className="fr-popover-backdrop" onClick={handleClose}>
            <div
              className={`fr-popover ${config.popoverClassName || ""} ${
                positionClasses[config.position || "bottom-right"]
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fr-popover-header">
                <h3 className="fr-popover-title">{schema.title}</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="fr-popover-close"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="fr-popover-content">
                <FormViewer
                  schema={schema}
                  config={{
                    ...config,
                    onSubmit: handleSubmit,
                  }}
                />
              </div>
            </div>
          </div>,
          container
        )}
    </>
  );
}

interface DrawerEmbedProps {
  schema: FormSchema;
  config: RuntimeConfig & {
    triggerText?: string;
    triggerClassName?: string;
    drawerClassName?: string;
    position?: "left" | "right";
    width?: string;
  };
}

export function DrawerEmbed({ schema, config }: DrawerEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const div = document.createElement("div");
    div.className = "fr-drawer-container";
    document.body.appendChild(div);
    setContainer(div);

    return () => {
      document.body.removeChild(div);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (data: any) => {
    if (config.onSubmit) {
      await config.onSubmit(data);
    }
    handleClose();
  };

  const drawerStyles = {
    width: config.width || "400px",
    [config.position || "right"]: 0,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={config.triggerClassName || "fr-drawer-trigger"}
      >
        {config.triggerText || "Open Form"}
      </button>

      {isOpen &&
        container &&
        createPortal(
          <>
            <div
              className="fr-drawer-backdrop"
              onClick={handleClose}
              style={{
                opacity: isOpen ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
              }}
            />
            <div
              className={`fr-drawer fr-drawer-${config.position || "right"} ${
                config.drawerClassName || ""
              }`}
              style={{
                ...drawerStyles,
                transform: isOpen
                  ? "translateX(0)"
                  : config.position === "left"
                    ? "translateX(-100%)"
                    : "translateX(100%)",
                transition: "transform 0.3s ease-in-out",
              }}
            >
              <div className="fr-drawer-header">
                <button
                  type="button"
                  onClick={handleClose}
                  className="fr-drawer-close"
                  aria-label="Close"
                >
                  ←
                </button>
                <h3 className="fr-drawer-title">{schema.title}</h3>
              </div>
              <div className="fr-drawer-content">
                <FormViewer
                  schema={schema}
                  config={{
                    ...config,
                    onSubmit: handleSubmit,
                  }}
                />
              </div>
            </div>
          </>,
          container
        )}
    </>
  );
}

// Inline styles for embed modes
export const embedStyles = `
/* Popover Styles */
.fr-popover-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  animation: fadeIn 0.2s ease-in-out;
}

.fr-popover {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 480px;
  max-height: 80vh;
  width: 100%;
  z-index: 9999;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fr-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.fr-popover-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.fr-popover-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.fr-popover-close:hover {
  color: #374151;
}

.fr-popover-content {
  overflow-y: auto;
  flex: 1;
  padding: 1.5rem;
}

/* Drawer Styles */
.fr-drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.fr-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  background-color: white;
  box-shadow: -10px 0 20px -5px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fr-drawer-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.fr-drawer-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.fr-drawer-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.fr-drawer-close:hover {
  color: #374151;
}

.fr-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .fr-popover {
    max-width: 100%;
    margin: 1rem;
    max-height: 90vh;
  }
  
  .fr-drawer {
    width: 100% !important;
  }
}

/* Default trigger button styles */
.fr-popover-trigger,
.fr-drawer-trigger {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.fr-popover-trigger:hover,
.fr-drawer-trigger:hover {
  background-color: #2563eb;
}
`;
