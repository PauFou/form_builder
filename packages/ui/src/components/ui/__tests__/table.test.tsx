import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

describe("Table Components", () => {
  describe("Table", () => {
    it("renders table element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass("w-full", "caption-bottom", "text-sm");
    });

    it("applies custom className", () => {
      render(
        <Table className="custom-class">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole("table")).toHaveClass("custom-class");
    });
  });

  describe("TableHeader", () => {
    it("renders thead element", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const thead = screen.getByRole("rowgroup");
      expect(thead).toBeInTheDocument();
      expect(thead).toHaveClass("[&_tr]:border-b");
    });
  });

  describe("TableBody", () => {
    it("renders tbody element", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Body Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const tbody = container.querySelector("tbody");
      expect(tbody).toBeInTheDocument();
      expect(tbody).toHaveClass("[&_tr:last-child]:border-0");
    });
  });

  describe("TableFooter", () => {
    it("renders tfoot element", () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer Content</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      const tfoot = container.querySelector("tfoot");
      expect(tfoot).toBeInTheDocument();
      expect(tfoot).toHaveClass("border-t", "bg-muted/50", "font-medium");
    });
  });

  describe("TableRow", () => {
    it("renders tr element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByRole("row");
      expect(row).toBeInTheDocument();
      expect(row).toHaveClass("border-b", "transition-colors");
    });
  });

  describe("TableHead", () => {
    it("renders th element", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const header = screen.getByRole("columnheader");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("h-12", "px-4", "text-left", "align-middle");
    });

    it("applies custom className", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-header">Column Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByRole("columnheader")).toHaveClass("custom-header");
    });
  });

  describe("TableCell", () => {
    it("renders td element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = screen.getByRole("cell");
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass("p-4", "align-middle");
    });
  });

  describe("TableCaption", () => {
    it("renders caption element", () => {
      render(
        <Table>
          <TableCaption>Table Caption Text</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = screen.getByText("Table Caption Text");
      expect(caption).toBeInTheDocument();
      expect(caption).toHaveClass("mt-4", "text-sm", "text-muted-foreground");
    });
  });

  describe("Complete Table Example", () => {
    it("renders a complete table with all components", () => {
      render(
        <Table>
          <TableCaption>A list of items</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Item 1</TableCell>
              <TableCell>Value 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Item 2</TableCell>
              <TableCell>Value 2</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell>2 items</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText("A list of items")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")).toHaveLength(2);
      expect(screen.getAllByRole("row")).toHaveLength(4); // header + 2 body + footer
      expect(screen.getByText("Total")).toBeInTheDocument();
    });
  });
});
