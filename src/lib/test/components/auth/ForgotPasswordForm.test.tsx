/**
 * Unit tests for ForgotPasswordForm component
 *
 * Tests cover:
 * - Component rendering
 * - Client-side validation (email)
 * - Form submission with valid email
 * - Success state rendering
 * - Error handling (network errors, server errors)
 * - Security: preventing user enumeration
 * - Loading states
 * - Reset functionality (Send Another Link)
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "../../../../components/auth/ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render the forgot password form with all required fields", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByText("Forgot Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
    });

    it("should render navigation link to login page", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
    });

    it("should have proper accessibility attributes", () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
    });
  });

  describe("Client-side Validation", () => {
    it("should show error when email is empty", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show error when email format is invalid", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid");

      const form = document.querySelector("form");
      if (form) fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should accept various valid email formats", async () => {
      const user = userEvent.setup();

      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user_123@test-domain.org",
      ];

      for (const email of validEmails) {
        const { unmount } = render(<ForgotPasswordForm />);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        const emailInput = screen.getByLabelText(/email/i);
        await user.type(emailInput, email);

        const submitButton = screen.getByRole("button", { name: /send reset link/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it("should set aria-invalid when field has error", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should link error message with field using aria-describedby", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
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
    it("should submit form with valid email", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Reset email sent" }),
      });
      global.fetch = mockFetch;

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user@example.com",
          }),
        });
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(controlledPromise);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole("button", { name: /sending\.\.\./i })).toBeInTheDocument();
      expect(emailInput).toBeDisabled();

      // Resolve the promise
      resolvePromise({ ok: true, status: 200, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      });
    });

    it("should disable form fields while submitting", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(controlledPromise);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      resolvePromise({ ok: true, status: 200, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      });
    });
  });

  describe("Success State", () => {
    it("should display success message after successful submission", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
      expect(screen.getByText(/password reset instructions sent/i)).toBeInTheDocument();
      expect(screen.getByText(/if an account with this email exists/i)).toBeInTheDocument();
    });

    it("should show return to login button in success state", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /return to login/i });
        expect(link).toHaveAttribute("href", "/login");
      });
    });

    it("should show 'Send Another Link' button in success state", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /send another link/i })).toBeInTheDocument();
      });
    });

    it("should return to form when clicking 'Send Another Link'", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      });

      const sendAnotherButton = screen.getByRole("button", { name: /send another link/i });
      await user.click(sendAnotherButton);

      // Should return to the form view
      expect(screen.getByText("Forgot Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
    });

    it("should show checkmark icon in success state", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        const svgIcon = screen.getByText("Check Your Email").parentElement?.parentElement?.querySelector("svg");
        expect(svgIcon).toBeInTheDocument();
      });
    });
  });

  describe("Security - User Enumeration Prevention", () => {
    it("should show success message even for non-existent email to prevent user enumeration", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      // Even if the backend returns success for non-existent users
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "nonexistent@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      // Should still show success message
      expect(await screen.findByText("Check Your Email")).toBeInTheDocument();
      expect(screen.getByText(/if an account with this email exists/i)).toBeInTheDocument();
    });

    it("should use ambiguous success message that does not confirm account existence", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Message should be conditional: "If an account with this email exists..."
        expect(screen.getByText(/if an account with this email exists/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display generic error for server errors", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/an unexpected error occurred/i);
    });

    it("should display network error when fetch fails", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/unable to connect to the server/i);
    });

    it("should not show success state on error", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await screen.findByRole("alert");

      expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
      expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /send reset link/i });

      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      await screen.findByRole("alert");

      // Form should be re-enabled
      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });

    it("should clear validation errors when resubmitting", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      // First submission: validation error
      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

      // Fix the error and resubmit
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");
      await user.click(submitButton);

      // Validation error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA label for email field", () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
    });

    it("should announce errors to screen readers using role=alert", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
    });

    it("should have accessible focus indicators on links", () => {
      render(<ForgotPasswordForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toHaveClass("focus-visible:ring-2");
    });

    it("should have decorative SVG icons with aria-hidden", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      const submitButton = screen.getByRole("button", { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        const svgIcon = screen.getByText("Check Your Email").parentElement?.parentElement?.querySelector("svg");
        expect(svgIcon).toHaveAttribute("aria-hidden", "true");
      });
    });
  });
});
