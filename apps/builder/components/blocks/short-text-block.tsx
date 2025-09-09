'use client';

import { Input, Label } from '@forms/ui';
import { BlockProps } from './types';
import { useState } from 'react';

export function ShortTextBlock({ block, isSelected, onUpdate }: BlockProps) {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [question, setQuestion] = useState(block.question || 'Short text question');

  const handleQuestionBlur = () => {
    setIsEditingQuestion(false);
    onUpdate({ question });
  };

  return (
    <div className={`p-6 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-3">
        <div>
          {isEditingQuestion ? (
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onBlur={handleQuestionBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
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
              {block.question || 'Short text question'}
              {block.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {block.description && (
            <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
          )}
        </div>
        <Input
          id={block.id}
          type="text"
          placeholder={block.placeholder || 'Type your answer here...'}
          disabled
          className="w-full"
        />
        {block.helpText && (
          <p className="text-xs text-muted-foreground">{block.helpText}</p>
        )}
      </div>
    </div>
  );
}