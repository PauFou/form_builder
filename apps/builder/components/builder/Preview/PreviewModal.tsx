"use client";

import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, X, Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@skemya/ui";
import { cn } from "../../../lib/utils";

type DeviceType = "desktop" | "tablet" | "mobile";

interface DeviceConfig {
  width: string;
  height: string;
  label: string;
  icon: React.ComponentType<any>;
}

const devices: Record<DeviceType, DeviceConfig> = {
  desktop: {
    width: "1280px",
    height: "800px",
    label: "Desktop",
    icon: Monitor,
  },
  tablet: {
    width: "768px",
    height: "1024px",
    label: "Tablet",
    icon: Tablet,
  },
  mobile: {
    width: "375px",
    height: "667px",
    label: "Mobile",
    icon: Smartphone,
  },
};

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  mode?: "one-question" | "grid";
}

export function PreviewModal({
  open,
  onOpenChange,
  formId,
  mode = "one-question",
}: PreviewModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentDevice = devices[selectedDevice];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            isFullscreen ? "p-0" : "p-4"
          )}
        >
          <div
            className={cn(
              "relative w-full h-full bg-background overflow-hidden flex flex-col",
              isFullscreen
                ? "max-w-full max-h-full rounded-none shadow-none"
                : "max-w-[95vw] max-h-[95vh] rounded-lg shadow-md border border-border/50"
            )}
          >
            {/* Header avec device switchers */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background">
              {/* Device Switchers */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
                  {(Object.entries(devices) as [DeviceType, DeviceConfig][]).map(
                    ([device, config]) => {
                      const Icon = config.icon;
                      const isActive = selectedDevice === device;

                      return (
                        <button
                          key={device}
                          onClick={() => setSelectedDevice(device)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{config.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Device dimensions indicator */}
                <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1.5 bg-muted/30 rounded-md border text-xs text-muted-foreground">
                  <span className="font-mono">{currentDevice.width}</span>
                  <span>×</span>
                  <span className="font-mono">{currentDevice.height}</span>
                </div>
              </div>

              {/* Fullscreen & Close buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  </span>
                </button>

                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div
              className={cn(
                "flex-1 flex items-center justify-center bg-muted/5 overflow-auto",
                isFullscreen ? "p-0" : "p-6"
              )}
            >
              <div
                className={cn(
                  "bg-white overflow-hidden transition-all duration-500 ease-out",
                  isFullscreen ? "w-full h-full" : "rounded-md shadow-sm border border-border/30"
                )}
                style={
                  isFullscreen
                    ? undefined
                    : {
                        width: currentDevice.width,
                        height: currentDevice.height,
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }
                }
              >
                <iframe
                  src={`/preview/${formId}?mode=${mode}`}
                  className="w-full h-full border-0"
                  title="Form Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            </div>

            {/* Footer info */}
            <div className="px-4 py-2 border-t border-border/30 bg-background flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="text-[11px]">Preview Mode</span>
                <span className="font-mono bg-muted/30 px-1.5 py-0.5 rounded text-[11px]">
                  {mode === "one-question" ? "One Question" : "Grid View"}
                </span>
              </div>
              <div className="hidden sm:block text-[11px]">
                Press{" "}
                <kbd className="px-1 py-0.5 bg-muted/30 rounded font-mono text-[10px]">ESC</kbd> to
                close
              </div>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
