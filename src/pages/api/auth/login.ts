/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password
 * Sets secure HTTP-only cookies for session management
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { loginSchema } from "../../../lib/validators/auth";
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
    const validation = loginSchema.safeParse(body);

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

    // Attempt to sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Guard: Handle authentication errors
    if (error) {
      // Check for specific error types
      if (error.message.includes("Invalid login credentials")) {
        return new Response(
          JSON.stringify({
            error: "Invalid credentials. Please check your email and password.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error.message.includes("Email not confirmed")) {
        return new Response(
          JSON.stringify({
            error: "Please verify your email address before logging in.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "An error occurred during login. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Guard: Ensure user data exists
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Authentication failed. Please try again.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Happy path: Return success response
    // Session cookies are automatically set by the Supabase client
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
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
