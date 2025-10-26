/**
 * LoginForm - Client-side form for user authentication
 *
 * Manages login form state (email, password), performs client-side validation,
 * handles form submission to the backend API, and displays success or error messages.
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Redirect to homepage on successful login
        window.location.href = "/";
      } else {
        const data = await response.json();

        if (response.status === 401) {
          setErrors({ general: "Invalid credentials. Please check your email and password." });
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

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="login-form-card">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          {/* Email Field */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="you@example.com"
                autoComplete="email"
                data-testid="login-email-input"
              />
              {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
            </FieldContent>
          </Field>

          {/* Password Field */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="current-password"
                data-testid="login-password-input"
              />
              {errors.password && <FieldError id="password-error">{errors.password}</FieldError>}
            </FieldContent>
          </Field>

          {/* General Error Message */}
          {errors.general && (
            <div
              role="alert"
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3"
              data-testid="login-error-message"
            >
              {errors.general}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-submit-button">
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          {/* Additional Links */}
          <div className="space-y-2 text-center text-sm">
            <div>
              <a
                href="/forgot-password"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                Forgot your password?
              </a>
            </div>
            <div className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                Sign up
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
