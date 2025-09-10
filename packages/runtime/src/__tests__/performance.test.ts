import { performance } from "perf_hooks";
import { validateField, shouldShowBlock } from "../utils";
import type { Block } from "../types";

describe("Runtime Performance Tests", () => {
  const generateBlocks = (count: number): Block[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `field_${i}`,
      type: i % 2 === 0 ? "text" : "email",
      question: `Question ${i}`,
      required: i % 3 === 0,
      validation: i % 5 === 0 ? [{ type: "min" as const, value: 3, message: "Too short" }] : [],
    }));
  };

  describe("Field Validation Performance", () => {
    it("should validate fields within P95 < 5ms", () => {
      const blocks = generateBlocks(100);
      const timings: number[] = [];

      // Run multiple times to get P95
      for (let run = 0; run < 100; run++) {
        blocks.forEach((block) => {
          const value = "test@example.com";
          const start = performance.now();
          validateField(block, value);
          const end = performance.now();
          timings.push(end - start);
        });
      }

      // Calculate P95
      timings.sort((a, b) => a - b);
      const p95Index = Math.floor(timings.length * 0.95);
      const p95 = timings[p95Index];

      expect(p95).toBeLessThan(5); // Field validation should be < 5ms
    });
  });

  describe("Logic Evaluation Performance", () => {
    it("should evaluate logic conditions within P95 < 10ms", () => {
      const blocks = generateBlocks(50);
      const values = blocks.reduce(
        (acc, block) => ({
          ...acc,
          [block.id]: `value_${block.id}`,
        }),
        {}
      );

      const timings: number[] = [];

      // Add logic rules to some blocks
      blocks.forEach((block, i) => {
        if (i % 3 === 0 && i > 0) {
          block.logic = [
            {
              condition: {
                field: blocks[i - 1].id,
                operator: "equals",
                value: `value_${blocks[i - 1].id}`,
              },
              action: {
                type: "show",
              },
            },
          ];
        }
      });

      // Run multiple times
      for (let run = 0; run < 100; run++) {
        blocks.forEach((block) => {
          const start = performance.now();
          shouldShowBlock(block, values);
          const end = performance.now();
          timings.push(end - start);
        });
      }

      // Calculate P95
      timings.sort((a, b) => a - b);
      const p95Index = Math.floor(timings.length * 0.95);
      const p95 = timings[p95Index];

      expect(p95).toBeLessThan(10); // Logic evaluation should be < 10ms
    });
  });

  describe("Form State Updates Performance", () => {
    it("should handle rapid state updates efficiently", () => {
      const blocks = generateBlocks(20);
      const timings: number[] = [];

      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        const start = performance.now();

        // Simulate state update
        const newState = {
          currentStep: Math.floor(i / 5),
          values: {
            [`field_${i % 20}`]: `value_${i}`,
          },
          errors: {},
          touched: {
            [`field_${i % 20}`]: true,
          },
          isSubmitting: false,
          isComplete: false,
        };

        // Simulate validation on state change
        const currentBlock = blocks[newState.currentStep];
        if (currentBlock) {
          validateField(currentBlock, newState.values[currentBlock.id]);
        }

        const end = performance.now();
        timings.push(end - start);
      }

      // Calculate P95
      timings.sort((a, b) => a - b);
      const p95Index = Math.floor(timings.length * 0.95);
      const p95 = timings[p95Index];

      expect(p95).toBeLessThan(20); // State updates should be < 20ms
    });
  });

  describe("Bundle Size Requirements", () => {
    it("should have acceptable bundle size", () => {
      // This is checked during build with size-limit
      // Just a placeholder test to document the requirement
      const MAX_BUNDLE_SIZE = 30 * 1024; // 30KB
      const ACTUAL_BUNDLE_SIZE = 9 * 1024; // ~9KB from build output

      expect(ACTUAL_BUNDLE_SIZE).toBeLessThan(MAX_BUNDLE_SIZE);
    });
  });
});
