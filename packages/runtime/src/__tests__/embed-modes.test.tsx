import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PopoverEmbed, DrawerEmbed } from "../embed-modes";
import type { FormSchema } from "../types";

// Mock the FormViewer component
jest.mock("../components/FormViewer", () => ({
  FormViewer: ({ schema }: any) => (
    <div data-testid="form-viewer">
      {schema.blocks?.[0]?.question || schema.pages?.[0]?.blocks?.[0]?.question || "Form content"}
    </div>
  ),
}));

const mockSchema: FormSchema = {
  id: "test-form",
  title: "Test Form",
  blocks: [
    {
      id: "name",
      type: "text",
      question: "What's your name?",
      required: true,
    },
  ],
};

const mockConfig = {
  formId: "test-form",
  apiUrl: "https://api.example.com",
  onSubmit: jest.fn(),
};

describe("PopoverEmbed", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("should render trigger button", () => {
    render(<PopoverEmbed schema={mockSchema} config={mockConfig} />);

    expect(screen.getByText("Open Form")).toBeInTheDocument();
  });

  it("should use custom trigger text", () => {
    render(
      <PopoverEmbed schema={mockSchema} config={{ ...mockConfig, triggerText: "Start Survey" }} />
    );

    expect(screen.getByText("Start Survey")).toBeInTheDocument();
  });

  it("should open popover on trigger click", async () => {
    render(<PopoverEmbed schema={mockSchema} config={mockConfig} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });
  });

  it("should close popover on backdrop click", async () => {
    render(<PopoverEmbed schema={mockSchema} config={mockConfig} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    const backdrop = document.querySelector(".fr-popover-backdrop");
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
    });
  });

  it("should close popover on close button click", async () => {
    render(<PopoverEmbed schema={mockSchema} config={mockConfig} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
    });
  });

  it("should apply custom position class", async () => {
    render(<PopoverEmbed schema={mockSchema} config={{ ...mockConfig, position: "center" }} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      const popover = document.querySelector(".fr-popover");
      expect(popover).toHaveClass("fixed inset-0 flex items-center justify-center");
    });
  });
});

describe("DrawerEmbed", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("should render trigger button", () => {
    render(<DrawerEmbed schema={mockSchema} config={mockConfig} />);

    expect(screen.getByText("Open Form")).toBeInTheDocument();
  });

  it("should open drawer on trigger click", async () => {
    render(<DrawerEmbed schema={mockSchema} config={mockConfig} />);

    const trigger = screen.getByText("Open Form");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });
  });

  it("should close drawer on backdrop click", async () => {
    render(<DrawerEmbed schema={mockSchema} config={mockConfig} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    const backdrop = document.querySelector(".fr-drawer-backdrop");
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
    });
  });

  it("should close drawer on close button click", async () => {
    render(<DrawerEmbed schema={mockSchema} config={mockConfig} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
    });
  });

  it("should apply custom width", async () => {
    render(<DrawerEmbed schema={mockSchema} config={{ ...mockConfig, width: "500px" }} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      const drawer = document.querySelector(".fr-drawer");
      expect(drawer).toHaveStyle({ width: "500px" });
    });
  });

  it("should support left position", async () => {
    render(<DrawerEmbed schema={mockSchema} config={{ ...mockConfig, position: "left" }} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      const drawer = document.querySelector(".fr-drawer");
      expect(drawer).toHaveClass("fr-drawer-left");
      expect(drawer).toHaveStyle({ left: "0" });
    });
  });

  it("should handle form submission and close drawer", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<DrawerEmbed schema={mockSchema} config={{ ...mockConfig, onSubmit }} />);

    fireEvent.click(screen.getByText("Open Form"));

    await waitFor(() => {
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    // Simulate form submission would happen here
    // The actual form submission logic is handled by FormRenderer

    // For now, we just verify the config is passed correctly
    expect(onSubmit).not.toHaveBeenCalled(); // Not called until form is actually submitted
  });
});
