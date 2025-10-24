/**
 * Unit tests for RegisterForm component
 *
 * Tests cover:
 * - Component rendering
 * - Client-side validation (email, password, confirmPassword)
 * - Form submission with valid data
 * - Success state rendering
 * - Error handling for existing user (409)
 * - Error handling for validation errors (400)
 * - Network error handling
 * - Loading states
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../../../../components/auth/RegisterForm";

describe("RegisterForm", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockLocationHref: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    mockLocationHref = vi.fn();

    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("location", {
      _href: "",
      set href(value: string) {
        mockLocationHref(value);
      },
    });
    vi.useFakeTimers({
      shouldAdvanceTime: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render the registration form with all required fields", () => {
      render(<RegisterForm />);

      // Check title specifically - it's a div with card-title slot, not a heading
      expect(screen.getByText("Create Account", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    it("should render navigation link to login page", () => {
      render(<RegisterForm />);

      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
    });

    it("should have proper accessibility attributes", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "new-password");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("autoComplete", "new-password");
    });
  });

  describe("Client-side Validation", () => {
    it("should show error when email is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      // Check that error appears
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when email format is invalid", async () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      fireEvent.change(emailInput, { target: { value: "invalid" } });

      const form = document.querySelector("form");
      if (form) fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when password is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when password is less than 8 characters", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when confirm password is empty", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password456");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show multiple validation errors simultaneously", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });

    it("should accept valid password with exactly 8 characters", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "pass1234");
      await user.type(confirmPasswordInput, "pass1234");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it("should set aria-invalid when field has error", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });

      await user.click(submitButton);

      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should link error message with field using aria-describedby", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute("aria-describedby", "password-error");

      const errorMessage = screen.getByText(/password is required/i);
      expect(errorMessage).toHaveAttribute("id", "password-error");
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Registration successful" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "newuser@example.com",
            password: "password123",
            confirmPassword: "password123",
          }),
        });
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(controlledPromise);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole("button", { name: /creating account\.\.\./i })).toBeInTheDocument();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();

      // Resolve the promise
      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      });
    });

    it("should disable all form fields while submitting", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(controlledPromise);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      });
    });
  });

  describe("Success State", () => {
    it("should display success message after successful registration", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
        expect(screen.getByText(/please check your email inbox and click the verification link/i)).toBeInTheDocument();
      });
    });

    it("should show link to facilities page in success state", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /go to facilities/i });
        expect(link).toHaveAttribute("href", "/");
      });
    });

    it("should redirect to main page after 3 seconds on success", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText("Check Your Email")).toBeInTheDocument();

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000);

      expect(mockLocationHref).toHaveBeenCalledWith("/");
    });

    it("should show email icon in success state", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        const svgIcon = screen.getByText("Check Your Email").parentElement?.parentElement?.querySelector("svg");
        expect(svgIcon).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error when email already exists (409)", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "User already exists" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/an account with this email already exists/i);
    });

    it("should display error for bad request (400)", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid email format" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/invalid email format/i);
    });

    it("should display generic error for 400 without specific message", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/invalid input/i);
    });

    it("should display generic error for unexpected status codes", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/an unexpected error occurred/i);
    });

    it("should display network error when fetch fails", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/unable to connect to the server/i);
    });

    it("should not show success state on error", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "User already exists" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      await screen.findByRole("alert");

      expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
      expect(mockLocationHref).not.toHaveBeenCalled();
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "User already exists" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /create account/i });

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(submitButton);

      await screen.findByRole("alert");

      // Form should be re-enabled
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(confirmPasswordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for all form fields", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
    });

    it("should announce errors to screen readers using role=alert", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "User already exists" }),
      });

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create account/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
    });

    it("should have accessible focus indicators on links", () => {
      render(<RegisterForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });

      expect(signInLink).toHaveClass("focus-visible:ring-2");
    });
  });
});
