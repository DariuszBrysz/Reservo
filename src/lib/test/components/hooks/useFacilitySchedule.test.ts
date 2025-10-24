/**
 * Unit tests for useFacilitySchedule hook
 *
 * Tests cover:
 * - Initial state and data fetching
 * - Date selection and schedule refresh
 * - Booking dialog state management
 * - Cancel dialog state management
 * - Creating reservations (success and conflict)
 * - Canceling reservations
 * - Error handling
 * - Schedule data transformation (DTO to ViewModel)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act, type RenderHookResult } from "@testing-library/react";
import { useFacilitySchedule } from "../../../../components/hooks/useFacilitySchedule";
import type { FacilityScheduleDTO } from "@/types";

// Fetch mock for consistent testing
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useFacilitySchedule", () => {
  const facilityId = 1;
  const mockScheduleData: FacilityScheduleDTO = {
    facility: { id: 1, name: "Test Facility" },
    date: "2024-10-23",
    reservations: [
      {
        id: 1,
        start_time: "2024-10-23T14:00:00Z",
        duration: "01:00:00",
        end_time: "2024-10-23T15:00:00Z",
        status: "confirmed",
        user: { email: "user@example.com" },
      },
    ],
  };

  // Helper functions for common test patterns
  const setupSuccessfulScheduleFetch = () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockScheduleData,
    });
  };

  const waitForScheduleLoad = async (
    result: RenderHookResult<ReturnType<typeof useFacilitySchedule>, never>["result"]
  ) => {
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  };

  const createTestReservationCommand = (overrides = {}) => ({
    facility_id: facilityId,
    start_time: "2024-10-23T16:00:00Z",
    duration: "01:00:00",
    ...overrides,
  });

  const createTestCancelCommand = (overrides = {}) => ({
    status: "canceled" as const,
    cancellation_message: "Test cancellation",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Setup fake timers for consistent date/time testing
    vi.useFakeTimers({
      shouldAdvanceTime: true,
    });
    vi.setSystemTime(new Date("2024-10-23T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial State", () => {
    it("should start with loading state", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally empty - promise never resolves to test loading state
          })
      );

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.schedule).toBeNull();
      expect(result.current.error).toBeNull();

      // Type assertions
      expect(typeof result.current.isLoading).toBe("boolean");
      expect(result.current.schedule).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.selectedDate).toBeInstanceOf(Date);
      expect(typeof result.current.userRole).toBe("string");
    });

    it("should initialize with today as selected date", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally empty - promise never resolves to test loading state
          })
      );

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      const today = new Date("2024-10-23T10:00:00Z");
      today.setHours(0, 0, 0, 0);

      expect(result.current.selectedDate).toEqual(today);
    });

    it("should initialize with closed dialogs", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally empty - promise never resolves to test loading state
          })
      );

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      expect(result.current.bookingState.isOpen).toBe(false);
      expect(result.current.bookingState.startTime).toBeNull();
      expect(result.current.cancelState.isOpen).toBe(false);
      expect(result.current.cancelState.reservationId).toBeNull();
    });

    it("should initialize with user role", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally empty - promise never resolves to test loading state
          })
      );

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      expect(result.current.userRole).toBe("user");
    });
  });

  describe("Schedule Fetching", () => {
    it("should fetch schedule on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/facilities/${facilityId}/schedule?date=2024-10-23`);
      });
    });

    it("should transform schedule data correctly", async () => {
      setupSuccessfulScheduleFetch();

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitForScheduleLoad(result);

      expect(result.current.schedule?.facility).toEqual({
        id: 1,
        name: "Test Facility",
      });
      expect(result.current.schedule?.date).toBe("2024-10-23");
      expect(result.current.schedule?.timeSlots).toBeDefined();

      // Type assertions for loaded schedule
      expect(typeof result.current.schedule?.facility.id).toBe("number");
      expect(typeof result.current.schedule?.facility.name).toBe("string");
      expect(typeof result.current.schedule?.date).toBe("string");
      expect(Array.isArray(result.current.schedule?.timeSlots)).toBe(true);
      expect(result.current.schedule?.timeSlots[0]?.startTime).toBeInstanceOf(Date);
    });

    it("should generate 32 time slots for 14:00-22:00 period", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockScheduleData,
          reservations: [],
        }),
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.schedule?.timeSlots).toHaveLength(32);
      });

      // 8 hours * 4 slots per hour = 32 slots
      const timeSlots = result.current.schedule?.timeSlots || [];
      expect(timeSlots[0].startTime.getHours()).toBe(14);
      expect(timeSlots[31].startTime.getHours()).toBe(21);
      expect(timeSlots[31].startTime.getMinutes()).toBe(45);
    });

    it("should mark slots as booked when they overlap with reservations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.schedule).toBeDefined();
      });

      const timeSlots = result.current.schedule?.timeSlots || [];

      // Find slots that should be booked (14:00-15:00)
      const bookedSlots = timeSlots.filter((slot) => slot.status === "booked");
      expect(bookedSlots.length).toBeGreaterThan(0);

      // Verify that booked slots have reservation data
      bookedSlots.forEach((slot) => {
        expect(slot.reservation).toBeDefined();
        expect(slot.reservation?.id).toBe(1);
      });
    });

    it("should handle empty reservations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockScheduleData,
          reservations: [],
        }),
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.schedule).toBeDefined();
      });

      const timeSlots = result.current.schedule?.timeSlots || [];
      const allAvailable = timeSlots.every((slot) => slot.status === "available");
      expect(allAvailable).toBe(true);
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain("Failed to fetch schedule");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe("Network error");
    });

    it("should handle non-Error exceptions", async () => {
      mockFetch.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.error?.message).toBe("Unknown error");
      });
    });
  });

  describe("Date Selection", () => {
    it("should refetch schedule when date changes", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockScheduleData,
            date: "2024-10-24",
          }),
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change date
      const newDate = new Date("2024-10-24");
      newDate.setHours(0, 0, 0, 0);

      act(() => {
        result.current.setSelectedDate(newDate);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/facilities/${facilityId}/schedule?date=2024-10-24`);
      });
    });

    it("should update selected date state", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newDate = new Date("2024-10-25");
      newDate.setHours(0, 0, 0, 0);

      act(() => {
        result.current.setSelectedDate(newDate);
      });

      expect(result.current.selectedDate).toEqual(newDate);
    });
  });

  describe("Booking Dialog Management", () => {
    it("should open booking dialog with start time", async () => {
      setupSuccessfulScheduleFetch();

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitForScheduleLoad(result);

      const startTime = new Date("2024-10-23T15:00:00Z");

      act(() => {
        result.current.openBookingDialog(startTime);
      });

      expect(result.current.bookingState.isOpen).toBe(true);
      expect(result.current.bookingState.startTime).toEqual(startTime);
    });

    it("should close booking dialog", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open dialog first
      act(() => {
        result.current.openBookingDialog(new Date());
      });

      expect(result.current.bookingState.isOpen).toBe(true);

      // Close dialog
      act(() => {
        result.current.closeDialogs();
      });

      expect(result.current.bookingState.isOpen).toBe(false);
      expect(result.current.bookingState.startTime).toBeNull();
    });
  });

  describe("Cancel Dialog Management", () => {
    it("should open cancel dialog with reservation ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.openCancelDialog(42);
      });

      expect(result.current.cancelState.isOpen).toBe(true);
      expect(result.current.cancelState.reservationId).toBe(42);
    });

    it("should close cancel dialog", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open dialog first
      act(() => {
        result.current.openCancelDialog(42);
      });

      expect(result.current.cancelState.isOpen).toBe(true);

      // Close dialog
      act(() => {
        result.current.closeDialogs();
      });

      expect(result.current.cancelState.isOpen).toBe(false);
      expect(result.current.cancelState.reservationId).toBeNull();
    });

    it("should close both dialogs simultaneously", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open both dialogs
      act(() => {
        result.current.openBookingDialog(new Date());
        result.current.openCancelDialog(42);
      });

      // Close all dialogs
      act(() => {
        result.current.closeDialogs();
      });

      expect(result.current.bookingState.isOpen).toBe(false);
      expect(result.current.cancelState.isOpen).toBe(false);
    });
  });

  describe("Creating Reservations", () => {
    it("should create reservation successfully", async () => {
      setupSuccessfulScheduleFetch();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitForScheduleLoad(result);

      const command = createTestReservationCommand();

      await act(async () => {
        await result.current.createReservation(command);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/reservations",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(JSON.parse(mockFetch.mock.calls[1][1].body as string)).toMatchInlineSnapshot(`
        {
          "duration": "01:00:00",
          "facility_id": 1,
          "start_time": "2024-10-23T16:00:00Z",
        }
      `);
    });

    it("should close dialog after successful creation", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open booking dialog
      act(() => {
        result.current.openBookingDialog(new Date());
      });

      const command = {
        facility_id: facilityId,
        start_time: "2024-10-23T16:00:00Z",
        duration: "01:00:00",
      };

      await act(async () => {
        await result.current.createReservation(command);
      });

      expect(result.current.bookingState.isOpen).toBe(false);
    });

    it("should refresh schedule after successful creation", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const command = {
        facility_id: facilityId,
        start_time: "2024-10-23T16:00:00Z",
        duration: "01:00:00",
      };

      await act(async () => {
        await result.current.createReservation(command);
      });

      // Should have called fetch 3 times: initial load, create, refresh
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should throw CONFLICT error for 409 response", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const command = {
        facility_id: facilityId,
        start_time: "2024-10-23T16:00:00Z",
        duration: "01:00:00",
      };

      await expect(
        act(async () => {
          await result.current.createReservation(command);
        })
      ).rejects.toThrow("CONFLICT");
    });

    it("should throw error for other failed responses", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Bad Request",
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const command = {
        facility_id: facilityId,
        start_time: "2024-10-23T16:00:00Z",
        duration: "01:00:00",
      };

      await expect(
        act(async () => {
          await result.current.createReservation(command);
        })
      ).rejects.toThrow("Failed to create reservation");
    });
  });

  describe("Canceling Reservations", () => {
    it("should cancel reservation successfully", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open cancel dialog
      act(() => {
        result.current.openCancelDialog(42);
      });

      const command = createTestCancelCommand({
        cancellation_message: "Maintenance required",
      });

      await act(async () => {
        await result.current.cancelReservation(command);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/reservations/42",
        expect.objectContaining({
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(JSON.parse(mockFetch.mock.calls[1][1].body as string)).toMatchInlineSnapshot(`
        {
          "cancellation_message": "Maintenance required",
          "status": "canceled",
        }
      `);
    });

    it("should close dialog after successful cancellation", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.openCancelDialog(42);
      });

      await act(async () => {
        await result.current.cancelReservation({ status: "canceled" });
      });

      expect(result.current.cancelState.isOpen).toBe(false);
    });

    it("should refresh schedule after successful cancellation", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.openCancelDialog(42);
      });

      await act(async () => {
        await result.current.cancelReservation({ status: "canceled" });
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should throw error when no reservation ID is set", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScheduleData,
      });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Don't open cancel dialog, so reservationId is null

      await expect(
        act(async () => {
          await result.current.cancelReservation({ status: "canceled" });
        })
      ).rejects.toThrow("No reservation ID specified");
    });

    it("should throw error for failed cancellation", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockScheduleData,
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Forbidden",
        });

      const { result } = renderHook(() => useFacilitySchedule(facilityId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.openCancelDialog(42);
      });

      await expect(
        act(async () => {
          await result.current.cancelReservation({ status: "canceled" });
        })
      ).rejects.toThrow("Failed to cancel reservation");
    });
  });
});
