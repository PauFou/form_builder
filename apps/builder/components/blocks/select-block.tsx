'use client';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@forms/ui';
import { BlockProps } from './types';

export function SelectBlock({ block, isSelected, onUpdate }: BlockProps) {
  const options = block.options || [
    { id: '1', label: 'Option 1', value: 'option1' },
    { id: '2', label: 'Option 2', value: 'option2' },
    { id: '3', label: 'Option 3', value: 'option3' },
  ];

  return (
    <div className={`p-6 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-3">
        <div>
          <Label htmlFor={block.id} className="text-base font-medium">
            {block.question || 'Select an option'}
            {block.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {block.description && (
            <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
          )}
        </div>
        <Select disabled defaultValue={block.defaultValue}>
          <SelectTrigger id={block.id} className="w-full">
            <SelectValue placeholder={block.placeholder || 'Choose an option'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {block.helpText && (
          <p className="text-xs text-muted-foreground">{block.helpText}</p>
        )}
      </div>
    </div>
  );
}