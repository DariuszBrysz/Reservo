import type { APIRoute } from "astro";
import type { ErrorResponse } from "../../../types";
import { getFacilityById } from "../../../lib/services/facilities.service";
import { isFeatureEnabled } from "../../../features";
import { z } from "astro/zod";

export const prerender = false;

const pathParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * GET /api/facilities/{id}
 * Retrieve details of a specific facility
 *
 * Authentication: Required
 * Returns: FacilityDTO
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // Guard: Check if facilities feature is enabled
  if (!isFeatureEnabled("facilities")) {
    const errorResponse: ErrorResponse = {
      error: "Not Found",
      message: "Feature not available",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: Validate path parameters
  const validationResult = pathParamsSchema.safeParse(params);

  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: "Invalid facility ID",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = validationResult.data;

  // Guard: Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponse = {
      error: "Unauthorized",
      message: "Authentication required",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch facility from service
  const { data: facility, error: serviceError } = await getFacilityById(supabase, id);

  // Guard: Handle service errors
  if (serviceError) {
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to retrieve facility",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: Handle not found
  if (!facility) {
    const errorResponse: ErrorResponse = {
      error: "Not Found",
      message: "Facility not found",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Happy path: Return facility
  return new Response(JSON.stringify(facility), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
