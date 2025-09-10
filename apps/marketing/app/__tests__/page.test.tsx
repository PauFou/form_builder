import { render } from "@testing-library/react";
import Home from "../page";

// Mock framer-motion to avoid issues in test environment
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe("Home Page", () => {
  it("renders without crashing", () => {
    const { container } = render(<Home />);

    // Check that the main element exists
    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
  });
});
