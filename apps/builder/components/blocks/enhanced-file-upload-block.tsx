"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  File,
  Image,
} from "lucide-react";
import { Button } from "@skemya/ui";
import { Progress } from "@skemya/ui";
import { Alert, AlertDescription } from "@skemya/ui";
import type { BlockProps } from "./types";
import { cn } from "../../lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  thumbnailUrl?: string;
  status: "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
}

export function EnhancedFileUploadBlock({ block, isSelected, onUpdate }: BlockProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = block.properties?.accept || "*/*";
  const maxSize = (block.properties?.maxSize || 10) * 1024 * 1024; // Convert MB to bytes
  const maxFiles = block.properties?.maxFiles || 1;
  const allowMultiple = maxFiles > 1;

  // File validation
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB.`;
      }

      if (accept !== "*/*" && accept !== "*") {
        const acceptedTypes = accept.split(",").map((type: string) => type.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

        const isValidType = acceptedTypes.some((acceptedType: string) => {
          if (acceptedType.startsWith(".")) {
            return acceptedType === fileExtension;
          }
          return fileType.match(acceptedType.replace("*", ".*"));
        });

        if (!isValidType) {
          return `File "${file.name}" type is not allowed. Accepted formats: ${accept}`;
        }
      }

      return null;
    },
    [maxSize, accept]
  );

  // Generate thumbnail for images
  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Not an image file"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        const maxWidth = 120;
        const maxHeight = 120;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Simulate S3/MinIO direct upload with retry
  const uploadFile = useCallback(
    async (file: File, uploadedFile: UploadedFile, retryCount = 0): Promise<void> => {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "uploading", progress: 0 } : f
          )
        );

        // Generate thumbnail for images
        if (file.type.startsWith("image/")) {
          try {
            const thumbnailUrl = await generateThumbnail(file);
            setFiles((prev) =>
              prev.map((f) => (f.id === uploadedFile.id ? { ...f, thumbnailUrl } : f))
            );
          } catch (error) {
            console.warn("Failed to generate thumbnail:", error);
          }
        }

        // Simulate progressive upload
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f)));
        }

        // Simulate potential upload failure for retry testing
        if (retryCount === 0 && Math.random() < 0.2) {
          throw new Error("Network error - upload failed");
        }

        // Simulate successful upload response
        const mockUrl = `https://storage.example.com/uploads/${uploadedFile.id}`;

        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "uploaded" as const, progress: 100, url: mockUrl } : f
          );
          // Update parent component with the current state
          onUpdate?.({ defaultValue: updated });
          return updated;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "error", error: errorMessage } : f
          )
        );
      }
    },
    [onUpdate]
  );

  // Retry upload
  const retryUpload = async (fileId: string) => {
    const fileData = files.find((f) => f.id === fileId);
    if (!fileData) return;

    // In a real implementation, we'd need to store the original File object
    // For now, we'll just simulate a retry by resetting the status
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading" as const, progress: 0, error: undefined } : f
      )
    );

    // Simulate upload success after delay
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "uploaded" as const,
                progress: 100,
                url: `https://storage.example.com/uploads/${fileId}`,
              }
            : f
        )
      );
    }, 2000);
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (selectedFiles: FileList) => {
      const fileArray = Array.from(selectedFiles);
      const newErrors: string[] = [];

      // Validate total file count
      if (files.length + fileArray.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`);
        setErrors(newErrors);
        return;
      }

      // Validate each file
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors([]);

      // Process files
      const newFiles: UploadedFile[] = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Start uploads
      for (let i = 0; i < fileArray.length; i++) {
        uploadFile(fileArray[i], newFiles[i]);
      }
    },
    [files.length, maxFiles, validateFile, uploadFile]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles]
  );

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    const remainingFiles = files.filter((f) => f.id !== fileId);
    onUpdate?.({ defaultValue: remainingFiles });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-5 w-5" aria-label="Image file" />;
    return <File className="h-5 w-5" aria-label="File" />;
  };

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

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => files.length < maxFiles && fileInputRef.current?.click()}
      >
        <Upload
          className={cn(
            "mx-auto h-12 w-12 transition-colors",
            isDragging ? "text-primary" : "text-gray-400"
          )}
        />
        <div className="mt-4">
          <p className="text-base font-medium text-gray-900">
            {isDragging ? "Drop files here" : "Choose files or drag and drop"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {accept !== "*/*" && accept !== "*" && (
              <>
                Accepted formats: {accept}
                <br />
              </>
            )}
            Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB per file
            {allowMultiple && (
              <>
                {" "}
                • Up to {maxFiles} files ({files.length}/{maxFiles})
              </>
            )}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={allowMultiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={files.length >= maxFiles}
        />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>

          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              {/* File Icon/Thumbnail */}
              <div className="flex-shrink-0">
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={`Thumbnail of ${file.name}`}
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                </div>

                {file.status === "uploading" && (
                  <div className="mt-1">
                    <Progress value={file.progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Uploading... {file.progress}%</p>
                  </div>
                )}

                {file.status === "uploaded" && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Uploaded successfully</span>
                  </div>
                )}

                {file.status === "error" && (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-600">{file.error}</span>
                  </div>
                )}
              </div>

              {/* File Actions */}
              <div className="flex items-center gap-1">
                {file.status === "uploaded" && file.url && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = file.url!;
                        a.download = file.name;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {file.status === "error" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => retryUpload(file.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

EnhancedFileUploadBlock.displayName = "EnhancedFileUploadBlock";
