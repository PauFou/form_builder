"use client";

import { URLBlock } from "./url-block";
import type { BlockProps } from "./types";

export function URLBlockWrapper({ block, isSelected, onUpdate }: BlockProps) {
  return (
    <URLBlock
      id={block.id}
      question={block.question}
      description={block.description}
      required={block.required}
      placeholder={block.placeholder}
      value={block.defaultValue}
      onChange={(value) => onUpdate?.({ defaultValue: value })}
      allowedDomains={block.properties?.allowedDomains}
      requireHttps={block.properties?.requireHttps}
      isPreview={false}
    />
  );
}

URLBlockWrapper.displayName = "URLBlockWrapper";
