import { BLOCK_COMPONENTS } from "../../../components/blocks";
import { ShortTextBlock } from "../../../components/blocks/short-text-block";
import { LongTextBlock } from "../../../components/blocks/long-text-block";
import { EmailBlock } from "../../../components/blocks/email-block";
import { SelectBlock } from "../../../components/blocks/select-block";
import { CheckboxGroupBlock } from "../../../components/blocks/checkbox-group-block";
import { DateBlock } from "../../../components/blocks/date-block";

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
    });

    it("should have exactly 6 block types", () => {
      const blockTypes = Object.keys(BLOCK_COMPONENTS);
      expect(blockTypes).toHaveLength(6);
    });
  });
});
