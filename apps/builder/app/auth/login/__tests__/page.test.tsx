import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import LoginPage from "../page";
import { useAuthStore } from "../../../../lib/stores/auth-store";
import { useToast } from "@skemya/ui";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../lib/stores/auth-store");

jest.mock("@skemya/ui", () => ({
  ...jest.requireActual("@skemya/ui"),
  useToast: jest.fn(),
}));

describe("LoginPage", () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it("renders login form", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(
      screen.getByText("Enter your email and password to access your account")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows validation errors for invalid inputs", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("validates email format using HTML5 validation", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    await user.type(emailInput, "invalid-email");

    // HTML5 email validation should mark the input as invalid
    expect(emailInput.validity.valid).toBe(false);
    expect(emailInput.validity.typeMismatch).toBe(true);

    // The form should not submit with invalid email
    const form = emailInput.closest("form");
    expect(form?.checkValidity()).toBe(false);
  });

  it("validates password length", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "short");

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success",
        description: "You have been logged in successfully.",
      });
      expect(mockPush).toHaveBeenCalledWith("/forms");
    });
  });

  it("shows error message on login failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Login failed",
        description: "Invalid credentials",
        variant: "destructive",
      });
    });
  });

  it("shows loading state during login", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });

    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /signing in/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });

  it("shows forgot password link", () => {
    render(<LoginPage />);

    const forgotLink = screen.getByRole("link", { name: "Forgot password?" });
    expect(forgotLink).toHaveAttribute("href", "/auth/forgot-password");
  });

  it("shows sign up link", () => {
    render(<LoginPage />);

    const signUpLink = screen.getByRole("link", { name: "Create account" });
    expect(signUpLink).toHaveAttribute("href", "/auth/signup");
  });

  it("handles API error response", async () => {
    const user = userEvent.setup();
    const apiError = {
      response: {
        data: {
          error: "Account locked",
        },
      },
    };
    mockLogin.mockRejectedValue(apiError);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Account locked")).toBeInTheDocument();
    });
  });
});
