export { ShortTextBlock } from "./short-text-block";
export { LongTextBlock } from "./long-text-block";
export { EmailBlock } from "./email-block";
export { SelectBlock } from "./select-block";
export { CheckboxGroupBlock } from "./checkbox-group-block";
export { DateBlock } from "./date-block";
export type { Block, BlockProps } from "./types";

import { ShortTextBlock } from "./short-text-block";
import { LongTextBlock } from "./long-text-block";
import { EmailBlock } from "./email-block";
import { SelectBlock } from "./select-block";
import { CheckboxGroupBlock } from "./checkbox-group-block";
import { DateBlock } from "./date-block";
import type { BlockProps } from "./types";

export const BLOCK_COMPONENTS: Record<string, React.ComponentType<BlockProps>> = {
  short_text: ShortTextBlock,
  long_text: LongTextBlock,
  email: EmailBlock,
  select: SelectBlock,
  checkbox_group: CheckboxGroupBlock,
  date: DateBlock,
};
