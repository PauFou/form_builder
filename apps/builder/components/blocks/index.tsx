export { ShortTextBlock } from "./short-text-block";
export { LongTextBlock } from "./long-text-block";
export { EmailBlock } from "./email-block";
export { SelectBlock } from "./select-block";
export { CheckboxGroupBlock } from "./checkbox-group-block";
export { DateBlock } from "./date-block";
export { NumberBlock } from "./number-block";
export { PhoneBlock } from "./phone-block";
export { CurrencyBlock } from "./currency-block";
export { AddressBlock } from "./address-block";
export { SingleSelectBlock } from "./single-select-block";
export { MultiSelectBlock } from "./multi-select-block";
export { RatingBlock } from "./rating-block";
export { NPSBlock } from "./nps-block";
export { ScaleBlock } from "./scale-block";
export { FileUploadBlock } from "./file-upload-block";
export { MatrixBlock } from "./matrix-block";
export { RankingBlock } from "./ranking-block";
export { SignatureBlock } from "./signature-block";
export { PaymentBlock } from "./payment-block";
export { StatementBlock } from "./statement-block";
export { DropdownBlock } from "./dropdown-block";
export type { Block, BlockProps } from "./types";

import { ShortTextBlock } from "./short-text-block";
import { LongTextBlock } from "./long-text-block";
import { EmailBlock } from "./email-block";
import { SelectBlock } from "./select-block";
import { CheckboxGroupBlock } from "./checkbox-group-block";
import { DateBlock } from "./date-block";
import { NumberBlock } from "./number-block";
import { PhoneBlock } from "./phone-block";
import { CurrencyBlock } from "./currency-block";
import { AddressBlock } from "./address-block";
import { SingleSelectBlock } from "./single-select-block";
import { MultiSelectBlock } from "./multi-select-block";
import { RatingBlock } from "./rating-block";
import { NPSBlock } from "./nps-block";
import { ScaleBlock } from "./scale-block";
import { FileUploadBlock } from "./file-upload-block";
import { MatrixBlock } from "./matrix-block";
import { RankingBlock } from "./ranking-block";
import { SignatureBlock } from "./signature-block";
import { PaymentBlock } from "./payment-block";
import { StatementBlock } from "./statement-block";
import { DropdownBlock } from "./dropdown-block";
import type { BlockProps } from "./types";

export const BLOCK_COMPONENTS: Record<string, React.ComponentType<BlockProps>> = {
  short_text: ShortTextBlock,
  long_text: LongTextBlock,
  email: EmailBlock,
  select: SelectBlock,
  checkbox_group: CheckboxGroupBlock,
  date: DateBlock,
  number: NumberBlock,
  phone: PhoneBlock,
  currency: CurrencyBlock,
  address: AddressBlock,
  single_select: SingleSelectBlock,
  multi_select: MultiSelectBlock,
  rating: RatingBlock,
  nps: NPSBlock,
  scale: ScaleBlock,
  file_upload: FileUploadBlock,
  matrix: MatrixBlock,
  ranking: RankingBlock,
  signature: SignatureBlock,
  payment: PaymentBlock,
  statement: StatementBlock,
  dropdown: DropdownBlock,
  // Missing blocks that still need implementation:
  // scheduler: SchedulerBlock,
  // embed: EmbedBlock,
  // image: ImageBlock,
};
