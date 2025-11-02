/**
 * POST /api/auth/register
 *
 * Creates a new user account with email verification
 * Supabase sends a verification email automatically
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/validators/auth";
import { isFeatureEnabled } from "../../../features";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Guard: Check if auth feature is enabled
  if (!isFeatureEnabled("auth")) {
    return new Response(
      JSON.stringify({
        error: "Authentication feature is currently unavailable.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    // Guard: Validate input
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.errors[0]?.message || "Invalid input",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to create new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    // Guard: Handle registration errors
    if (error) {
      // Check for specific error types
      if (error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({
            error: "An account with this email already exists.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error.message.includes("Password should be at least")) {
        return new Response(
          JSON.stringify({
            error: "Password must be at least 8 characters long.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "An error occurred during registration. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Guard: Ensure user data exists
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Registration failed. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Happy path: Return success response
    return new Response(
      JSON.stringify({
        message: "Registration successful! Please check your email to verify your account.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
