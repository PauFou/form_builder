'use client';

import { Input, Label } from '@forms/ui';
import { Mail } from 'lucide-react';
import { BlockProps } from './types';

export function EmailBlock({ block, isSelected, onUpdate }: BlockProps) {
  return (
    <div className={`p-6 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-3">
        <div>
          <Label htmlFor={block.id} className="text-base font-medium">
            {block.question || 'Email address'}
            {block.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {block.description && (
            <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
          )}
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={block.id}
            type="email"
            placeholder={block.placeholder || 'name@example.com'}
            disabled
            className="w-full pl-10"
          />
        </div>
        {block.helpText && (
          <p className="text-xs text-muted-foreground">{block.helpText}</p>
        )}
      </div>
    </div>
  );
}