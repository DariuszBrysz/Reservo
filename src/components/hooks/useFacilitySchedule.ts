/**
 * Custom hook for managing facility schedule state and interactions
 *
 * This hook encapsulates all logic for fetching schedule data, managing user interactions,
 * and handling booking/cancellation flows for the facility schedule view.
 */

import { useState, useEffect, useCallback } from "react";
import type { FacilityScheduleDTO, CreateReservationCommand, UpdateReservationCommand, AppRole } from "../../types";
import type { FacilityScheduleViewModel, TimeSlotViewModel } from "../views/viewModels";

interface BookingState {
  isOpen: boolean;
  startTime: Date | null;
}

interface CancelState {
  isOpen: boolean;
  reservationId: number | null;
}

interface UseFacilityScheduleReturn {
  // Data state
  schedule: FacilityScheduleViewModel | null;
  isLoading: boolean;
  error: Error | null;
  userRole: AppRole;

  // Date selection
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Booking dialog state
  bookingState: BookingState;
  openBookingDialog: (startTime: Date) => void;

  // Cancel dialog state
  cancelState: CancelState;
  openCancelDialog: (reservationId: number) => void;

  // Actions
  createReservation: (command: CreateReservationCommand) => Promise<void>;
  cancelReservation: (command: UpdateReservationCommand) => Promise<void>;
  closeDialogs: () => void;
}

/**
 * Transforms FacilityScheduleDTO into FacilityScheduleViewModel
 * Generates a complete timeline of 15-minute time slots from 14:00 to 22:00
 */
function transformScheduleData(dto: FacilityScheduleDTO, selectedDate: Date): FacilityScheduleViewModel {
  const timeSlots: TimeSlotViewModel[] = [];

  // Operating hours: 14:00 - 22:00 (8 hours = 32 slots of 15 minutes)
  const startHour = 14;
  const endHour = 22;
  const slotDurationMinutes = 15;

  // Create base date for the selected day at midnight
  const baseDate = new Date(selectedDate);
  baseDate.setUTCHours(0, 0, 0, 0);

  // Generate all time slots for the day
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
      const slotStart = new Date(baseDate);
      slotStart.setUTCHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + slotDurationMinutes);

      // Check if this slot is part of any reservation
      const reservation = dto.reservations.find((res) => {
        const resStart = new Date(res.start_time);
        const resEnd = new Date(res.end_time);

        // A slot is booked if it falls within a reservation's time range
        return slotStart >= resStart && slotStart < resEnd;
      });

      timeSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        status: reservation ? "booked" : "available",
        reservation: reservation || undefined,
      });
    }
  }

  return {
    facility: dto.facility,
    date: dto.date,
    timeSlots,
  };
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
function formatDateToISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Main hook for facility schedule management
 */
export function useFacilitySchedule(facilityId: number): UseFacilityScheduleReturn {
  // Core state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  });

  const [schedule, setSchedule] = useState<FacilityScheduleViewModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userRole, setUserRole] = useState<AppRole>("user");

  // Dialog states
  const [bookingState, setBookingState] = useState<BookingState>({
    isOpen: false,
    startTime: null,
  });

  const [cancelState, setCancelState] = useState<CancelState>({
    isOpen: false,
    reservationId: null,
  });

  /**
   * Fetches the schedule for the current facility and selected date
   */
  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateStr = formatDateToISO(selectedDate);
      const response = await fetch(`/api/facilities/${facilityId}/schedule?date=${dateStr}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.statusText}`);
      }

      const data: FacilityScheduleDTO = await response.json();
      const viewModel = transformScheduleData(data, selectedDate);
      setSchedule(viewModel);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, selectedDate]);

  /**
   * Fetches the current user's role
   * TODO: Replace with actual authentication check
   */
  const fetchUserRole = useCallback(async () => {
    try {
      // Placeholder: In a real implementation, this would fetch from auth state
      // For now, defaulting to 'user'
      setUserRole("user");
    } catch {
      setUserRole("user");
    }
  }, []);

  // Fetch schedule when component mounts or dependencies change
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Fetch user role on mount
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  /**
   * Opens the booking dialog with the specified start time
   */
  const openBookingDialog = useCallback((startTime: Date) => {
    setBookingState({
      isOpen: true,
      startTime,
    });
  }, []);

  /**
   * Opens the cancellation dialog for the specified reservation
   */
  const openCancelDialog = useCallback((reservationId: number) => {
    setCancelState({
      isOpen: true,
      reservationId,
    });
  }, []);

  /**
   * Closes all dialogs
   */
  const closeDialogs = useCallback(() => {
    setBookingState({ isOpen: false, startTime: null });
    setCancelState({ isOpen: false, reservationId: null });
  }, []);

  /**
   * Creates a new reservation
   */
  const createReservation = useCallback(
    async (command: CreateReservationCommand) => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("CONFLICT");
        }
        throw new Error(`Failed to create reservation: ${response.statusText}`);
      }

      // Success: close dialog and refresh schedule
      closeDialogs();
      await fetchSchedule();
    },
    [closeDialogs, fetchSchedule]
  );

  /**
   * Cancels an existing reservation (admin only)
   */
  const cancelReservation = useCallback(
    async (command: UpdateReservationCommand) => {
      if (!cancelState.reservationId) {
        throw new Error("No reservation ID specified");
      }

      const response = await fetch(`/api/reservations/${cancelState.reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel reservation: ${response.statusText}`);
      }

      // Success: close dialog and refresh schedule
      closeDialogs();
      await fetchSchedule();
    },
    [cancelState.reservationId, closeDialogs, fetchSchedule]
  );

  return {
    schedule,
    isLoading,
    error,
    userRole,
    selectedDate,
    setSelectedDate,
    bookingState,
    openBookingDialog,
    cancelState,
    openCancelDialog,
    createReservation,
    cancelReservation,
    closeDialogs,
  };
}
