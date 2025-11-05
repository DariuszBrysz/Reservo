import { z } from "astro/zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  AppPermission,
  ReservationListDTO,
  ReservationDetailDTO,
  ReservationStatus,
  CreateReservationCommand,
  ReservationDTO,
  UpdateReservationCommand,
} from "../../types";

/**
 * Validation schema for GET /api/reservations query parameters
 */
export const getReservationsQuerySchema = z.object({
  all: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  status: z.enum(["confirmed", "canceled"] as const).optional() as z.ZodOptional<
    z.ZodEnum<[ReservationStatus, ...ReservationStatus[]]>
  >,
  upcoming: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  facility_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100, "Maximum limit is 100").default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

/**
 * Type for validated query parameters
 */
export type ValidatedReservationsQuery = z.infer<typeof getReservationsQuerySchema>;

/**
 * Retrieve reservations with filtering and pagination
 * @param supabase - Authenticated Supabase client
 * @param query - Validated query parameters
 * @param userId - Current user ID (for filtering user's own reservations)
 * @returns Paginated list of reservations with facility info or null on error
 */
export async function getReservations(
  supabase: SupabaseClient,
  query: ValidatedReservationsQuery,
  userId: string
): Promise<{ data: ReservationListDTO | null; error: Error | null }> {
  try {
    const { status, upcoming, facility_id, limit = 50, offset = 0 } = query;

    // Build the base query with facility join
    let queryBuilder = supabase
      .from("reservations")
      .select(
        `
        id,
        start_time,
        duration,
        status,
        cancellation_message,
        created_at,
        updated_at,
        facilities:facility_id (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // Apply filters based on query parameters
    // Filter by status if provided
    if (status) {
      queryBuilder = queryBuilder.eq("status", status);
    }

    // Filter by upcoming reservations (default: true)
    if (upcoming) {
      queryBuilder = queryBuilder.gte("start_time", new Date().toISOString());
    }

    // Filter by facility_id if provided
    if (facility_id) {
      queryBuilder = queryBuilder.eq("facility_id", facility_id);
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1).order("start_time", { ascending: true });

    // Execute the query
    const { data: reservationsData, error: queryError, count } = await queryBuilder;

    // Guard: Handle query errors
    if (queryError) {
      return { data: null, error: new Error("Failed to fetch reservations") };
    }

    // Guard: Handle missing data
    if (!reservationsData) {
      return { data: null, error: new Error("No data returned from query") };
    }

    // Map results to ReservationDetailDTO with calculated end_time
    const reservations: ReservationDetailDTO[] = reservationsData.map((reservation) => {
      // Calculate end_time by adding duration to start_time
      const endTime = calculateEndTime(reservation.start_time, reservation.duration as string);

      // Type assertion for facilities - Supabase returns array for joins
      const facilityData = Array.isArray(reservation.facilities) ? reservation.facilities[0] : reservation.facilities;

      return {
        id: reservation.id,
        facility: {
          id: facilityData.id,
          name: facilityData.name,
        },
        start_time: reservation.start_time,
        duration: reservation.duration as string,
        end_time: endTime,
        status: reservation.status,
        cancellation_message: reservation.cancellation_message,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at,
      };
    });

    // Construct the response
    const response: ReservationListDTO = {
      reservations,
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    };

    return { data: response, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Calculate end time by adding duration to start time
 * @param startTime - ISO 8601 datetime string
 * @param duration - PostgreSQL interval format (e.g., "01:30:00")
 * @returns ISO 8601 datetime string for end time
 */
function calculateEndTime(startTime: string, duration: string): string {
  const start = new Date(startTime);

  // Parse PostgreSQL interval format (HH:MM:SS)
  const [hours, minutes, seconds] = duration.split(":").map(Number);

  // Add duration to start time
  const end = new Date(start);
  end.setUTCHours(end.getUTCHours() + hours);
  end.setUTCMinutes(end.getUTCMinutes() + minutes);
  end.setUTCSeconds(end.getUTCSeconds() + seconds);

  return end.toISOString();
}

/**
 * Retrieve a specific reservation by ID with facility information
 * @param supabase - Authenticated Supabase client
 * @param id - Reservation ID to retrieve
 * @param userId - Current user ID (for authorization)
 * @returns Reservation details with facility info or null if not found/unauthorized
 */
export async function getReservationDetails(
  supabase: SupabaseClient,
  id: number,
  userId: string
): Promise<{ data: ReservationDetailDTO | null; error: Error | null; status?: number }> {
  try {
    // Fetch reservation with facility join
    const { data: reservationData, error: queryError } = await supabase
      .from("reservations")
      .select(
        `
        id,
        start_time,
        duration,
        status,
        cancellation_message,
        created_at,
        updated_at,
        user_id,
        facilities:facility_id (
          id,
          name
        )
      `
      )
      .eq("id", id)
      .single();

    // Guard: Handle not found error
    if (queryError) {
      // Supabase returns PGRST116 for "not found" with .single()
      if (queryError.code === "PGRST116") {
        return { data: null, error: new Error("Reservation not found"), status: 404 };
      }
      return { data: null, error: new Error("Failed to fetch reservation"), status: 500 };
    }

    // Guard: Handle missing data
    if (!reservationData) {
      return { data: null, error: new Error("Reservation not found"), status: 404 };
    }

    // Check if user has permission to view all reservations
    const canViewAll = await hasPermission(supabase, "reservations.view_all");

    // Guard: Check authorization - user must own the reservation or be an admin
    if (!canViewAll && reservationData.user_id !== userId) {
      return { data: null, error: new Error("Forbidden"), status: 403 };
    }

    // Calculate end_time by adding duration to start_time
    const endTime = calculateEndTime(reservationData.start_time, reservationData.duration as string);

    // Type assertion for facilities - Supabase returns array for joins
    const facilityData = Array.isArray(reservationData.facilities)
      ? reservationData.facilities[0]
      : reservationData.facilities;

    // Map result to ReservationDetailDTO
    const reservation: ReservationDetailDTO = {
      id: reservationData.id,
      facility: {
        id: facilityData.id,
        name: facilityData.name,
      },
      start_time: reservationData.start_time,
      duration: reservationData.duration as string,
      end_time: endTime,
      status: reservationData.status,
      cancellation_message: reservationData.cancellation_message,
      created_at: reservationData.created_at,
      updated_at: reservationData.updated_at,
    };

    return { data: reservation, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
      status: 500,
    };
  }
}
/**
 * Check if user has a specific permission
 * @param supabase - Authenticated Supabase client
 * @param permission - Permission to check
 * @returns boolean indicating if user has permission
 */
export async function hasPermission(supabase: SupabaseClient, permission: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("authorize", {
      requested_permission: permission as AppPermission,
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}

/**
 * Custom error class for facility not found errors
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Custom error class for reservation conflict errors
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Custom error class for forbidden access errors
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Zod schema for UpdateReservationCommand validation
 * Supports duration updates (users) and status/cancellation (admins)
 */
export const updateReservationSchema = z
  .object({
    duration: z.string().time("Duration must be in HH:MM:SS format (e.g., '01:30:00')").optional(),
    status: z.literal("canceled").optional(),
    cancellation_message: z.string().max(500, "Cancellation message must not exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      // Validate duration constraints if provided
      if (data.duration) {
        const [hours, minutes, seconds] = data.duration.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes + seconds / 60;
        return totalMinutes >= 30 && totalMinutes <= 180;
      }
      return true;
    },
    {
      message: "Reservation duration must be between 30 minutes and 3 hours",
      path: ["duration"],
    }
  )
  .refine(
    (data) => {
      // Validate duration is in 15-minute increments if provided
      if (data.duration) {
        const [hours, minutes, seconds] = data.duration.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes;
        return totalMinutes % 15 === 0 && seconds === 0;
      }
      return true;
    },
    {
      message: "Reservation duration must be in 15-minute increments (e.g., 00:30:00, 00:45:00, 01:00:00)",
      path: ["duration"],
    }
  )
  .refine(
    (data) => {
      // Must have at least one field
      return data.duration !== undefined || data.status !== undefined || data.cancellation_message !== undefined;
    },
    {
      message: "At least one field must be provided",
    }
  );

/**
 * Zod schema for CreateReservationCommand validation
 * Enforces all business rules for reservation creation
 */
export const createReservationSchema = z
  .object({
    facility_id: z.number().int().positive("Facility ID must be a positive integer"),
    start_time: z.string().datetime("Start time must be a valid ISO 8601 datetime"),
    duration: z.string().time("Duration must be in HH:MM:SS format (e.g., '01:30:00')"),
  })
  .refine(
    (data) => {
      // Validate start_time is in the future
      const startTime = new Date(data.start_time);
      const now = new Date();
      return startTime > now;
    },
    {
      message: "Reservation start time must be in the future",
      path: ["start_time"],
    }
  )
  .refine(
    (data) => {
      // Validate start_time is within 7 days
      const startTime = new Date(data.start_time);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return startTime <= sevenDaysFromNow;
    },
    {
      message: "Reservation must be made within 7 days from now",
      path: ["start_time"],
    }
  )
  .refine(
    (data) => {
      // Validate start_time is between 14:00 and 22:00
      const startTime = new Date(data.start_time);

      const startLimitTime = new Date(startTime);
      startLimitTime.setUTCHours(14, 0, 0, 0);
      const endLimitTime = new Date(startTime);
      endLimitTime.setUTCHours(22, 0, 0, 0);

      return startTime >= startLimitTime && startTime <= endLimitTime;
    },
    {
      message: "Reservation start time must be between 14:00 and 22:00",
      path: ["start_time"],
    }
  )
  .refine(
    (data) => {
      // Validate start_time is on 15-minute intervals
      const startTime = new Date(data.start_time);
      const minutes = startTime.getUTCMinutes();
      return minutes % 15 === 0 && startTime.getUTCSeconds() === 0;
    },
    {
      message: "Reservation start time must be on 15-minute intervals (e.g., 14:00, 14:15, 14:30)",
      path: ["start_time"],
    }
  )
  .refine(
    (data) => {
      // Validate duration is between 30 minutes and 3 hours
      const [hours, minutes, seconds] = data.duration.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      return totalMinutes >= 30 && totalMinutes <= 180;
    },
    {
      message: "Reservation duration must be between 30 minutes and 3 hours",
      path: ["duration"],
    }
  )
  .refine(
    (data) => {
      // Validate duration is in 15-minute increments
      const [hours, minutes, seconds] = data.duration.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes % 15 === 0 && seconds === 0;
    },
    {
      message: "Reservation duration must be in 15-minute increments (e.g., 00:30:00, 00:45:00, 01:00:00)",
      path: ["duration"],
    }
  )
  .refine(
    (data) => {
      // Validate end_time is before 22:00
      const startTime = new Date(data.start_time);
      const [hours, minutes, seconds] = data.duration.split(":").map(Number);

      const endTime = new Date(startTime);
      endTime.setUTCHours(endTime.getUTCHours() + hours);
      endTime.setUTCMinutes(endTime.getUTCMinutes() + minutes);
      endTime.setUTCSeconds(endTime.getUTCSeconds() + seconds);

      const limitTime = new Date(startTime);
      limitTime.setUTCHours(22, 0, 0, 0);

      return endTime <= limitTime;
    },
    {
      message: "Reservation end time must not exceed 22:00",
      path: ["duration"],
    }
  );

/**
 * Create a new reservation for a facility
 * @param supabase - Authenticated Supabase client
 * @param command - Validated reservation creation data
 * @param userId - ID of the authenticated user making the reservation
 * @returns Newly created reservation with computed end_time
 * @throws NotFoundError if facility doesn't exist
 * @throws ConflictError if time slot is already booked
 */
export async function createReservation(
  supabase: SupabaseClient,
  command: CreateReservationCommand,
  userId: string
): Promise<{ data: ReservationDTO | null; error: Error | null }> {
  try {
    // Step 1: Verify facility exists
    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .select("id")
      .eq("id", command.facility_id)
      .single();

    // Guard: Check if facility exists
    if (facilityError || !facility) {
      return {
        data: null,
        error: new NotFoundError(`Facility with ID ${command.facility_id} not found`),
      };
    }

    // Step 2: Insert the new reservation
    const { data: newReservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        facility_id: command.facility_id,
        user_id: userId,
        start_time: command.start_time,
        duration: command.duration,
        status: "confirmed",
      })
      .select()
      .single();

    // Guard: Handle insert errors
    if (insertError) {
      // Check for PostgreSQL unique violation or trigger constraint (double-booking)
      // Supabase wraps PostgreSQL errors - check for constraint violation message
      if (insertError.message.includes("This time slot is already reserved") || insertError.code === "23505") {
        return {
          data: null,
          error: new ConflictError("Sorry, this time slot is no longer available. Please select another time."),
        };
      }

      // Re-throw other database errors
      return {
        data: null,
        error: new Error("Failed to create reservation"),
      };
    }

    // Guard: Ensure reservation was created
    if (!newReservation) {
      return {
        data: null,
        error: new Error("Failed to create reservation"),
      };
    }

    // Step 3: Calculate end_time and format response as ReservationDTO
    const endTime = calculateEndTime(newReservation.start_time, newReservation.duration as string);

    const reservationDTO: ReservationDTO = {
      id: newReservation.id,
      facility_id: newReservation.facility_id,
      start_time: newReservation.start_time,
      duration: newReservation.duration as string,
      end_time: endTime,
      status: newReservation.status,
      cancellation_message: newReservation.cancellation_message,
      created_at: newReservation.created_at,
      updated_at: newReservation.updated_at,
    };

    return {
      data: reservationDTO,
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Cancel a user's own reservation
 * @param supabase - Authenticated Supabase client
 * @param reservationId - Reservation ID to cancel
 * @param userId - ID of the authenticated user making the cancellation
 * @returns void on success
 * @throws NotFoundError if reservation doesn't exist
 * @throws ForbiddenError if user is not the owner, status is not confirmed, or within 12-hour window
 */
export async function cancelUserReservation(
  supabase: SupabaseClient,
  reservationId: number,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Step 1: Fetch the reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, start_time, status")
      .eq("id", reservationId)
      .single();

    // Guard: Check if reservation exists
    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return {
          error: new NotFoundError("Reservation not found"),
        };
      }
      return {
        error: new NotFoundError("Reservation not found"),
      };
    }

    // Guard: Ensure reservation data exists
    if (!reservation) {
      return {
        error: new NotFoundError("Reservation not found"),
      };
    }

    // Guard: Verify user is the owner
    if (reservation.user_id !== userId) {
      return {
        error: new ForbiddenError("You are not authorized to perform this action"),
      };
    }

    // Guard: Check if reservation is in confirmed status
    if (reservation.status !== "confirmed") {
      return {
        error: new ForbiddenError("This reservation cannot be canceled"),
      };
    }

    // Guard: Validate 12-hour cancellation window
    const startTime = new Date(reservation.start_time);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 12) {
      return {
        error: new ForbiddenError("Reservations can only be canceled more than 12 hours before start time"),
      };
    }

    // Step 2: Delete the reservation
    const { error: deleteError } = await supabase.from("reservations").delete().eq("id", reservationId);

    // Guard: Handle deletion errors
    if (deleteError) {
      return {
        error: new Error("Failed to cancel reservation"),
      };
    }

    // Happy path: Reservation deleted successfully
    return { error: null };
  } catch (err) {
    // Catch any unexpected errors
    return {
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Retrieve a reservation for export (ICS file generation)
 * Enforces authorization: user must own the reservation or be an admin
 * @param supabase - Authenticated Supabase client
 * @param reservationId - Reservation ID to retrieve
 * @param userId - Current user ID (for authorization)
 * @returns Reservation details with facility info
 * @throws NotFoundError if reservation doesn't exist
 * @throws ForbiddenError if user lacks permission to access the reservation
 */
export async function findReservationForExport(
  supabase: SupabaseClient,
  reservationId: number,
  userId: string
): Promise<ReservationDetailDTO> {
  // Fetch reservation with facility join
  const { data: reservationData, error: queryError } = await supabase
    .from("reservations")
    .select(
      `
      id,
      start_time,
      duration,
      status,
      cancellation_message,
      created_at,
      updated_at,
      user_id,
      facilities:facility_id (
        id,
        name
      )
    `
    )
    .eq("id", reservationId)
    .single();

  // Guard: Handle not found error
  if (queryError) {
    // Supabase returns PGRST116 for "not found" with .single()
    if (queryError.code === "PGRST116") {
      throw new NotFoundError("Reservation not found");
    }
    throw new Error("Failed to fetch reservation");
  }

  // Guard: Handle missing data
  if (!reservationData) {
    throw new NotFoundError("Reservation not found");
  }

  // Check if user has admin permission to view all reservations
  const canViewAll = await hasPermission(supabase, "reservations.view_all");

  // Guard: Check authorization - user must own the reservation or be an admin
  if (!canViewAll && reservationData.user_id !== userId) {
    throw new ForbiddenError("You do not have permission to export this reservation");
  }

  // Calculate end_time by adding duration to start_time
  const endTime = calculateEndTime(reservationData.start_time, reservationData.duration as string);

  // Type assertion for facilities - Supabase returns array for joins
  const facilityData = Array.isArray(reservationData.facilities)
    ? reservationData.facilities[0]
    : reservationData.facilities;

  // Map result to ReservationDetailDTO
  const reservation: ReservationDetailDTO = {
    id: reservationData.id,
    facility: {
      id: facilityData.id,
      name: facilityData.name,
    },
    start_time: reservationData.start_time,
    duration: reservationData.duration as string,
    end_time: endTime,
    status: reservationData.status,
    cancellation_message: reservationData.cancellation_message,
    created_at: reservationData.created_at,
    updated_at: reservationData.updated_at,
  };

  return reservation;
}

/**
 * Update an existing reservation
 * @param supabase - Authenticated Supabase client
 * @param id - Reservation ID to update
 * @param command - Validated reservation update data
 * @param userId - ID of the authenticated user making the update
 * @returns Updated reservation with computed end_time
 * @throws NotFoundError if reservation doesn't exist
 * @throws ForbiddenError if user lacks permission
 * @throws ConflictError if duration update causes scheduling conflict
 */
export async function updateReservation(
  supabase: SupabaseClient,
  id: number,
  command: UpdateReservationCommand,
  userId: string
): Promise<{ data: ReservationDTO | null; error: Error | null }> {
  try {
    // Step 1: Fetch the target reservation
    const { data: existingReservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, facility_id, user_id, start_time, duration, status, cancellation_message, created_at, updated_at")
      .eq("id", id)
      .single();

    // Guard: Check if reservation exists
    if (fetchError || !existingReservation) {
      if (fetchError?.code === "PGRST116") {
        return {
          data: null,
          error: new NotFoundError("Reservation not found"),
        };
      }
      return {
        data: null,
        error: new NotFoundError("Reservation not found"),
      };
    }

    // Step 2: Check if user has admin permission
    const isAdmin = await hasPermission(supabase, "reservations.cancel");

    // Step 3: Verify authorization - user must own the reservation OR be an admin
    const isOwner = existingReservation.user_id === userId;
    if (!isOwner && !isAdmin) {
      return {
        data: null,
        error: new ForbiddenError("You do not have permission to update this reservation"),
      };
    }

    // Step 4: Determine operation type and execute appropriate logic
    const isAdminCancellation = command.status === "canceled";
    const isDurationUpdate = command.duration !== undefined;

    // Guard: Validate operation type
    if (isAdminCancellation && !isAdmin) {
      return {
        data: null,
        error: new ForbiddenError("Only administrators can cancel reservations"),
      };
    }

    // Handle admin cancellation
    if (isAdminCancellation && isAdmin) {
      // Guard: Check if already canceled
      if (existingReservation.status === "canceled") {
        return {
          data: null,
          error: new ConflictError("Reservation is already canceled"),
        };
      }

      // Update reservation status and cancellation message
      const { data: updatedReservation, error: updateError } = await supabase
        .from("reservations")
        .update({
          status: "canceled",
          cancellation_message: command.cancellation_message || null,
        })
        .eq("id", id)
        .select()
        .single();

      // Guard: Handle update errors
      if (updateError || !updatedReservation) {
        return {
          data: null,
          error: new Error("Failed to cancel reservation"),
        };
      }

      // Calculate end_time and return
      const endTime = calculateEndTime(updatedReservation.start_time, updatedReservation.duration as string);

      return {
        data: {
          id: updatedReservation.id,
          facility_id: updatedReservation.facility_id,
          start_time: updatedReservation.start_time,
          duration: updatedReservation.duration as string,
          end_time: endTime,
          status: updatedReservation.status,
          cancellation_message: updatedReservation.cancellation_message,
          created_at: updatedReservation.created_at,
          updated_at: updatedReservation.updated_at,
        },
        error: null,
      };
    }

    // Handle user duration update
    if (isDurationUpdate && isOwner) {
      // Guard: Check if reservation is canceled
      if (existingReservation.status === "canceled") {
        return {
          data: null,
          error: new ConflictError("Cannot update a canceled reservation"),
        };
      }

      // Guard: Validate 12-hour modification window
      const startTime = new Date(existingReservation.start_time);
      const now = new Date();
      const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilStart < 12) {
        return {
          data: null,
          error: new ForbiddenError("Reservations can only be modified at least 12 hours before the start time"),
        };
      }

      // Validate new end time doesn't exceed 22:00
      // Duration is guaranteed to exist at this point due to isDurationUpdate check
      const newDuration = command.duration as string;
      const newEndTime = calculateEndTime(existingReservation.start_time, newDuration);
      const endTimeDate = new Date(newEndTime);
      const limitTime = new Date(endTimeDate);
      limitTime.setUTCHours(22, 0, 0, 0);

      if (endTimeDate > limitTime) {
        return {
          data: null,
          error: new ConflictError("Reservation end time must not exceed 22:00"),
        };
      }

      // Check for scheduling conflicts with other reservations
      // Query overlapping reservations for the same facility (excluding current reservation)
      const { data: conflicts, error: conflictError } = await supabase
        .from("reservations")
        .select("id, start_time, duration")
        .eq("facility_id", existingReservation.facility_id)
        .eq("status", "confirmed")
        .neq("id", id);

      // Guard: Handle conflict check error
      if (conflictError) {
        return {
          data: null,
          error: new Error("Failed to check for scheduling conflicts"),
        };
      }

      // Check for time slot conflicts
      const startTimeMs = new Date(existingReservation.start_time).getTime();
      const newEndTimeMs = new Date(newEndTime).getTime();

      for (const conflict of conflicts || []) {
        const conflictStart = new Date(conflict.start_time).getTime();
        const conflictEnd = new Date(calculateEndTime(conflict.start_time, conflict.duration as string)).getTime();

        // Check if time ranges overlap
        if (startTimeMs < conflictEnd && newEndTimeMs > conflictStart) {
          return {
            data: null,
            error: new ConflictError(
              "The updated duration would conflict with another reservation. Please choose a shorter duration."
            ),
          };
        }
      }

      // Update reservation duration
      const { data: updatedReservation, error: updateError } = await supabase
        .from("reservations")
        .update({
          duration: command.duration,
        })
        .eq("id", id)
        .select()
        .single();

      // Guard: Handle update errors
      if (updateError || !updatedReservation) {
        return {
          data: null,
          error: new Error("Failed to update reservation"),
        };
      }

      // Calculate end_time and return
      const endTime = calculateEndTime(updatedReservation.start_time, updatedReservation.duration as string);

      return {
        data: {
          id: updatedReservation.id,
          facility_id: updatedReservation.facility_id,
          start_time: updatedReservation.start_time,
          duration: updatedReservation.duration as string,
          end_time: endTime,
          status: updatedReservation.status,
          cancellation_message: updatedReservation.cancellation_message,
          created_at: updatedReservation.created_at,
          updated_at: updatedReservation.updated_at,
        },
        error: null,
      };
    }

    // Guard: Invalid operation
    return {
      data: null,
      error: new Error("Invalid update operation"),
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}
