import React from "react";
import { render } from "@testing-library/react";
import { BLOCK_COMPONENTS } from "../index";
import type { Block } from "../types";

describe("Block Components", () => {
  const baseBlock: Block = {
    id: "test-block",
    type: "short_text",
    question: "Test Question",
  };

  it("exports all expected block components", () => {
    const expectedBlockTypes = [
      "short_text",
      "long_text",
      "email",
      "select",
      "checkbox_group",
      "date",
      "number",
      "phone",
      "currency",
      "address",
      "single_select",
      "multi_select",
      "rating",
      "nps",
      "scale",
      "file_upload",
      "matrix",
      "ranking",
      "signature",
      "payment",
      "statement",
      "dropdown",
    ];

    expectedBlockTypes.forEach((type) => {
      expect(BLOCK_COMPONENTS[type]).toBeDefined();
      expect(typeof BLOCK_COMPONENTS[type]).toBe("function");
    });
  });

  it("renders each block component without crashing", () => {
    Object.entries(BLOCK_COMPONENTS).forEach(([type, Component]) => {
      const block = { ...baseBlock, type };
      const { container } = render(<Component block={block} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  it("each block component accepts standard props", () => {
    const onUpdate = jest.fn();
    const onDelete = jest.fn();
    const onDuplicate = jest.fn();

    Object.entries(BLOCK_COMPONENTS).forEach(([type, Component]) => {
      const block = { ...baseBlock, type };
      const { container } = render(
        <Component
          block={block}
          isSelected={true}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  it("exports the correct number of block components", () => {
    const blockCount = Object.keys(BLOCK_COMPONENTS).length;
    expect(blockCount).toBe(22);
  });

  it("does not contain undefined components", () => {
    Object.values(BLOCK_COMPONENTS).forEach((Component) => {
      expect(Component).not.toBeUndefined();
      expect(Component).not.toBeNull();
    });
  });
});
