import type { APIRoute } from "astro";
import type { FacilityListDTO, ErrorResponse } from "../../../types";
import { getAllFacilities } from "../../../lib/services/facilities.service";

export const prerender = false;

/**
 * GET /api/facilities
 * Retrieve list of all available facilities
 *
 * Authentication: Required
 * Returns: FacilityListDTO
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

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

  // Fetch facilities from service
  const { data: facilities, error: serviceError } = await getAllFacilities(supabase);

  // Guard: Handle service errors
  if (serviceError || !facilities) {
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to retrieve facilities",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Happy path: Return facilities
  const response: FacilityListDTO = {
    facilities,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
