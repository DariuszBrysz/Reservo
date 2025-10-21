/**
 * POST /api/auth/logout
 *
 * Logs out the current user and clears session cookies
 */

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    // Guard: Handle logout errors
    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to log out. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Happy path: Return success response
    // Session cookies are automatically cleared by the Supabase client
    return new Response(null, { status: 200 });
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
