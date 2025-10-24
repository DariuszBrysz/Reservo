/**
 * Unit tests for UpdatePasswordForm component
 *
 * Tests cover:
 * - Component rendering
 * - Client-side validation (password, confirmPassword)
 * - Form submission with valid passwords
 * - Success state rendering
 * - Error handling for expired/invalid tokens (401)
 * - Error handling for validation errors (400)
 * - Network error handling
 * - Loading states
 * - Redirect after successful password update
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdatePasswordForm } from "../../../../components/auth/UpdatePasswordForm";

describe("UpdatePasswordForm", () => {
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
    it("should render the update password form with all required fields", () => {
      render(<UpdatePasswordForm />);

      // Check title specifically - it's a div with card-title slot, not a heading
      expect(screen.getByText("Update Password", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
    });

    it("should render navigation link to login page", () => {
      render(<UpdatePasswordForm />);

      expect(screen.getByRole("link", { name: /return to login/i })).toHaveAttribute("href", "/login");
    });

    it("should have proper accessibility attributes", () => {
      render(<UpdatePasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "new-password");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("autoComplete", "new-password");
    });
  });

  describe("Client-side Validation", () => {
    it("should show error when password is empty", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when password is less than 8 characters", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when confirm password is empty", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password456");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show multiple validation errors simultaneously", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });

    it("should accept valid password with exactly 8 characters", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "pass1234");
      await user.type(confirmPasswordInput, "pass1234");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it("should accept strong passwords", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      const strongPassword = "MyStr0ng!P@ssw0rd#2024";
      await user.type(passwordInput, strongPassword);
      await user.type(confirmPasswordInput, strongPassword);

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it("should set aria-invalid when field has error", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const submitButton = screen.getByRole("button", { name: /update password/i });

      await user.click(submitButton);

      expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should link error message with field using aria-describedby", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      expect(passwordInput).toHaveAttribute("aria-describedby", "password-error");

      const errorMessage = screen.getByText(/password is required/i);
      expect(errorMessage).toHaveAttribute("id", "password-error");
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid passwords", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Password updated" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/update-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newpassword123",
            confirmPassword: "newpassword123",
          }),
        });
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(controlledPromise);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", { name: /update password/i });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole("button", { name: /updating password\.\.\./i })).toBeInTheDocument();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();

      // Resolve the promise
      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.getByText("Password Updated")).toBeInTheDocument();
      });
    });

    it("should disable all form fields while submitting", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(controlledPromise);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", { name: /update password/i });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");
      await user.click(submitButton);

      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.getByText("Password Updated")).toBeInTheDocument();
      });
    });
  });

  describe("Success State", () => {
    it("should display success message after successful password update", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Password Updated")).toBeInTheDocument();
        expect(screen.getByText(/your password has been successfully changed/i)).toBeInTheDocument();
        expect(screen.getByText(/you can now sign in with your new password/i)).toBeInTheDocument();
      });
    });

    it("should show link to facilities page in success state", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /go to facilities/i });
        expect(link).toHaveAttribute("href", "/");
      });
    });

    it("should redirect to login page after 3 seconds on success", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      expect(screen.getByText("Password Updated")).toBeInTheDocument();

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000);

      expect(mockLocationHref).toHaveBeenCalledWith("/login");
    });

    it("should show checkmark icon in success state", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const svgIcon = screen.getByText("Password Updated").parentElement?.parentElement?.querySelector("svg");
        expect(svgIcon).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error for expired or invalid token (401)", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid or expired token" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/your password reset link has expired or is invalid/i);
    });

    it("should display error for bad request (400)", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Password too weak" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/password too weak/i);
    });

    it("should display generic error for 400 without specific message", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/invalid input/i);
    });

    it("should display generic error for unexpected status codes", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/an unexpected error occurred/i);
    });

    it("should display network error when fetch fails", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toHaveTextContent(/unable to connect to the server/i);
    });

    it("should not show success state on error", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid token" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await screen.findByRole("alert");

      expect(screen.queryByText("Password Updated")).not.toBeInTheDocument();
      expect(mockLocationHref).not.toHaveBeenCalled();
    });

    it("should not redirect on error", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid token" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await screen.findByRole("alert");

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      expect(mockLocationHref).not.toHaveBeenCalled();
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid token" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", { name: /update password/i });

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");
      await user.click(submitButton);

      await screen.findByRole("alert");

      // Form should be re-enabled
      expect(passwordInput).not.toBeDisabled();
      expect(confirmPasswordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for all form fields", () => {
      render(<UpdatePasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      expect(passwordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
    });

    it("should announce errors to screen readers using role=alert", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid token" }),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
    });

    it("should have accessible focus indicators on links", () => {
      render(<UpdatePasswordForm />);

      const returnLink = screen.getByRole("link", { name: /return to login/i });
      expect(returnLink).toHaveClass("focus-visible:ring-2");
    });

    it("should have decorative SVG icons with aria-hidden", async () => {
      const user = userEvent.setup();
      render(<UpdatePasswordForm />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, "newpassword123");
      await user.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const svgIcon = screen.getByText("Password Updated").parentElement?.parentElement?.querySelector("svg");
        expect(svgIcon).toHaveAttribute("aria-hidden", "true");
      });
    });
  });
});
