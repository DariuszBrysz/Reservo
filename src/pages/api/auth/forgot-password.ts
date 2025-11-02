/**
 * POST /api/auth/forgot-password
 *
 * Initiates password recovery by sending a reset email
 * Returns success regardless of whether the email exists (prevents user enumeration)
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { forgotPasswordSchema } from "../../../lib/validators/auth";
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
    const validation = forgotPasswordSchema.safeParse(body);

    // Guard: Validate input
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.errors[0]?.message || "Invalid input",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Send password reset email
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/login`,
    });

    // Happy path: Always return success to prevent user enumeration
    return new Response(
      JSON.stringify({
        message: "If an account with this email exists, a password reset link has been sent.",
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
