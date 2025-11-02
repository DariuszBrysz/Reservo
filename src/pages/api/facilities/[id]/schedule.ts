import type { APIRoute } from "astro";
import type { ErrorResponse, FacilityScheduleDTO } from "../../../../types";
import { getFacilitySchedule } from "../../../../lib/services/facilities.service";
import { isFeatureEnabled } from "../../../../features";
import { z } from "astro/zod";

export const prerender = false;

// Validation schema for path parameters
const pathParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Validation schema for query parameters
const queryParamsSchema = z.object({
  date: z.string().date(),
});

/**
 * GET /api/facilities/{id}/schedule
 * Retrieve the daily schedule for a specific facility
 *
 * Authentication: Required
 * Query Parameters:
 *   - date (required): Date in YYYY-MM-DD format
 *
 * Returns: FacilityScheduleDTO
 *
 * Authorization:
 *   - Admin users can see all reservation details including user emails
 *   - Regular users can only see their own email in reservations
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
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
  const pathValidationResult = pathParamsSchema.safeParse(params);

  if (!pathValidationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: "Invalid facility ID",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = pathValidationResult.data;

  // Guard: Validate query parameters
  const queryParams = Object.fromEntries(url.searchParams);
  const queryValidationResult = queryParamsSchema.safeParse(queryParams);

  if (!queryValidationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: "Date parameter is required and must be in YYYY-MM-DD format",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { date } = queryValidationResult.data;

  // Fetch facility schedule from service
  const { data: scheduleData, error: serviceError } = await getFacilitySchedule(supabase, id, date);

  // Guard: Handle service errors
  if (serviceError) {
    // Check if it's a "not found" error
    if (serviceError.message === "Facility not found") {
      const errorResponse: ErrorResponse = {
        error: "Not Found",
        message: "Facility not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to retrieve facility schedule",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: Handle unexpected null data
  if (!scheduleData) {
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to retrieve facility schedule",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Happy path: Construct and return the final response
  const response: FacilityScheduleDTO = {
    facility: scheduleData.facility,
    date: date,
    reservations: scheduleData.reservations,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
