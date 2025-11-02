import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "@supabase/supabase-js";
import { isFeatureEnabled } from "../features";

/**
 * Public paths that don't require authentication
 * Includes auth pages and API endpoints
 */
const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/register",
  "/forgot-password",
  // Error pages
  "/404",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
];

/**
 * Astro Middleware
 * Handles authentication and session management for all requests
 *
 * Flow:
 * 1. Create Supabase server instance with SSR cookie handling
 * 2. Check if current path requires authentication
 * 3. Get user session from Supabase
 * 4. Extract user data (id, email, role) from session
 * 5. Store user and supabase client in context.locals
 * 6. Redirect to /login if accessing protected route without session
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance with SSR support
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase client available to all routes
  locals.supabase = supabase;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith("/api/"));

  // Get user session from Supabase
  // This is CRITICAL - always call getUser() to validate the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, populate locals.user
  if (user) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Extract role from JWT claims (set by custom_access_token_hook)
        // The custom_access_token_hook adds 'user_role' to the JWT claims
        const jwt: JwtPayload = jwtDecode(session.access_token);
        const userRole = jwt.user_role;
        locals.user = {
          id: user.id,
          email: user.email || "",
          role: userRole || "user",
        };
      }
    });
  } else {
    locals.user = null;
  }

  // If accessing a protected route without authentication
  if (!isPublicPath && !user) {
    // If auth feature is disabled, redirect to 404 page
    if (!isFeatureEnabled("auth")) {
      return redirect("/404");
    }
    // Otherwise, redirect to login
    return redirect("/login");
  }

  // If accessing login or register page while already authenticated, redirect to home
  if ((url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/forgot-password") && user) {
    return redirect("/");
  }

  return next();
});
