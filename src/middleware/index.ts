import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";
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

  // Get JWT claims from Supabase to validate session and extract user data
  const { data: jwtData, error: claimsError } = await supabase.auth.getClaims();

  // If claims are present, extract user data from them
  if (jwtData?.claims && !claimsError) {
    const userRole = (jwtData.claims.user_role as string) || "user";
    locals.user = {
      id: jwtData.claims.sub || "",
      email: jwtData.claims.email || "",
      role: userRole,
    };
  } else {
    locals.user = null;
  }

  // If accessing a protected route without authentication
  if (!isPublicPath && (!jwtData?.claims || claimsError)) {
    // If auth feature is disabled, redirect to 404 page
    if (!isFeatureEnabled("auth")) {
      return redirect("/404");
    }
    // Otherwise, redirect to login
    return redirect("/login");
  }

  // If accessing login or register page while already authenticated, redirect to home
  if (
    (url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/forgot-password") &&
    jwtData?.claims &&
    !claimsError
  ) {
    return redirect("/");
  }

  return next();
});
