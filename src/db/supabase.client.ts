import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

/**
 * Cookie options for Supabase SSR authentication
 * Configured for secure, HttpOnly cookies with proper SameSite policy
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array of name-value pairs
 * @param cookieHeader - Raw cookie header string
 * @returns Array of cookie objects with name and value
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create a Supabase server client instance for SSR
 * Uses proper cookie handling for authentication state management
 * @param context - Astro request context with headers and cookies
 * @returns Configured Supabase server client
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
