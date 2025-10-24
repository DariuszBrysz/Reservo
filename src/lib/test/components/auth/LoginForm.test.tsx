/**
 * Unit tests for LoginForm component
 *
 * Tests cover:
 * - Component rendering
 * - Client-side validation (email, password)
 * - Form submission with valid credentials
 * - Error handling for invalid credentials (401)
 * - Error handling for validation errors (400)
 * - Network error handling
 * - Loading states
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../../../../components/auth/LoginForm";

// Mock window.location.href
const mockLocationHref = vi.fn();
Object.defineProperty(window, "location", {
  value: {
    _href: "",
    get href() {
      return this._href;
    },
    set href(value: string) {
      this._href = value;
      mockLocationHref(value);
    },
  },
  writable: true,
});

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render the login form with all required fields", () => {
      render(<LoginForm />);

      const signInElements = screen.getAllByText("Sign In");
      expect(signInElements).toHaveLength(2); // title and button
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should render navigation links", () => {
      render(<LoginForm />);

      expect(screen.getByRole("link", { name: /forgot your password/i })).toHaveAttribute("href", "/forgot-password");
      expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
    });

    it("should have proper accessibility attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
    });
  });

  describe("Client-side Validation", () => {
    it("should show error when email is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show error when email format is invalid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid");

      const form = document.querySelector("form");
      if (form) fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show error when password is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show multiple validation errors simultaneously", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it("should clear validation errors when user starts typing", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Trigger validation errors
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

      // Start typing - errors should clear on next submit attempt with valid data
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "password123");

      // Mock successful response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await user.click(submitButton);

      // Validation errors should not be present
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });

    it("should set aria-invalid when field has error", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should link error message with field using aria-describedby", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText(/email/i);
      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
      });

      const errorMessage = screen.getByText(/email is required/i);
      expect(errorMessage).toHaveAttribute("id", "email-error");
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid credentials", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Login successful" }),
      });
      global.fetch = mockFetch;

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        });
      });
    });

    it("should redirect to homepage on successful login", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocationHref).toHaveBeenCalledWith("/");
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Create a promise that we can control
      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(controlledPromise);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole("button", { name: /signing in\.\.\./i })).toBeInTheDocument();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();

      // Resolve the promise
      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(mockLocationHref).toHaveBeenCalledWith("/");
      });
    });

    it("should disable form fields while submitting", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(controlledPromise);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(mockLocationHref).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error for invalid credentials (401)", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/invalid credentials/i);
    });

    it("should display error for bad request (400)", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Email is required" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/email is required/i);
    });

    it("should display generic error for 400 without specific message", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/invalid input/i);
    });

    it("should display generic error for unexpected status codes", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/an unexpected error occurred/i);
    });

    it("should display network error when fetch fails", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/unable to connect to the server/i);
    });

    it("should not redirect on error", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await screen.findByRole("alert");

      expect(mockLocationHref).not.toHaveBeenCalled();
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await screen.findByRole("alert");

      // Form should be re-enabled
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for form fields", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it("should announce errors to screen readers using role=alert", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
    });

    it("should have accessible focus indicators on links", () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole("link", { name: /forgot your password/i });
      const signUpLink = screen.getByRole("link", { name: /sign up/i });

      expect(forgotPasswordLink).toHaveClass("focus-visible:ring-2");
      expect(signUpLink).toHaveClass("focus-visible:ring-2");
    });
  });
});
