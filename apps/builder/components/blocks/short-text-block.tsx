'use client';

import { Input, Label } from '@forms/ui';
import { BlockProps } from './types';

export function ShortTextBlock({ block, isSelected, onUpdate }: BlockProps) {
  return (
    <div className={`p-6 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-3">
        <div>
          <Label htmlFor={block.id} className="text-base font-medium">
            {block.question || 'Short text question'}
            {block.required && <span className="text-destructive ml-1">*</span>}
          </Label>
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