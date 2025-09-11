import { BLOCK_TYPES, getBlockComponent, getBlockIcon } from "../../../components/blocks";
import { ShortTextBlock } from "../../../components/blocks/short-text-block";
import { LongTextBlock } from "../../../components/blocks/long-text-block";
import { EmailBlock } from "../../../components/blocks/email-block";
import { SelectBlock } from "../../../components/blocks/select-block";
import { CheckboxGroupBlock } from "../../../components/blocks/checkbox-group-block";
import { DateBlock } from "../../../components/blocks/date-block";

describe("Block Registry", () => {
  describe("getBlockComponent", () => {
    it("should return ShortTextBlock for short_text type", () => {
      const Component = getBlockComponent("short_text");
      expect(Component).toBe(ShortTextBlock);
    });

    it("should return LongTextBlock for long_text type", () => {
      const Component = getBlockComponent("long_text");
      expect(Component).toBe(LongTextBlock);
    });

    it("should return EmailBlock for email type", () => {
      const Component = getBlockComponent("email");
      expect(Component).toBe(EmailBlock);
    });

    it("should return SelectBlock for select type", () => {
      const Component = getBlockComponent("select");
      expect(Component).toBe(SelectBlock);
    });

    it("should return CheckboxGroupBlock for checkbox_group type", () => {
      const Component = getBlockComponent("checkbox_group");
      expect(Component).toBe(CheckboxGroupBlock);
    });

    it("should return DateBlock for date type", () => {
      const Component = getBlockComponent("date");
      expect(Component).toBe(DateBlock);
    });

    it("should return null for unknown type", () => {
      const Component = getBlockComponent("unknown_type");
      expect(Component).toBeNull();
    });
  });

  describe("getBlockIcon", () => {
    it("should return icon for each block type", () => {
      expect(getBlockIcon("short_text")).toBe("📝");
      expect(getBlockIcon("long_text")).toBe("📄");
      expect(getBlockIcon("email")).toBe("📧");
      expect(getBlockIcon("select")).toBe("📋");
      expect(getBlockIcon("checkbox_group")).toBe("☑️");
      expect(getBlockIcon("date")).toBe("📅");
    });

    it("should return question mark for unknown type", () => {
      expect(getBlockIcon("unknown")).toBe("❓");
    });
  });

  describe("BLOCK_TYPES", () => {
    it("should export all block types", () => {
      expect(BLOCK_TYPES).toContain("short_text");
      expect(BLOCK_TYPES).toContain("long_text");
      expect(BLOCK_TYPES).toContain("email");
      expect(BLOCK_TYPES).toContain("select");
      expect(BLOCK_TYPES).toContain("checkbox_group");
      expect(BLOCK_TYPES).toContain("date");
    });
  });
});
