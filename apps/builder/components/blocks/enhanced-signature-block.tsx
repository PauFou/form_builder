"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PenTool, RotateCcw, Download, Check } from "lucide-react";
import { Button } from "@forms/ui";
import { Alert, AlertDescription } from "@forms/ui";
import type { BlockProps } from "./types";
import { cn } from "../../lib/utils";

interface Point {
  x: number;
  y: number;
}

export function EnhancedSignatureBlock({ block, isSelected, onUpdate }: BlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureData, setSignatureData] = useState<string>("");
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  const canvasWidth = 600;
  const canvasHeight = 200;
  const strokeWidth = 2;
  const strokeColor = "#000000";

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Set drawing properties
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }, []);

  // Get point from event (mouse or touch)
  const getPointFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const point = getPointFromEvent(e);
      setIsDrawing(true);
      setLastPoint(point);
    },
    [getPointFromEvent]
  );

  // Draw line
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;

      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const currentPoint = getPointFromEvent(e);

      if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();

        setIsEmpty(false);
      }

      setLastPoint(currentPoint);
    },
    [isDrawing, lastPoint, getPointFromEvent]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setLastPoint(null);

    // Save signature data
    const canvas = canvasRef.current;
    if (canvas && !isEmpty) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureData(dataUrl);
      onUpdate?.({ defaultValue: dataUrl });
    }
  }, [isDrawing, isEmpty, onUpdate]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear canvas and set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    setIsEmpty(true);
    setSignatureData("");
    onUpdate?.({ defaultValue: "" });
  }, [onUpdate]);

  // Download signature
  const downloadSignature = useCallback(() => {
    if (!signatureData) return;

    const link = document.createElement("a");
    link.download = `signature-${Date.now()}.png`;
    link.href = signatureData;
    link.click();
  }, [signatureData]);

  // Export as SVG (vector format)
  const exportAsSVG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Create SVG from canvas data (simplified approach)
    const svg = `
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <image href="${signatureData}" width="${canvasWidth}" height="${canvasHeight}"/>
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `signature-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [signatureData, isEmpty]);

  // Touch event handlers (for mobile)
  const handleTouchStart = (e: React.TouchEvent) => startDrawing(e);
  const handleTouchMove = (e: React.TouchEvent) => draw(e);
  const handleTouchEnd = () => stopDrawing();

  return (
    <div
      className={cn(
        "space-y-4 p-4 rounded-lg border-2 border-transparent transition-all duration-200",
        isSelected && "border-primary ring-2 ring-primary/20"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-base font-medium text-gray-900">
            {block.question}
            {block.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
        {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
      </div>

      {/* Signature Canvas */}
      <div className="space-y-3">
        <div className="relative border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            className={cn("block w-full cursor-crosshair touch-none", isEmpty && "bg-gray-50")}
            style={{
              maxWidth: "100%",
              height: "200px",
              touchAction: "none", // Prevent scrolling on touch
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Sign here</p>
                <p className="text-xs">Use your mouse or finger to draw your signature</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={isEmpty}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>

            {!isEmpty && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={downloadSignature}>
                  <Download className="h-4 w-4 mr-1" />
                  PNG
                </Button>

                <Button type="button" variant="outline" size="sm" onClick={exportAsSVG}>
                  <Download className="h-4 w-4 mr-1" />
                  SVG
                </Button>
              </>
            )}
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">Signature captured</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <PenTool className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Instructions:</strong> Use your mouse or finger to draw your signature above.
            You can clear and redraw as needed. On mobile devices, use light pressure for best
            results.
          </AlertDescription>
        </Alert>

        {/* Signature Preview (when not empty) */}
        {!isEmpty && signatureData && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Signature Preview:</p>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <img
                src={signatureData}
                alt="Signature preview"
                className="max-w-full h-auto border rounded"
                style={{ maxHeight: "100px" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

EnhancedSignatureBlock.displayName = "EnhancedSignatureBlock";
