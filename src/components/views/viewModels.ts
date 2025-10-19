/**
 * View Models for UI components
 *
 * These types represent the simplified data structures used by UI components,
 * separated from the API DTOs to promote loose coupling between the API and view layers.
 */

import type { FacilityInfo, ScheduleReservationDTO } from "../../types";

/**
 * ViewModel for displaying a facility in the list view
 * Contains only the essential data needed for rendering
 */
export interface FacilityViewModel {
  id: number;
  name: string;
}

/**
 * Possible states of a time slot in the schedule UI
 */
export type TimeSlotStatus = "available" | "booked";

/**
 * ViewModel for a single 15-minute time slot in the schedule
 * Combines API data with UI state for rendering
 */
export interface TimeSlotViewModel {
  startTime: Date;
  endTime: Date;
  status: TimeSlotStatus;
  reservation?: ScheduleReservationDTO;
}

/**
 * Top-level ViewModel for the facility schedule view
 * Aggregates all data needed to render the entire schedule
 */
export interface FacilityScheduleViewModel {
  facility: FacilityInfo;
  date: string; // YYYY-MM-DD format
  timeSlots: TimeSlotViewModel[];
}

/**
 * ViewModel for displaying a reservation in the My Reservations view
 * Transforms API data into display-friendly format with UI logic flags
 */
export interface ReservationViewModel {
  // Display-ready fields
  id: number;
  facilityName: string;
  date: string; // Formatted as "Month Day, Year"
  startTime: string; // Formatted as "HH:mm"
  endTime: string; // Formatted as "HH:mm"
  status: "Confirmed" | "Canceled"; // Capitalized for display
  cancellationMessage: string | null;

  // UI logic flags
  isEditable: boolean; // True if start_time is >12 hours from now
  isCancelable: boolean; // True if start_time is >12 hours from now

  // Original data for actions
  originalStartTime: Date; // Date object for calculations
  originalDuration: string; // ISO 8601 duration
}
