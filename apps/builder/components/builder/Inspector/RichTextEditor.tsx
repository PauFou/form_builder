"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "../../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder, className }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const editorRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }, [value, editorRef]);

    const handleInput = () => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    };

    return (
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          "min-h-[60px] w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600",
          "transition-colors overflow-y-auto",
          !value && "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400",
          className
        )}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
