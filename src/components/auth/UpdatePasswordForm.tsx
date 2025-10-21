/**
 * UpdatePasswordForm - Client-side form for setting a new password
 *
 * Allows users to set a new password after clicking the recovery link from their email.
 * This page is required by the Supabase password recovery flow.
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        const data = await response.json();

        if (response.status === 401) {
          setErrors({ general: "Your password reset link has expired or is invalid. Please request a new one." });
        } else if (response.status === 400) {
          setErrors({ general: data.error || "Invalid input. Please check your details." });
        } else {
          setErrors({ general: "An unexpected error occurred. Please try again." });
        }
      }
    } catch {
      setErrors({ general: "Unable to connect to the server. Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Password Updated</CardTitle>
          <CardDescription>Your password has been successfully changed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">You can now sign in with your new password.</p>
            <p className="text-sm text-muted-foreground">Redirecting to facilities page in a few seconds...</p>
          </div>
          <Button asChild className="w-full">
            <a href="/">Go to Facilities</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Update Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          <Field>
            <FieldLabel htmlFor="password">New Password</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="new-password"
              />
              {errors.password && <FieldError id="password-error">{errors.password}</FieldError>}
            </FieldContent>
          </Field>

          {/* Confirm Password Field */}
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
            <FieldContent>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <FieldError id="confirm-password-error">{errors.confirmPassword}</FieldError>}
            </FieldContent>
          </Field>

          {/* General Error Message */}
          {errors.general && (
            <div
              role="alert"
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3"
            >
              {errors.general}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating password..." : "Update Password"}
          </Button>

          {/* Additional Links */}
          <div className="text-center text-sm text-muted-foreground">
            <a
              href="/login"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              Return to login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
