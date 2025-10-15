/**
 * Data Transfer Objects (DTOs) and Command Models for Reservo API
 *
 * These types represent the data structures used in API requests and responses.
 * All DTOs are derived from database entity definitions in database.types.ts.
 */

import type { Tables, Enums } from "./db/database.types";

// =============================================================================
// Base Entity Types
// =============================================================================

/**
 * Base facility entity from database
 */
export type Facility = Tables<"facilities">;

/**
 * Base reservation entity from database
 * Note: duration is stored as PostgreSQL interval, represented as string in API
 */
export type Reservation = Pick<
  Tables<"reservations">,
  "cancellation_message" | "created_at" | "facility_id" | "id" | "start_time" | "status" | "updated_at"
> & {
  duration: string;
};

/**
 * Reservation status enum
 */
export type ReservationStatus = Enums<"reservation_status">;

/**
 * User role enum
 */
export type AppRole = Enums<"app_role">;

/**
 * Permission enum
 */
export type AppPermission = Enums<"app_permission">;

// =============================================================================
// Facility DTOs
// =============================================================================

/**
 * DTO for a single facility
 * Used in: GET /api/facilities/{id}
 */
export type FacilityDTO = Facility;

/**
 * DTO for facility list response
 * Used in: GET /api/facilities
 */
export interface FacilityListDTO {
  facilities: FacilityDTO[];
}

/**
 * Minimal facility info for nested objects
 */
export interface FacilityInfo {
  id: number;
  name: string;
}

/**
 * User info for schedule view
 */
export interface UserInfo {
  email: string;
}

/**
 * Reservation info in schedule view
 * Includes computed end_time and conditional user info
 */
export interface ScheduleReservationDTO {
  id: number;
  start_time: string;
  duration: string;
  end_time: string; // Computed: start_time + duration
  status: ReservationStatus;
  user?: UserInfo; // Only included for own reservations (users) or all reservations (admins)
}

/**
 * DTO for facility schedule response
 * Used in: GET /api/facilities/{id}/schedule
 */
export interface FacilityScheduleDTO {
  facility: FacilityInfo;
  date: string; // YYYY-MM-DD format
  reservations: ScheduleReservationDTO[];
}

// =============================================================================
// Reservation DTOs
// =============================================================================

/**
 * Full reservation DTO with computed end_time
 * Used in: POST /api/reservations, GET /api/reservations/{id} (when no facility join)
 */
export interface ReservationDTO extends Reservation {
  end_time: string; // Computed: start_time + duration
}

/**
 * Reservation DTO with facility information
 * Used in: GET /api/reservations, GET /api/reservations/{id}
 */
export interface ReservationDetailDTO
  extends Pick<
    ReservationDTO,
    "cancellation_message" | "created_at" | "duration" | "end_time" | "id" | "start_time" | "status" | "updated_at"
  > {
  facility: FacilityInfo;
}

/**
 * Pagination metadata
 */
export interface PaginationDTO {
  limit: number;
  offset: number;
  total: number;
}

/**
 * DTO for reservation list response
 * Used in: GET /api/reservations
 */
export interface ReservationListDTO {
  reservations: ReservationDetailDTO[];
  pagination: PaginationDTO;
}

// =============================================================================
// Command Models (Request Payloads)
// =============================================================================

/**
 * Command to create a new reservation
 * Used in: POST /api/reservations
 *
 * Validation rules (enforced at API and database level):
 * - facility_id: Must reference existing facility
 * - start_time: ISO 8601 datetime, future date, within 7 days, 14:00-22:00, 15-min intervals
 * - duration: ISO 8601 duration, 30min-3hrs, 15-min increments
 */
export interface CreateReservationCommand {
  facility_id: number;
  start_time: string; // ISO 8601 datetime
  duration: string; // ISO 8601 duration format (e.g., "01:30:00")
}

/**
 * Command to update a reservation
 * Used in: PATCH /api/reservations/{id}
 *
 * For regular users:
 * - Can only update duration
 * - Must be >12 hours before start time
 *
 * For admin users:
 * - Can update status to "canceled"
 * - Can provide cancellation_message
 * - No time restrictions
 */
export interface UpdateReservationCommand {
  duration?: string; // For users: new duration following same rules as creation
  status?: "canceled"; // For admins: can only set to "canceled"
  cancellation_message?: string; // For admins: optional message (max 500 chars)
}

// =============================================================================
// Query Parameters Types
// =============================================================================

/**
 * Query parameters for GET /api/reservations
 */
export interface GetReservationsQuery {
  all?: boolean; // Admin only - retrieve all reservations
  status?: ReservationStatus; // Filter by status
  upcoming?: boolean; // Filter for upcoming reservations (default: true)
  facility_id?: number; // Filter by facility ID
  limit?: number; // Results per page (default: 50, max: 100)
  offset?: number; // Pagination offset (default: 0)
}

/**
 * Query parameters for GET /api/facilities/{id}/schedule
 */
export interface GetFacilityScheduleQuery {
  date: string; // Required: Date in ISO 8601 format (YYYY-MM-DD)
}

// =============================================================================
// Error Response Types
// =============================================================================

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string; // Error type (e.g., "Bad Request", "Unauthorized")
  message: string; // Human-readable error message
}

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/**
 * Type guard to check if a value is a valid reservation status
 */
export function isReservationStatus(value: unknown): value is ReservationStatus {
  return value === "confirmed" || value === "canceled";
}

/**
 * Type guard to check if a value is a valid app role
 */
export function isAppRole(value: unknown): value is AppRole {
  return value === "user" || value === "admin";
}
