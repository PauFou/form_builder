import type { Block as ContractBlock, Field } from "@forms/contracts";
import type { Block as BuilderBlock } from "../components/blocks/types";

/**
 * Convert between builder block format and contract block format
 */
export function builderToContractBlock(builderBlock: BuilderBlock): ContractBlock {
  const contractBlock: ContractBlock = {
    id: builderBlock.id,
    type: builderBlock.type,
    question: builderBlock.question,
    description: builderBlock.description,
    placeholder: builderBlock.placeholder,
    required: builderBlock.required || false,
    helpText: builderBlock.helpText,
  };

  // Convert options format
  if (builderBlock.options) {
    contractBlock.options = builderBlock.options.map((opt) => ({
      id: opt.id,
      text: opt.label, // Map label to text
    }));
  }

  return contractBlock;
}

export function contractToBuilderBlock(contractBlock: ContractBlock): BuilderBlock {
  const builderBlock: BuilderBlock = {
    id: contractBlock.id,
    type: contractBlock.type,
    question: contractBlock.question || "",
    description: contractBlock.description,
    placeholder: contractBlock.placeholder,
    required: contractBlock.required,
    helpText: contractBlock.helpText,
  };

  // Convert options format
  if (contractBlock.options) {
    builderBlock.options = contractBlock.options.map((opt) => ({
      id: opt.id,
      label: opt.text || opt.label || "", // Map text to label
      value: opt.id, // Use id as value
    }));
  }

  return builderBlock;
}

/**
 * Convert between builder block format and contract field format
 */
export function builderToContractField(builderBlock: BuilderBlock): Field {
  const field: Field = {
    id: builderBlock.id,
    type: builderBlock.type as any,
    title: builderBlock.question,
    description: builderBlock.description,
    placeholder: builderBlock.placeholder,
    required: builderBlock.required || false,
  };

  // Convert options format
  if (builderBlock.options) {
    field.options = builderBlock.options.map((opt) => ({
      id: opt.id,
      value: opt.value,
      label: opt.label,
      text: opt.label, // Also add text for compatibility
    }));
  }

  // Convert validation
  if (builderBlock.validation && builderBlock.validation.length > 0) {
    field.validation = builderBlock.validation;
  } else if (builderBlock.required) {
    field.validation = [{ type: "required" as const }];
  }

  return field;
}

export function contractFieldToBuilderBlock(field: Field): BuilderBlock {
  const builderBlock: BuilderBlock = {
    id: field.id,
    type: field.type,
    question: field.title,
    description: field.description,
    placeholder: field.placeholder,
    required: field.required,
  };

  // Convert options format
  if (field.options) {
    builderBlock.options = field.options.map((opt) => ({
      id: opt.id || opt.value,
      label: opt.label || opt.text || opt.value,
      value: opt.value,
    }));
  }

  // Convert validation
  if (field.validation && field.validation.length > 0) {
    builderBlock.validation = field.validation;
  }

  return builderBlock;
}
