import type { APIRoute } from "astro";
import { z } from "astro/zod";
import type { ErrorResponse, ReservationDetailDTO, ReservationDTO } from "../../../types";
import {
  getReservationDetails,
  updateReservation,
  updateReservationSchema,
  cancelUserReservation,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../../lib/services/reservations.service";

export const prerender = false;

/**
 * Validation schema for reservation ID path parameter
 */
const reservationIdSchema = z.coerce.number().int().positive({
  message: "Reservation ID must be a positive integer",
});

/**
 * GET /api/reservations/{id}
 * Retrieve details of a specific reservation
 *
 * Authentication: Required
 * Path Parameters:
 *   - id (number): Reservation ID
 *
 * Returns: ReservationDetailDTO
 *
 * Authorization:
 *   - Regular users can only view their own reservations
 *   - Admin users with "reservations.view_all" permission can view any reservation
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

  // Guard: Validate path parameter
  const validationResult = reservationIdSchema.safeParse(params.id);

  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: validationResult.error.errors[0]?.message || "Invalid reservation ID",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reservationId = validationResult.data;

  // Fetch reservation details from service
  const {
    data: reservationData,
    error: serviceError,
    status,
  } = await getReservationDetails(supabase, reservationId, user.id);

  // Guard: Handle service errors
  if (serviceError || !reservationData) {
    const errorResponse: ErrorResponse = {
      error: status === 404 ? "Not Found" : status === 403 ? "Forbidden" : "Internal Server Error",
      message:
        status === 404
          ? "Reservation not found"
          : status === 403
            ? "You do not have permission to view this reservation"
            : "Failed to retrieve reservation",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Happy path: Return reservation details
  const response: ReservationDetailDTO = reservationData;

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * PATCH /api/reservations/{id}
 * Update an existing reservation
 *
 * Authentication: Required
 * Path Parameters:
 *   - id (number): Reservation ID
 * Request Body: UpdateReservationCommand
 *   - For users: { duration: "HH:MM:SS" }
 *   - For admins: { status: "canceled", cancellation_message?: "Optional reason" }
 *
 * Returns: ReservationDTO
 *
 * Authorization:
 *   - Regular users can update duration of their own reservations (12-hour window)
 *   - Admin users can cancel any reservation
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

  // Guard: Validate path parameter
  const pathValidation = reservationIdSchema.safeParse(params.id);

  if (!pathValidation.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: pathValidation.error.errors[0]?.message || "Invalid reservation ID",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reservationId = pathValidation.data;

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

  const bodyValidation = updateReservationSchema.safeParse(requestBody);

  if (!bodyValidation.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: bodyValidation.error.errors[0]?.message || "Invalid request body",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updateCommand = bodyValidation.data;

  // Call service to update reservation
  try {
    const { data: updatedReservation, error: serviceError } = await updateReservation(
      supabase,
      reservationId,
      updateCommand,
      user.id
    );

    // Guard: Handle service errors
    if (serviceError || !updatedReservation) {
      // Map custom error types to HTTP status codes
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

      if (serviceError instanceof ForbiddenError) {
        const errorResponse: ErrorResponse = {
          error: "Forbidden",
          message: serviceError.message,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

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

      // Generic error
      const errorResponse: ErrorResponse = {
        error: "Internal Server Error",
        message: serviceError?.message || "Failed to update reservation",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Happy path: Return updated reservation
    const response: ReservationDTO = updatedReservation;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Catch any unexpected errors
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/reservations/{id}
 * Cancel a user's own reservation
 *
 * Authentication: Required
 * Path Parameters:
 *   - id (number): Reservation ID
 *
 * Returns: 204 No Content
 *
 * Authorization:
 *   - Users can only cancel their own reservations
 *   - Reservation must be in "confirmed" status
 *   - Must be more than 12 hours before start time
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  // Guard: Validate path parameter
  const validationResult = reservationIdSchema.safeParse(params.id);

  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Bad Request",
      message: validationResult.error.errors[0]?.message || "Invalid reservation ID",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reservationId = validationResult.data;

  // Call service to cancel reservation
  try {
    const { error: serviceError } = await cancelUserReservation(supabase, reservationId, user.id);

    // Guard: Handle service errors
    if (serviceError) {
      // Map custom error types to HTTP status codes
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

      if (serviceError instanceof ForbiddenError) {
        const errorResponse: ErrorResponse = {
          error: "Forbidden",
          message: serviceError.message,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generic error
      const errorResponse: ErrorResponse = {
        error: "Internal Server Error",
        message: serviceError.message || "Failed to cancel reservation",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Happy path: Return 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch {
    // Catch any unexpected errors
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
