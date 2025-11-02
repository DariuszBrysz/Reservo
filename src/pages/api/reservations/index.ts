import type { APIRoute } from "astro";
import type { ErrorResponse, ReservationListDTO, ReservationDTO } from "../../../types";
import { getReservations, getReservationsQuerySchema, hasPermission } from "../../../lib/services/reservations.service";
import {
  createReservation,
  createReservationSchema,
  NotFoundError,
  ConflictError,
} from "../../../lib/services/reservations.service";
import { isFeatureEnabled } from "../../../features";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/reservations
 * Retrieve paginated list of reservations
 *
 * Authentication: Required
 * Query Parameters:
 *   - all (boolean, optional): Retrieve all reservations (admin only). Default: false
 *   - status (string, optional): Filter by status ("confirmed" or "canceled")
 *   - upcoming (boolean, optional): Filter for upcoming reservations. Default: true
 *   - facility_id (number, optional): Filter by facility ID
 *   - limit (number, optional): Results per page (max 100). Default: 50
 *   - offset (number, optional): Pagination offset. Default: 0
 *
 * Returns: ReservationListDTO
 *
 * Authorization:
 *   - Regular users can only view their own reservations
 *   - Admin users with "reservations.view_all" permission can view all reservations using all=true
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const supabase = locals.supabase;

  // Guard: Check if reservations feature is enabled
  if (!isFeatureEnabled("reservations")) {
    const errorResponse: ErrorResponse = {
      error: "Not Found",
      message: "Feature not available",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  // Guard: Validate query parameters
  const queryParams = Object.fromEntries(url.searchParams);
  const validationResult = getReservationsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: validationResult.error.errors[0]?.message || "Invalid query parameters",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validatedQuery = validationResult.data;

  // Guard: Check authorization for all=true parameter
  if (validatedQuery.all === true) {
    const canViewAll = await hasPermission(supabase, "reservations.view_all");

    if (!canViewAll) {
      const errorResponse: ErrorResponse = {
        error: "Forbidden",
        message: "Insufficient permissions",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Fetch reservations from service
  const { data: reservationData, error: serviceError } = await getReservations(supabase, validatedQuery, user.id);

  // Guard: Handle service errors
  if (serviceError || !reservationData) {
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to retrieve reservations",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Happy path: Return reservations
  const response: ReservationListDTO = reservationData;

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * POST /api/reservations
 * Create a new reservation for a sports facility
 *
 * Authentication: Required
 * Request Body: CreateReservationCommand
 * Returns: ReservationDTO (201 Created)
 *
 * Error Codes:
 * - 400: Invalid request body or validation failure
 * - 401: Authentication required
 * - 404: Facility not found
 * - 409: Time slot conflict
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;

  // Guard: Check if reservations feature is enabled
  if (!isFeatureEnabled("reservations")) {
    const errorResponse: ErrorResponse = {
      error: "Not Found",
      message: "Feature not available",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  // Guard: Parse and validate request body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: "Invalid JSON in request body",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: Validate request body against Zod schema
  let validatedData;
  try {
    validatedData = createReservationSchema.parse(requestBody);
  } catch (err) {
    if (err instanceof ZodError) {
      // Extract the first validation error for a cleaner user experience
      const firstError = err.errors[0];
      const errorResponse: ErrorResponse = {
        error: "Bad Request",
        message: firstError.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected validation errors
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: "Request validation failed",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Call service to create reservation
  const { data: reservation, error: serviceError } = await createReservation(supabase, validatedData, user.id);

  // Guard: Handle NotFoundError (facility doesn't exist)
  if (serviceError instanceof NotFoundError) {
    const errorResponse: ErrorResponse = {
      error: "Not Found",
      message: serviceError.message,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: Handle ConflictError (time slot already booked)
  if (serviceError instanceof ConflictError) {
    const errorResponse: ErrorResponse = {
      error: "Conflict",
      message: serviceError.message,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Guard: Handle other service errors
  if (serviceError || !reservation) {
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the reservation",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Happy path: Return created reservation
  const response: ReservationDTO = reservation;

  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
