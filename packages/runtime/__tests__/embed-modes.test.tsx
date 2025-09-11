import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PopoverEmbed, DrawerEmbed } from "../src/embed-modes";
import type { FormSchema } from "../src/types";

// Mock FormViewer
jest.mock("../src/components/FormViewer", () => ({
  FormViewer: ({ schema, config }: any) => (
    <div data-testid="form-viewer">
      <h2>{schema.title}</h2>
      <button onClick={() => config.onSubmit?.({ test: "data" })}>Submit Form</button>
    </div>
  ),
}));

describe("PopoverEmbed", () => {
  const mockSchema: FormSchema = {
    id: "test-form",
    title: "Test Form",
    description: "A test form",
    version: 1,
    pages: [],
    logic: [],
    settings: {},
  };

  const defaultConfig = {
    apiUrl: "http://localhost:8000",
    onSubmit: jest.fn(),
    triggerText: "Open Form",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders trigger button", () => {
    render(<PopoverEmbed schema={mockSchema} config={defaultConfig} />);

    expect(screen.getByText("Open Form")).toBeInTheDocument();
  });

  it("opens popover when trigger is clicked", () => {
    render(<PopoverEmbed schema={mockSchema} config={defaultConfig} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(screen.getByTestId("form-viewer")).toBeInTheDocument();
  });

  it("closes popover when close button is clicked", () => {
    render(<PopoverEmbed schema={mockSchema} config={defaultConfig} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
  });

  it("closes popover when backdrop is clicked", () => {
    render(<PopoverEmbed schema={mockSchema} config={defaultConfig} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    const backdrop = document.querySelector(".fr-popover-backdrop");
    fireEvent.click(backdrop!);

    expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
  });

  it("applies custom position classes", () => {
    render(<PopoverEmbed schema={mockSchema} config={{ ...defaultConfig, position: "center" }} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    const popover = document.querySelector(".fr-popover");
    expect(popover).toHaveClass("fixed", "inset-0", "flex", "items-center", "justify-center");
  });

  it("calls onSubmit and closes when form is submitted", () => {
    const onSubmit = jest.fn();
    render(<PopoverEmbed schema={mockSchema} config={{ ...defaultConfig, onSubmit }} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    const submitButton = screen.getByText("Submit Form");
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({ test: "data" });
    expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
  });
});

describe("DrawerEmbed", () => {
  const mockSchema: FormSchema = {
    id: "test-form",
    title: "Test Form",
    description: "A test form",
    version: 1,
    pages: [],
    logic: [],
    settings: {},
  };

  const defaultConfig = {
    apiUrl: "http://localhost:8000",
    onSubmit: jest.fn(),
    triggerText: "Open Drawer",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders trigger button", () => {
    render(<DrawerEmbed schema={mockSchema} config={defaultConfig} />);

    expect(screen.getByText("Open Drawer")).toBeInTheDocument();
  });

  it("opens drawer when trigger is clicked", () => {
    render(<DrawerEmbed schema={mockSchema} config={defaultConfig} />);

    const trigger = screen.getByText("Open Drawer");
    fireEvent.click(trigger);

    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(screen.getByTestId("form-viewer")).toBeInTheDocument();
  });

  it("closes drawer when close button is clicked", () => {
    render(<DrawerEmbed schema={mockSchema} config={defaultConfig} />);

    const trigger = screen.getByText("Open Drawer");
    fireEvent.click(trigger);

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
  });

  it("applies custom width and position", () => {
    render(
      <DrawerEmbed
        schema={mockSchema}
        config={{
          ...defaultConfig,
          width: "600px",
          position: "left",
        }}
      />
    );

    const trigger = screen.getByText("Open Drawer");
    fireEvent.click(trigger);

    const drawer = document.querySelector(".fr-drawer");
    expect(drawer).toHaveStyle("width: 600px");
    expect(drawer).toHaveStyle("left: 0");
  });

  it("handles form submission correctly", () => {
    const onSubmit = jest.fn();
    render(<DrawerEmbed schema={mockSchema} config={{ ...defaultConfig, onSubmit }} />);

    const trigger = screen.getByText("Open Drawer");
    fireEvent.click(trigger);

    const submitButton = screen.getByText("Submit Form");
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({ test: "data" });
    expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
  });
});
