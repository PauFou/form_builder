'use client';

import { Label, Checkbox } from '@forms/ui';
import { BlockProps } from './types';

export function CheckboxGroupBlock({ block, isSelected, onUpdate }: BlockProps) {
  const options = block.options || [
    { id: '1', label: 'Option 1', value: 'option1' },
    { id: '2', label: 'Option 2', value: 'option2' },
    { id: '3', label: 'Option 3', value: 'option3' },
  ];

  return (
    <div className={`p-6 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">
            {block.question || 'Select all that apply'}
            {block.required && <span className="text-destructive ml-1">*</span>}
          </Label>
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
        {block.helpText && (
          <p className="text-xs text-muted-foreground">{block.helpText}</p>
        )}
      </div>
    </div>
  );
}