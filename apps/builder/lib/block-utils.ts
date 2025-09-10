import type { Block as ContractBlock } from "@forms/contracts";
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
    required: builderBlock.required,
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
      label: opt.text, // Map text to label
      value: opt.id, // Use id as value
    }));
  }

  return builderBlock;
}
