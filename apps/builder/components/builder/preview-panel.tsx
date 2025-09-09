'use client';

import * as React from 'react';
import { Button, cn } from '@forms/ui';
import { Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  formId?: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES = {
  desktop: { width: '100%', height: '100%', scale: 1 },
  tablet: { width: '768px', height: '1024px', scale: 0.8 },
  mobile: { width: '375px', height: '667px', scale: 0.9 },
};

export function PreviewPanel({ isOpen, onClose, formId }: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = React.useState<DeviceMode>('desktop');
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className="fixed inset-y-0 right-0 w-1/2 bg-background border-l shadow-xl z-40"
        >
          <div className="flex flex-col h-full">
            {/* Preview Header */}
            <div className="h-14 border-b bg-card flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold">Preview</h3>
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setDeviceMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setDeviceMode('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setDeviceMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 bg-muted/30 overflow-hidden flex items-center justify-center p-8">
              <div 
                className={cn(
                  "relative transition-all duration-300 bg-background rounded-lg shadow-2xl overflow-hidden",
                  deviceMode !== 'desktop' && "border"
                )}
                style={{
                  width: deviceSize.width,
                  height: deviceSize.height,
                  transform: `scale(${deviceSize.scale})`,
                  transformOrigin: 'center',
                }}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-background flex items-center justify-center">
                    <div className="space-y-2 text-center">
                      <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Loading preview...</p>
                    </div>
                  </div>
                )}
                
                <iframe
                  ref={iframeRef}
                  src={formId ? `/preview/${formId}` : 'about:blank'}
                  className="w-full h-full"
                  onLoad={handleIframeLoad}
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
              </div>
            </div>

            {/* Device Info */}
            {deviceMode !== 'desktop' && (
              <div className="p-2 text-center text-xs text-muted-foreground border-t">
                {deviceMode === 'tablet' ? '768×1024' : '375×667'} • {Math.round(deviceSize.scale * 100)}% scale
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}