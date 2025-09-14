/**
 * Migration utilities for backward compatibility
 */

import type { Block, FormSchema } from "./types";

/**
 * Maps legacy block types to new types
 */
const LEGACY_TYPE_MAP: Record<string, string> = {
  single_select: "select",
  multi_select: "checkboxGroup",
};

/**
 * Migrates a single block from legacy type to new type
 */
export function migrateBlock(block: Block): Block {
  const newType = LEGACY_TYPE_MAP[block.type];
  if (newType) {
    return {
      ...block,
      type: newType as Block["type"],
    };
  }
  return block;
}

/**
 * Migrates an entire form schema to use new block types
 */
export function migrateFormSchema(schema: FormSchema): FormSchema {
  // Handle both pages and legacy blocks structure
  if (schema.pages) {
    return {
      ...schema,
      pages: schema.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map(migrateBlock),
      })),
    };
  }

  // Legacy structure with blocks at root level
  if (schema.blocks) {
    return {
      ...schema,
      blocks: schema.blocks.map(migrateBlock),
    };
  }

  return schema;
}

/**
 * Checks if a form schema needs migration
 */
export function needsMigration(schema: FormSchema): boolean {
  const checkBlocks = (blocks: Block[]): boolean => {
    return blocks.some((block) => LEGACY_TYPE_MAP[block.type] !== undefined);
  };

  if (schema.pages) {
    return schema.pages.some((page) => checkBlocks(page.blocks));
  }

  if (schema.blocks) {
    return checkBlocks(schema.blocks);
  }

  return false;
}
