import { renderHook } from "@testing-library/react";
import { useFormBlocks } from "../use-form-blocks";
import { useFormBuilderStore } from "../../stores/form-builder-store";
import type { Form } from "@skemya/contracts";

// Mock the store
jest.mock("../../stores/form-builder-store");

describe("useFormBlocks", () => {
  const mockForm: Form = {
    id: "test-form",
    title: "Test Form",
    createdAt: new Date(),
    updatedAt: new Date(),
    pages: [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [
          {
            id: "block-1",
            type: "text",
            question: "Question 1",
          },
          {
            id: "block-2",
            type: "email",
            question: "Question 2",
          },
        ],
      },
      {
        id: "page-2",
        title: "Page 2",
        blocks: [
          {
            id: "block-3",
            type: "number",
            question: "Question 3",
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when no form", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ form: null })
    );

    const { result } = renderHook(() => useFormBlocks());

    expect(result.current).toEqual([]);
  });

  it("should return all blocks from all pages", () => {
    (useFormBuilderStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ form: mockForm })
    );

    const { result } = renderHook(() => useFormBlocks());

    expect(result.current).toHaveLength(3);
    expect(result.current[0].id).toBe("block-1");
    expect(result.current[1].id).toBe("block-2");
    expect(result.current[2].id).toBe("block-3");
  });

  it("should update when form changes", () => {
    let currentForm = mockForm;
    (useFormBuilderStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ form: currentForm })
    );

    const { result, rerender } = renderHook(() => useFormBlocks());

    expect(result.current).toHaveLength(3);

    // Update the form
    const updatedForm = {
      ...mockForm,
      pages: [
        {
          id: "page-1",
          title: "Page 1",
          blocks: [
            {
              id: "block-1",
              type: "text",
              question: "Question 1",
            },
          ],
        },
      ],
    };

    currentForm = updatedForm;

    rerender();

    expect(result.current).toHaveLength(1);
  });
});
