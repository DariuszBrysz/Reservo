/**
 * POST /api/auth/update-password
 *
 * Updates user password after they click the reset link from email
 * Requires a valid recovery session from the email link
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { updatePasswordSchema } from "../../../lib/validators/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = updatePasswordSchema.safeParse(body);

    // Guard: Validate input
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.errors[0]?.message || "Invalid input",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get the current session (should be a recovery session from email link)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Guard: Ensure user has a valid recovery session
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired password reset link. Please request a new one.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    // Guard: Handle password update errors
    if (error) {
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
          error: error.message || "Failed to update password. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Happy path: Password updated successfully
    return new Response(
      JSON.stringify({
        message: "Password updated successfully. You can now log in with your new password.",
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
