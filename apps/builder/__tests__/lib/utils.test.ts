import { cn } from "../../lib/utils";

describe("utils", () => {
  describe("cn (classnames)", () => {
    it("should merge class names", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", false && "conditional", "active")).toBe("base active");
    });

    it("should handle undefined and null", () => {
      expect(cn("base", undefined, null, "end")).toBe("base end");
    });

    it("should handle arrays", () => {
      expect(cn(["base", "secondary"], "additional")).toBe("base secondary additional");
    });

    it("should handle objects", () => {
      expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });

    it("should deduplicate Tailwind classes", () => {
      expect(cn("text-red-500", "text-blue-500")).toMatch(/text-blue-500/);
    });

    it("should handle empty input", () => {
      expect(cn()).toBe("");
    });

    it("should handle string arrays", () => {
      expect(cn(["p-4", "m-2"], ["flex", "gap-2"])).toBe("p-4 m-2 flex gap-2");
    });
  });
});
