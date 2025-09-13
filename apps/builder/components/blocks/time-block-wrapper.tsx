"use client";

import { TimeBlock } from "./time-block";
import type { BlockProps } from "./types";

export function TimeBlockWrapper({ block, isSelected, onUpdate }: BlockProps) {
  return (
    <TimeBlock
      id={block.id}
      question={block.question}
      description={block.description}
      required={block.required}
      placeholder={block.placeholder}
      value={block.defaultValue}
      onChange={(value) => onUpdate?.({ defaultValue: value })}
      minTime={block.properties?.minTime}
      maxTime={block.properties?.maxTime}
      step={block.properties?.step}
      isPreview={false}
    />
  );
}

TimeBlockWrapper.displayName = "TimeBlockWrapper";
