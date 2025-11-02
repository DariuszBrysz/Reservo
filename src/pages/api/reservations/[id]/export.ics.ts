import type { APIRoute } from "astro";
import { z } from "astro/zod";
import type { ErrorResponse } from "../../../../types";
import { findReservationForExport, NotFoundError, ForbiddenError } from "../../../../lib/services/reservations.service";
import { generateIcsContent } from "../../../../lib/utils";
import { isFeatureEnabled } from "../../../../features";

export const prerender = false;

/**
 * Validation schema for reservation ID path parameter
 */
const reservationIdSchema = z.coerce.number().int().positive({
  message: "Reservation ID must be a positive integer",
});

/**
 * GET /api/reservations/{id}/export.ics
 * Export a reservation as an iCalendar (.ics) file
 *
 * Authentication: Required
 * Path Parameters:
 *   - id (number): Reservation ID
 *
 * Returns: iCalendar (.ics) file with appropriate headers
 *
 * Feature Flag: reservations
 * Authorization:
 *   - Regular users can only export their own reservations
 *   - Admin users with "reservations.view_all" permission can export any reservation
 *
 * Response Headers:
 *   - Content-Type: text/calendar; charset=utf-8
 *   - Content-Disposition: attachment; filename="reservation-{id}.ics"
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // Guard: Check if reservations export feature is enabled
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

  // Fetch reservation with authorization check and generate ICS content
  try {
    // Call service to retrieve reservation with authorization check
    const reservation = await findReservationForExport(supabase, reservationId, user.id);

    // Generate ICS file content
    const icsContent = generateIcsContent(reservation);

    // Happy path: Return ICS file with appropriate headers
    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservation-${reservationId}.ics"`,
      },
    });
  } catch (error) {
    // Guard: Handle service errors with appropriate HTTP status codes
    if (error instanceof NotFoundError) {
      const errorResponse: ErrorResponse = {
        error: "Not Found",
        message: error.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ForbiddenError) {
      const errorResponse: ErrorResponse = {
        error: "Forbidden",
        message: error.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error for any unexpected issues
    const errorResponse: ErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to export reservation",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
