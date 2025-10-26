import type { SupabaseClient } from "../../db/supabase.client";
import type { FacilityDTO, FacilityScheduleDTO, ScheduleReservationDTO } from "../../types";

/**
 * Retrieve all facilities ordered by name
 * @param supabase - Authenticated Supabase client
 * @returns Array of facilities or null on error
 */
export async function getAllFacilities(
  supabase: SupabaseClient
): Promise<{ data: FacilityDTO[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from("facilities").select();

    if (error) {
      return { data: null, error: new Error("Database query failed") };
    }

    return { data: data as FacilityDTO[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Retrieve a specific facility by ID
 * @param supabase - Authenticated Supabase client
 * @param id - Facility ID to retrieve
 * @returns Single facility or null if not found
 */
export async function getFacilityById(
  supabase: SupabaseClient,
  id: number
): Promise<{ data: FacilityDTO | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from("facilities").select().eq("id", id).single();

    if (error) {
      // Supabase returns error for "not found" with .single()
      // Check if it's a "not found" error (PGRST116)
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      return { data: null, error: new Error("Database query failed") };
    }

    return { data: data as FacilityDTO, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Retrieve facility schedule for a specific date
 * @param supabase - Authenticated Supabase client
 * @param facilityId - Facility ID to retrieve schedule for
 * @param date - Date in YYYY-MM-DD format
 * @returns Facility info and list of confirmed reservations with user data
 */
export async function getFacilitySchedule(
  supabase: SupabaseClient,
  facilityId: number,
  date: string
): Promise<{ data: FacilityScheduleDTO | null; error: Error | null }> {
  try {
    const { data: facility, error: facilityError } = await getFacilityById(supabase, facilityId);

    // Guard: Check if facility exists
    if (facility == null || facilityError) {
      return { data: null, error: facilityError };
    }

    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    // Fetch reservations for the given date
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select(
        `
        id,
        start_time,
        duration,
        status,
        user_id
      `
      )
      .eq("facility_id", facilityId)
      .eq("status", "confirmed")
      .gte("start_time", startOfDay)
      .lte("start_time", endOfDay)
      .order("start_time", { ascending: true });

    // Guard: Handle reservations query errors
    if (reservationsError) {
      return { data: null, error: new Error("Failed to fetch reservations") };
    }

    const reservationsWithEndTime: ScheduleReservationDTO[] = await Promise.all(
      (reservationsData || []).map(async (reservation) => {
        // Calculate end_time by parsing duration and adding to start_time
        const endTime = calculateEndTime(reservation.start_time, reservation.duration as string);

        return {
          id: reservation.id,
          start_time: reservation.start_time,
          duration: reservation.duration as string,
          end_time: endTime,
          status: reservation.status,
        };
      })
    );

    return {
      data: {
        facility: {
          id: facility.id,
          name: facility.name,
        },
        date: date,
        reservations: reservationsWithEndTime,
      },
      error: null,
    };
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
