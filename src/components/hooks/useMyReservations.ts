/**
 * useMyReservations Hook
 *
 * Custom hook for managing reservations in the My Reservations view.
 * Handles fetching, transforming, and mutating reservation data.
 */

import { useState, useEffect, useCallback } from "react";
import type { ReservationDetailDTO, UpdateReservationCommand } from "../../types";
import type { ReservationViewModel } from "../views/viewModels";

interface UseMyReservationsResult {
  upcomingReservations: ReservationViewModel[];
  pastReservations: ReservationViewModel[];
  canceledReservations: ReservationViewModel[];
  isLoading: boolean;
  error: string | null;
  updateDuration: (reservationId: number, newDuration: string) => Promise<void>;
  cancel: (reservationId: number) => Promise<void>;
  exportToIcs: (reservationId: number) => void;
  refetch: () => void;
}

/**
 * Transform ReservationDetailDTO to ReservationViewModel
 * Includes calculation of UI flags based on the 12-hour rule
 */
function transformToViewModel(dto: ReservationDetailDTO): ReservationViewModel {
  const startTime = new Date(dto.start_time);
  const endTime = new Date(dto.end_time);
  const now = new Date();
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 12-hour rule: Can only edit/cancel if more than 12 hours before start
  const isEditable = dto.status === "confirmed" && hoursUntilStart > 12;
  const isCancelable = dto.status === "confirmed" && hoursUntilStart > 12;

  return {
    id: dto.id,
    facilityName: dto.facility.name,
    date: startTime.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    startTime: startTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    endTime: endTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    status: dto.status === "confirmed" ? "Confirmed" : "Canceled",
    cancellationMessage: dto.cancellation_message,
    isEditable,
    isCancelable,
    originalStartTime: startTime,
    originalDuration: dto.duration,
  };
}

export function useMyReservations(): UseMyReservationsResult {
  const [upcomingReservations, setUpcomingReservations] = useState<ReservationViewModel[]>([]);
  const [pastReservations, setPastReservations] = useState<ReservationViewModel[]>([]);
  const [canceledReservations, setCanceledReservations] = useState<ReservationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch reservations for all three categories
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch reservations in parallel (all confirmed + canceled)
        const [allConfirmedResponse, canceledResponse] = await Promise.all([
          fetch("/api/reservations?status=confirmed"),
          fetch("/api/reservations?status=canceled"),
        ]);

        // Check for errors
        if (!allConfirmedResponse.ok || !canceledResponse.ok) {
          throw new Error("Failed to fetch reservations");
        }

        // Parse responses
        const allConfirmedData = await allConfirmedResponse.json();
        const canceledData = await canceledResponse.json();

        // Split confirmed reservations into upcoming and past based on current time
        const now = new Date();
        const upcomingReservationsData = allConfirmedData.reservations.filter((reservation: ReservationDetailDTO) => {
          return new Date(reservation.start_time) >= now;
        });
        const pastReservationsData = allConfirmedData.reservations.filter((reservation: ReservationDetailDTO) => {
          return new Date(reservation.start_time) < now;
        });

        // Transform to ViewModels
        setUpcomingReservations(upcomingReservationsData.map(transformToViewModel));
        setPastReservations(pastReservationsData.map(transformToViewModel));
        setCanceledReservations(canceledData.reservations.map(transformToViewModel));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [refetchTrigger]);

  // Update reservation duration
  const updateDuration = useCallback(async (reservationId: number, newDuration: string) => {
    const command: UpdateReservationCommand = {
      duration: newDuration,
    };

    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (response.status === 403) {
        throw new Error("Action forbidden. Reservations can only be changed more than 12 hours in advance.");
      } else if (response.status === 404) {
        throw new Error("This reservation could not be found. It may have been canceled by an administrator.");
      } else if (response.status === 409) {
        throw new Error("The new duration conflicts with another booking. Please select a different time.");
      } else {
        throw new Error(errorData?.message || "An unexpected error occurred. Please try again.");
      }
    }

    // Refetch all reservations after successful update
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Cancel reservation
  const cancel = useCallback(async (reservationId: number) => {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (response.status === 403) {
        throw new Error("Action forbidden. Reservations can only be canceled more than 12 hours in advance.");
      } else if (response.status === 404) {
        throw new Error("This reservation could not be found. It may have been canceled by an administrator.");
      } else {
        throw new Error(errorData?.message || "An unexpected error occurred. Please try again.");
      }
    }

    // Refetch all reservations after successful cancellation
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Export reservation to .ics file
  const exportToIcs = useCallback((reservationId: number) => {
    window.location.href = `/api/reservations/${reservationId}/export.ics`;
  }, []);

  // Manual refetch trigger
  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  return {
    upcomingReservations,
    pastReservations,
    canceledReservations,
    isLoading,
    error,
    updateDuration,
    cancel,
    exportToIcs,
    refetch,
  };
}
