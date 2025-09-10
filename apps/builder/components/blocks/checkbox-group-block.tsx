"use client";

import { Label, Checkbox } from "@forms/ui";
import { BlockProps } from "./types";
import { useState } from "react";

export function CheckboxGroupBlock({ block, isSelected, onUpdate }: BlockProps) {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [question, setQuestion] = useState(block.question || "Select all that apply");

  const options = block.options || [
    { id: "1", label: "Option 1", value: "option1" },
    { id: "2", label: "Option 2", value: "option2" },
    { id: "3", label: "Option 3", value: "option3" },
  ];

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
              className="text-base font-medium cursor-text hover:bg-muted/50 rounded px-1 -ml-1 block"
              onClick={() => setIsEditingQuestion(true)}
            >
              {block.question || "Select all that apply"}
              {block.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {block.description && (
            <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
          )}
        </div>
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                id={`${block.id}-${option.id}`}
                disabled
                defaultChecked={block.defaultValue?.includes(option.value)}
              />
              <span className="text-sm select-none">{option.label}</span>
            </label>
          ))}
        </div>
        {block.helpText && <p className="text-xs text-muted-foreground">{block.helpText}</p>}
      </div>
    </div>
  );
}
