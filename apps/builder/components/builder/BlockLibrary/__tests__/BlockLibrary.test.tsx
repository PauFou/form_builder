import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { BlockLibrary } from "../BlockLibrary";

// Mock framer-motion
const MockDiv = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
));
MockDiv.displayName = "MockDiv";

jest.mock("framer-motion", () => ({
  motion: {
    div: MockDiv,
  },
}));

// Mock BlockItem to simplify testing
jest.mock("../BlockItem", () => ({
  BlockItem: ({ block }: any) => <div data-testid={`block-item-${block.type}`}>{block.label}</div>,
}));

describe("BlockLibrary", () => {
  const renderWithDndContext = (component: React.ReactElement) => {
    return render(<DndContext>{component}</DndContext>);
  };

  it("renders search input", () => {
    renderWithDndContext(<BlockLibrary />);

    const searchInput = screen.getByPlaceholderText("Search fields...");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders all block categories when not searching", () => {
    renderWithDndContext(<BlockLibrary />);

    expect(screen.getByText("Basic Fields")).toBeInTheDocument();
    expect(screen.getByText("Choice Fields")).toBeInTheDocument();
    expect(screen.getByText("Advanced Fields")).toBeInTheDocument();
    expect(screen.getByText("Layout Elements")).toBeInTheDocument();
  });

  it("displays help text at bottom", () => {
    renderWithDndContext(<BlockLibrary />);

    expect(screen.getByText("Drag fields to add them to your form")).toBeInTheDocument();
  });

  it("filters blocks based on search query", async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BlockLibrary />);

    const searchInput = screen.getByPlaceholderText("Search fields...");
    await user.type(searchInput, "email");

    // Should show email block
    expect(screen.getByTestId("block-item-email")).toBeInTheDocument();

    // Should not show unrelated blocks
    expect(screen.queryByTestId("block-item-rating")).not.toBeInTheDocument();
  });

  it("filters blocks by description", async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BlockLibrary />);

    const searchInput = screen.getByPlaceholderText("Search fields...");
    await user.type(searchInput, "upload");

    // Should show file upload block (description contains "upload")
    expect(screen.getByTestId("block-item-file_upload")).toBeInTheDocument();
  });

  it("shows no results message when search has no matches", async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BlockLibrary />);

    const searchInput = screen.getByPlaceholderText("Search fields...");
    await user.type(searchInput, "xyznomatches");

    expect(screen.getByText("No fields found")).toBeInTheDocument();
  });

  it("clears search results when query is cleared", async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BlockLibrary />);

    const searchInput = screen.getByPlaceholderText("Search fields...") as HTMLInputElement;

    // Type search query
    await user.type(searchInput, "email");
    expect(screen.getByTestId("block-item-email")).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Should show all categories again
    expect(screen.getByText("Basic Fields")).toBeInTheDocument();
    expect(screen.getByText("Choice Fields")).toBeInTheDocument();
  });

  it("renders basic fields by default", () => {
    renderWithDndContext(<BlockLibrary />);

    // Basic fields should be visible (accordion expanded by default)
    expect(screen.getByTestId("block-item-short_text")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-long_text")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-email")).toBeInTheDocument();
  });

  it("renders all block types in correct categories", () => {
    renderWithDndContext(<BlockLibrary />);

    // Basic Fields
    expect(screen.getByTestId("block-item-short_text")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-long_text")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-email")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-phone")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-number")).toBeInTheDocument();

    // Choice Fields (may need to expand accordion first)
    expect(screen.getByTestId("block-item-single_select")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-multi_select")).toBeInTheDocument();
    expect(screen.getByTestId("block-item-dropdown")).toBeInTheDocument();
  });

  it("has scrollable content area", () => {
    const { container } = renderWithDndContext(<BlockLibrary />);

    // Should have overflow-y-auto class for scrolling
    const scrollableArea = container.querySelector(".overflow-y-auto");
    expect(scrollableArea).toBeInTheDocument();
  });

  it("search is case-insensitive", async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BlockLibrary />);

    const searchInput = screen.getByPlaceholderText("Search fields...");
    await user.type(searchInput, "EMAIL");

    expect(screen.getByTestId("block-item-email")).toBeInTheDocument();
  });
});
