/**
 * Unit tests for useMyReservations hook
 *
 * Tests cover:
 * - Data fetching for all reservation categories
 * - ViewModel transformation
 * - 12-hour rule enforcement
 * - Update duration functionality
 * - Cancel reservation functionality
 * - Export to ICS functionality
 * - Error handling
 * - Refetch mechanism
 *
 * Test scenarios from test-plan.md:
 * - US-006: View My Reservations
 * - US-007: Edit a Reservation
 * - US-008: Cancel a Reservation
 * - US-009: Export Reservation to ICS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useMyReservations } from "../../../../components/hooks/useMyReservations";
import type { ReservationDetailDTO } from "../../../../types";

// Helper to mock window.location for testing
const mockWindowLocation = (href = "") => {
  Object.defineProperty(window, "location", {
    value: { href },
    writable: true,
  });
};

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useMyReservations", () => {
  const upcomingReservationDTO: ReservationDetailDTO = {
    id: 1,
    facility: { id: 1, name: "Basketball Court" },
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    duration: "01:00:00",
    status: "confirmed",
    cancellation_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const pastReservationDTO: ReservationDetailDTO = {
    id: 2,
    facility: { id: 2, name: "Tennis Court" },
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    duration: "01:00:00",
    status: "confirmed",
    cancellation_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const canceledReservationDTO: ReservationDetailDTO = {
    id: 3,
    facility: { id: 3, name: "Soccer Field" },
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    duration: "01:00:00",
    status: "canceled",
    cancellation_message: "Maintenance required",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Data Fetching", () => {
    it("should start with loading state", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally empty - promise never resolves to test loading state
          })
      ); // Never resolves

      const { result } = renderHook(() => useMyReservations());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.upcomingReservations).toEqual([]);
      expect(result.current.pastReservations).toEqual([]);
      expect(result.current.canceledReservations).toEqual([]);
    });

    it("should fetch all three reservation categories in parallel", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/reservations?status=confirmed&upcoming=true");
        expect(mockFetch).toHaveBeenCalledWith("/api/reservations?status=confirmed&upcoming=false");
        expect(mockFetch).toHaveBeenCalledWith("/api/reservations?status=canceled");
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    it("should populate upcoming reservations", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [upcomingReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.upcomingReservations).toHaveLength(1);
        expect(result.current.upcomingReservations[0].facilityName).toBe("Basketball Court");
      });
    });

    it("should populate past reservations", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=false")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [pastReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.pastReservations).toHaveLength(1);
        expect(result.current.pastReservations[0].facilityName).toBe("Tennis Court");
      });
    });

    it("should populate canceled reservations", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("status=canceled")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [canceledReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.canceledReservations).toHaveLength(1);
        expect(result.current.canceledReservations[0].facilityName).toBe("Soccer Field");
      });
    });

    it("should set loading to false after successful fetch", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle fetch error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe("Network error");
      });
    });

    it("should handle non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe("Failed to fetch reservations");
      });
    });
  });

  describe("ViewModel Transformation", () => {
    it("should transform DTO to ViewModel with formatted dates", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [upcomingReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.upcomingReservations[0]).toMatchObject({
          id: 1,
          facilityName: "Basketball Court",
          status: "Confirmed",
        });
      });
    });

    it("should format times in HH:mm format", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [upcomingReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        const reservation = result.current.upcomingReservations[0];
        expect(reservation.startTime).toMatch(/^\d{2}:\d{2}$/);
        expect(reservation.endTime).toMatch(/^\d{2}:\d{2}$/);
      });
    });

    it("should include original start time and duration", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [upcomingReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        const reservation = result.current.upcomingReservations[0];
        expect(reservation.originalStartTime).toBeInstanceOf(Date);
        expect(reservation.originalDuration).toBe("01:00:00");
      });
    });

    it("should include cancellation message for canceled reservations", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("status=canceled")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [canceledReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.canceledReservations[0].cancellationMessage).toBe("Maintenance required");
      });
    });
  });

  describe("12-Hour Rule Enforcement", () => {
    it("should mark reservation as editable if more than 12 hours away", async () => {
      const farFutureReservation: ReservationDetailDTO = {
        ...upcomingReservationDTO,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [farFutureReservation] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.upcomingReservations[0].isEditable).toBe(true);
        expect(result.current.upcomingReservations[0].isCancelable).toBe(true);
      });
    });

    it("should mark reservation as not editable if less than 12 hours away", async () => {
      const soonReservation: ReservationDetailDTO = {
        ...upcomingReservationDTO,
        start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      };

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [soonReservation] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.upcomingReservations[0].isEditable).toBe(false);
        expect(result.current.upcomingReservations[0].isCancelable).toBe(false);
      });
    });

    it("should mark canceled reservations as not editable", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("status=canceled")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [canceledReservationDTO] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.canceledReservations[0].isEditable).toBe(false);
        expect(result.current.canceledReservations[0].isCancelable).toBe(false);
      });
    });
  });

  describe("Update Duration - US-007", () => {
    it("should send PATCH request with new duration", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateDuration(1, "02:00:00");
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/reservations/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration: "02:00:00" }),
        })
      );
    });

    it("should refetch reservations after successful update", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockFetch.mock.calls.length;

      await act(async () => {
        await result.current.updateDuration(1, "02:00:00");
      });

      await waitFor(() => {
        // Should have made 3 more calls (one for each reservation type)
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it("should throw error on 403 response", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateDuration(1, "02:00:00")).rejects.toThrow(
        /reservations can only be changed more than 12 hours in advance/i
      );
    });

    it("should throw error on 404 response", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateDuration(1, "02:00:00")).rejects.toThrow(/could not be found/i);
    });

    it("should throw error on 409 response", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateDuration(1, "02:00:00")).rejects.toThrow(/conflicts with another booking/i);
    });

    it("should throw generic error for other failures", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateDuration(1, "02:00:00")).rejects.toThrow(/unexpected error/i);
    });
  });

  describe("Cancel Reservation - US-008", () => {
    it("should send DELETE request", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.cancel(1);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/reservations/1", expect.objectContaining({ method: "DELETE" }));
    });

    it("should refetch reservations after successful cancellation", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockFetch.mock.calls.length;

      await act(async () => {
        await result.current.cancel(1);
      });

      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it("should throw error on 403 response", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.cancel(1)).rejects.toThrow(
        /reservations can only be canceled more than 12 hours in advance/i
      );
    });

    it("should throw error on 404 response", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.cancel(1)).rejects.toThrow(/could not be found/i);
    });

    it("should throw generic error for other failures", async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.cancel(1)).rejects.toThrow(/unexpected error/i);
    });
  });

  describe("Export to ICS - US-009", () => {
    it("should navigate to export endpoint", async () => {
      // Mock window.location.href
      mockWindowLocation("");

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.exportToIcs(1);

      expect(window.location.href).toBe("/api/reservations/1/export.ics");
    });

    it("should export different reservation IDs", async () => {
      mockWindowLocation("");

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.exportToIcs(123);

      expect(window.location.href).toBe("/api/reservations/123/export.ics");
    });
  });

  describe("Manual Refetch", () => {
    it("should refetch all reservations when refetch is called", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockFetch.mock.calls.length;

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it("should set loading state during refetch", async () => {
      // Start with a promise that never resolves to test loading state
      const initialPromise = new Promise<Response>(() => {
        // Never resolve to keep initial loading state
      });

      mockFetch.mockImplementation(() => initialPromise);

      const { result } = renderHook(() => useMyReservations());

      // Initial load should be in loading state
      expect(result.current.isLoading).toBe(true);

      // Now change mock to resolve for the refetch test
      const refetchPromise = new Promise<Response>(() => {
        // Never resolve to keep refetch loading state
      });

      mockFetch.mockImplementation(() => refetchPromise);

      await act(async () => {
        result.current.refetch();
      });

      // Loading state should remain true during refetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });
  });

  describe("Error Recovery", () => {
    it("should clear error on successful refetch", async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });

      // Second call succeeds
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should handle partial response errors", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reservations: [] }),
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.upcomingReservations).toEqual([]);
        expect(result.current.pastReservations).toEqual([]);
        expect(result.current.canceledReservations).toEqual([]);
      });
    });

    it("should handle multiple reservations in each category", async () => {
      const multipleReservations = [upcomingReservationDTO, { ...upcomingReservationDTO, id: 999 }];

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("upcoming=true")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: multipleReservations }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        });
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.upcomingReservations).toHaveLength(2);
      });
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const { result } = renderHook(() => useMyReservations());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });
});
