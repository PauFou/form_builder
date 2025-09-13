import { BLOCK_COMPONENTS } from "../../../components/blocks";
import { ShortTextBlock } from "../../../components/blocks/short-text-block";
import { LongTextBlock } from "../../../components/blocks/long-text-block";
import { EmailBlock } from "../../../components/blocks/email-block";
import { SelectBlock } from "../../../components/blocks/select-block";
import { CheckboxGroupBlock } from "../../../components/blocks/checkbox-group-block";
import { DateBlock } from "../../../components/blocks/date-block";
import { NumberBlock } from "../../../components/blocks/number-block";
import { PhoneBlock } from "../../../components/blocks/phone-block";
import { CurrencyBlock } from "../../../components/blocks/currency-block";
import { AddressBlock } from "../../../components/blocks/address-block";
import { SingleSelectBlock } from "../../../components/blocks/single-select-block";
import { MultiSelectBlock } from "../../../components/blocks/multi-select-block";
import { RatingBlock } from "../../../components/blocks/rating-block";
import { NPSBlock } from "../../../components/blocks/nps-block";
import { ScaleBlock } from "../../../components/blocks/scale-block";
import { EnhancedFileUploadBlock } from "../../../components/blocks/enhanced-file-upload-block";

describe("Block Registry", () => {
  describe("BLOCK_COMPONENTS", () => {
    it("should contain ShortTextBlock for short_text type", () => {
      expect(BLOCK_COMPONENTS.short_text).toBe(ShortTextBlock);
    });

    it("should contain LongTextBlock for long_text type", () => {
      expect(BLOCK_COMPONENTS.long_text).toBe(LongTextBlock);
    });

    it("should contain EmailBlock for email type", () => {
      expect(BLOCK_COMPONENTS.email).toBe(EmailBlock);
    });

    it("should contain SelectBlock for select type", () => {
      expect(BLOCK_COMPONENTS.select).toBe(SelectBlock);
    });

    it("should contain CheckboxGroupBlock for checkbox_group type", () => {
      expect(BLOCK_COMPONENTS.checkbox_group).toBe(CheckboxGroupBlock);
    });

    it("should contain DateBlock for date type", () => {
      expect(BLOCK_COMPONENTS.date).toBe(DateBlock);
    });

    it("should contain NumberBlock for number type", () => {
      expect(BLOCK_COMPONENTS.number).toBe(NumberBlock);
    });

    it("should contain PhoneBlock for phone type", () => {
      expect(BLOCK_COMPONENTS.phone).toBe(PhoneBlock);
    });

    it("should contain CurrencyBlock for currency type", () => {
      expect(BLOCK_COMPONENTS.currency).toBe(CurrencyBlock);
    });

    it("should contain AddressBlock for address type", () => {
      expect(BLOCK_COMPONENTS.address).toBe(AddressBlock);
    });

    it("should contain SingleSelectBlock for single_select type", () => {
      expect(BLOCK_COMPONENTS.single_select).toBe(SingleSelectBlock);
    });

    it("should contain MultiSelectBlock for multi_select type", () => {
      expect(BLOCK_COMPONENTS.multi_select).toBe(MultiSelectBlock);
    });

    it("should contain RatingBlock for rating type", () => {
      expect(BLOCK_COMPONENTS.rating).toBe(RatingBlock);
    });

    it("should contain NPSBlock for nps type", () => {
      expect(BLOCK_COMPONENTS.nps).toBe(NPSBlock);
    });

    it("should contain ScaleBlock for scale type", () => {
      expect(BLOCK_COMPONENTS.scale).toBe(ScaleBlock);
    });

    it("should contain EnhancedFileUploadBlock for file_upload type", () => {
      expect(BLOCK_COMPONENTS.file_upload).toBe(EnhancedFileUploadBlock);
    });

    it("should return undefined for unknown type", () => {
      expect(BLOCK_COMPONENTS.unknown_type).toBeUndefined();
    });
  });

  describe("Block types", () => {
    it("should have all expected block types", () => {
      const blockTypes = Object.keys(BLOCK_COMPONENTS);
      expect(blockTypes).toContain("short_text");
      expect(blockTypes).toContain("long_text");
      expect(blockTypes).toContain("email");
      expect(blockTypes).toContain("select");
      expect(blockTypes).toContain("checkbox_group");
      expect(blockTypes).toContain("date");
      expect(blockTypes).toContain("number");
      expect(blockTypes).toContain("phone");
      expect(blockTypes).toContain("currency");
      expect(blockTypes).toContain("address");
      expect(blockTypes).toContain("single_select");
      expect(blockTypes).toContain("multi_select");
      expect(blockTypes).toContain("rating");
      expect(blockTypes).toContain("nps");
      expect(blockTypes).toContain("scale");
      expect(blockTypes).toContain("file_upload");
    });

    it("should have exactly 22 block types", () => {
      const blockTypes = Object.keys(BLOCK_COMPONENTS);
      expect(blockTypes).toHaveLength(24); // Updated: added Enhanced file upload and signature
    });
  });
});
