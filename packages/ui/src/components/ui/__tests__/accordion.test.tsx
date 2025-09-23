import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../accordion";

describe("Accordion Components", () => {
  describe("Accordion", () => {
    it("renders accordion with single item", () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText("Trigger 1")).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("renders accordion with multiple items", () => {
      render(
        <Accordion type="multiple" defaultValue={["item-1", "item-2"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Trigger 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText("Trigger 1")).toBeInTheDocument();
      expect(screen.getByText("Trigger 2")).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <Accordion type="single" className="custom-accordion">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const accordion = container.firstChild;
      expect(accordion).toHaveClass("custom-accordion");
    });
  });

  describe("AccordionItem", () => {
    it("renders with correct value", () => {
      const { container } = render(
        <Accordion type="single">
          <AccordionItem value="test-item" className="custom-item">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      // Find the AccordionItem element
      const item = container.querySelector("[data-state]");
      expect(item).toBeInTheDocument();
      expect(item).toHaveClass("border-b", "custom-item");
    });
  });

  describe("AccordionTrigger", () => {
    it("renders trigger button", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Click me</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole("button", { name: /click me/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveClass(
        "flex",
        "flex-1",
        "items-center",
        "justify-between",
        "py-4",
        "font-medium",
        "transition-all"
      );
    });

    it("toggles content on click", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Hidden Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole("button", { name: /toggle/i });

      // Initially closed
      expect(trigger).toHaveAttribute("data-state", "closed");

      // Click to open
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("data-state", "open");

      // Click to close (with collapsible)
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("data-state", "closed");
    });

    it("renders with chevron icon", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>With Icon</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole("button");
      const icon = trigger.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("h-4", "w-4", "shrink-0", "transition-transform", "duration-200");
    });
  });

  describe("AccordionContent", () => {
    it("renders content when open", () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>
              <p>Content paragraph</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText("Content paragraph")).toBeInTheDocument();
    });

    it("applies correct classes", () => {
      const { container } = render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent className="custom-content">Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      // Check that the custom content class is applied somewhere in the component
      const customContentElement = container.querySelector(".custom-content");
      expect(customContentElement).toBeInTheDocument();

      // Check that pb-4 and pt-0 classes exist (they should be combined with custom-content)
      expect(customContentElement).toHaveClass("pb-4", "pt-0", "custom-content");
    });
  });

  describe("Accordion Interactions", () => {
    it("handles single type accordion correctly", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByRole("button", { name: /item 1/i });
      const trigger2 = screen.getByRole("button", { name: /item 2/i });

      // Open first item
      fireEvent.click(trigger1);
      expect(trigger1).toHaveAttribute("data-state", "open");
      expect(trigger2).toHaveAttribute("data-state", "closed");

      // Open second item (first should close)
      fireEvent.click(trigger2);
      expect(trigger1).toHaveAttribute("data-state", "closed");
      expect(trigger2).toHaveAttribute("data-state", "open");
    });

    it("handles multiple type accordion correctly", () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByRole("button", { name: /item 1/i });
      const trigger2 = screen.getByRole("button", { name: /item 2/i });

      // Open both items
      fireEvent.click(trigger1);
      fireEvent.click(trigger2);

      expect(trigger1).toHaveAttribute("data-state", "open");
      expect(trigger2).toHaveAttribute("data-state", "open");
    });
  });
});
