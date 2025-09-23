import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OneQuestionViewer } from "../OneQuestionViewer";

describe("OneQuestionViewer", () => {
  const mockForm = {
    id: "form-1",
    title: "Test Form",
    pages: [
      {
        id: "page-1",
        blocks: [
          {
            id: "block-1",
            type: "short_text",
            question: "What is your name?",
            required: true,
          },
          {
            id: "block-2",
            type: "email",
            question: "What is your email?",
            required: true,
          },
          {
            id: "block-3",
            type: "yes_no",
            question: "Do you agree?",
            required: false,
          },
        ],
      },
    ],
  };

  const mockOnSubmit = jest.fn();
  const mockOnPartialSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first question", () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("shows required indicator", () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });
  });

  it("moves to next question on valid input", async () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "John Doe" } });

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
      expect(screen.getByText("2 of 3")).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
        initialData={{ "block-1": "John Doe" }}
      />
    );

    // Navigate to email question
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "invalid-email" } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
  });

  it("handles yes/no questions", async () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
        initialData={{
          "block-1": "John Doe",
          "block-2": "john@example.com",
        }}
      />
    );

    // Navigate to yes/no question
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Do you agree?")).toBeInTheDocument();
    });

    const yesButton = screen.getByRole("button", { name: /yes/i });
    fireEvent.click(yesButton);

    // Should auto-advance and submit
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        answers: {
          "block-1": "John Doe",
          "block-2": "john@example.com",
          "block-3": true,
        },
        completed: true,
        completedAt: expect.any(Date),
      });
    });
  });

  it("handles previous navigation", async () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
        initialData={{ "block-1": "John Doe" }}
      />
    );

    // Navigate to second question
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });

    // Go back
    const prevButton = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText("What is your name?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    });
  });

  it("calls onPartialSave with debounce", async () => {
    jest.useFakeTimers();

    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "John" } });

    // Fast forward past debounce
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnPartialSave).toHaveBeenCalledWith({
        answers: { "block-1": "John" },
        currentIndex: 0,
        completed: false,
      });
    });

    jest.useRealTimers();
  });

  it("shows progress bar", () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    const progressBar = screen.getByRole("progressbar", { hidden: true });
    expect(progressBar).toHaveStyle({ width: "33.333333333333336%" });
  });

  it("handles Enter key to advance", async () => {
    render(
      <OneQuestionViewer
        form={mockForm}
        onSubmit={mockOnSubmit}
        onPartialSave={mockOnPartialSave}
      />
    );

    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "John Doe" } });
    fireEvent.keyPress(input, { key: "Enter", code: 13, charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText("What is your email?")).toBeInTheDocument();
    });
  });
});
