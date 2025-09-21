"use client";

import { Input, Label } from "@skemya/ui";
import { Mail } from "lucide-react";
import { BlockProps } from "./types";
import { useState } from "react";

export function EmailBlock({ block, isSelected, onUpdate }: BlockProps) {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [question, setQuestion] = useState(block.question || "Email address");

  const handleQuestionBlur = () => {
    setIsEditingQuestion(false);
    onUpdate?.({ question });
  };

  return (
    <div className={`p-6 ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <div className="space-y-3">
        <div>
          {isEditingQuestion ? (
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onBlur={handleQuestionBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleQuestionBlur();
                }
              }}
              className="text-base font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1 -ml-1 w-full"
              autoFocus
            />
          ) : (
            <Label
              htmlFor={block.id}
              className="text-base font-medium cursor-text hover:bg-muted/50 rounded px-1 -ml-1"
              onClick={() => setIsEditingQuestion(true)}
            >
              {block.question || "Email address"}
              {block.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {block.description && (
            <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
          )}
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={block.id}
            type="email"
            placeholder={block.placeholder || "name@example.com"}
            disabled
            className="w-full pl-10"
          />
        </div>
        {block.helpText && <p className="text-xs text-muted-foreground">{block.helpText}</p>}
      </div>
    </div>
  );
}
