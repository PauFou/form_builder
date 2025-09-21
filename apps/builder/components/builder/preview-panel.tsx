"use client";

import * as React from "react";
import { Button, cn } from "@skemya/ui";
import { Monitor, Tablet, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  formId?: string;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES = {
  desktop: { width: "100%", height: "100%", scale: 1 },
  tablet: { width: "768px", height: "1024px", scale: 0.8 },
  mobile: { width: "375px", height: "667px", scale: 0.9 },
};

export function PreviewPanel({ isOpen, onClose, formId }: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = React.useState<DeviceMode>("desktop");
  const [isLoading, setIsLoading] = React.useState(true);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (isOpen && formId) {
      setIsLoading(true);
    }
  }, [isOpen, formId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const deviceSize = DEVICE_SIZES[deviceMode];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            {/* Preview Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-1/2 bg-background border-l shadow-2xl z-50"
            >
              <div className="flex flex-col h-full">
                {/* Preview Header */}
                <div className="h-16 border-b bg-background flex items-center justify-between px-6">
                  <div className="flex items-center gap-6">
                    <h3 className="text-lg font-semibold">Form Preview</h3>
                    <div className="flex items-center border rounded-lg p-1 bg-muted/30">
                      <Button
                        variant={deviceMode === "desktop" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-3 transition-all"
                        onClick={() => setDeviceMode("desktop")}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={deviceMode === "tablet" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-3 transition-all"
                        onClick={() => setDeviceMode("tablet")}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={deviceMode === "mobile" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-3 transition-all"
                        onClick={() => setDeviceMode("mobile")}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 bg-gradient-to-br from-muted/20 to-muted/10 overflow-hidden flex items-center justify-center p-8">
                  <motion.div
                    key={deviceMode}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "relative transition-all duration-300 bg-white rounded-xl overflow-hidden",
                      deviceMode !== "desktop" && "shadow-2xl border"
                    )}
                    style={{
                      width: deviceSize.width,
                      height: deviceSize.height,
                      transform: `scale(${deviceSize.scale})`,
                      transformOrigin: "center",
                    }}
                  >
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-white flex items-center justify-center"
                      >
                        <div className="space-y-3 text-center">
                          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground font-medium">
                            Loading preview...
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <iframe
                      ref={iframeRef}
                      title="Form Preview"
                      src={formId ? `/preview/${formId}?embed=true` : "about:blank"}
                      className="w-full h-full"
                      onLoad={handleIframeLoad}
                      style={{ display: isLoading ? "none" : "block" }}
                    />
                  </motion.div>
                </div>

                {/* Device Info Bar */}
                {deviceMode !== "desktop" && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-3 text-center text-sm text-muted-foreground border-t bg-muted/10"
                  >
                    <span className="font-medium">
                      {deviceMode === "tablet" ? "iPad" : "iPhone"}
                    </span>
                    {" • "}
                    {deviceMode === "tablet" ? "768×1024" : "375×667"}
                    {" • "}
                    <span className="text-primary">
                      {Math.round(deviceSize.scale * 100)}% scale
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
