/**
 * Unit tests for ScheduleView component
 *
 * Tests cover:
 * - Rendering list of time slots
 * - Empty state handling
 * - Time slot interaction callbacks
 * - User role-based rendering
 * - Accessibility attributes
 * - Integration with TimeSlot component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScheduleView from "../../../components/ScheduleView";
import type { TimeSlotViewModel } from "../../../components/views/viewModels";

describe("ScheduleView", () => {
  // Helper functions to create dynamic dates based on current date
  const getToday = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  };

  const getTodayAtTime = (hours: number, minutes = 0) => {
    const date = getToday();
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
  };

  const getTodayAtTimeISOString = (hours: number, minutes = 0) => getTodayAtTime(hours, minutes).toISOString();

  const mockTimeSlots: TimeSlotViewModel[] = [
    {
      startTime: getTodayAtTime(14, 0),
      endTime: getTodayAtTime(14, 15),
      status: "available",
    },
    {
      startTime: getTodayAtTime(14, 15),
      endTime: getTodayAtTime(14, 30),
      status: "available",
    },
    {
      startTime: getTodayAtTime(14, 30),
      endTime: getTodayAtTime(14, 45),
      status: "booked",
      reservation: {
        id: 1,
        start_time: getTodayAtTimeISOString(14, 30),
        end_time: getTodayAtTimeISOString(15, 30),
        duration: "01:00:00",
        status: "confirmed",
        user: { email: "user@example.com" },
      },
    },
    {
      startTime: getTodayAtTime(16, 0),
      endTime: getTodayAtTime(16, 15),
      status: "available",
    },
    {
      startTime: getTodayAtTime(16, 15),
      endTime: getTodayAtTime(16, 30),
      status: "available",
    },
  ];

  describe("Rendering", () => {
    it("should render all time slots", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const list = screen.getByRole("list", { name: /daily schedule timeline/i });
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(5);
    });

    it("should render time slots in order", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      // Check that available slots are rendered (16:00, 16:15 - adjusted for local timezone)
      expect(screen.getByLabelText(/16:00.*16:15/)).toBeInTheDocument();
      expect(screen.getByLabelText(/16:15.*16:30/)).toBeInTheDocument();
    });

    it("should pass userRole to TimeSlot components", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      const { rerender } = render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="admin"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      // Admin should see cancel buttons for booked slots
      expect(screen.getByRole("button", { name: /cancel reservation/i })).toBeInTheDocument();

      // Re-render as user
      rerender(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      // User should not see cancel buttons
      expect(screen.queryByRole("button", { name: /cancel reservation/i })).not.toBeInTheDocument();
    });

    it("should render available time slots as clickable buttons", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const availableSlots = screen.getAllByRole("button", { name: /book time slot/i });
      expect(availableSlots).toHaveLength(4); // Four available slots
    });

    it("should render booked time slots with reservation details", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      // Booked slot should show time range
      expect(screen.getByLabelText(/booked time slot/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no time slots", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={[]}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.getByText(/no time slots available for this date/i)).toBeInTheDocument();
    });

    it("should not render list when empty", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={[]}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("should style empty state with dashed border", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      const { container } = render(
        <ScheduleView
          timeSlots={[]}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const emptyState = container.querySelector(".border-dashed");
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onTimeSlotSelect when available slot is clicked", async () => {
      const user = userEvent.setup();
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const firstAvailableSlot = screen.getByLabelText(/16:00.*16:15/);
      await user.click(firstAvailableSlot);

      expect(onTimeSlotSelect).toHaveBeenCalledTimes(1);
      expect(onTimeSlotSelect).toHaveBeenCalledWith(getTodayAtTime(16, 0));
    });

    it("should call onCancelReservation when admin cancels a booking", async () => {
      const user = userEvent.setup();
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="admin"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel reservation/i });
      await user.click(cancelButton);

      expect(onCancelReservation).toHaveBeenCalledTimes(1);
      expect(onCancelReservation).toHaveBeenCalledWith(1); // reservation ID
    });

    it("should call callback with correct time for each slot", async () => {
      const user = userEvent.setup();
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const firstSlot = screen.getByLabelText(/16:00.*16:15/);
      await user.click(firstSlot);
      expect(onTimeSlotSelect).toHaveBeenLastCalledWith(getTodayAtTime(16, 0));

      const secondSlot = screen.getByLabelText(/16:15.*16:30/);
      await user.click(secondSlot);
      expect(onTimeSlotSelect).toHaveBeenLastCalledWith(getTodayAtTime(16, 15));
    });

    it("should allow multiple interactions", async () => {
      const user = userEvent.setup();
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const firstSlot = screen.getByLabelText(/16:00.*16:15/);
      await user.click(firstSlot);
      await user.click(firstSlot);
      await user.click(firstSlot);

      expect(onTimeSlotSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("should have proper list semantics", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const list = screen.getByRole("list");
      expect(list).toHaveAttribute("aria-label", "Daily schedule timeline");
    });

    it("should render each time slot as a list item", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockTimeSlots.length);
    });

    it("should have descriptive labels for time slots", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      // Available slots should have "Book" labels
      expect(screen.getByLabelText(/book time slot from 16:00/i)).toBeInTheDocument();

      // Booked slots should have "Booked" labels
      expect(screen.getByLabelText(/booked time slot/i)).toBeInTheDocument();
    });
  });

  describe("Role-Based Rendering", () => {
    it("should show cancel buttons for admin users", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="admin"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.getByRole("button", { name: /cancel reservation/i })).toBeInTheDocument();
    });

    it("should hide cancel buttons for regular users", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.queryByRole("button", { name: /cancel reservation/i })).not.toBeInTheDocument();
    });

    it("should show user email for admin users", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="admin"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("should hide user email for regular users", () => {
      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={mockTimeSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle all available slots", () => {
      const allAvailableSlots: TimeSlotViewModel[] = [
        {
          startTime: getTodayAtTime(14, 0),
          endTime: getTodayAtTime(14, 15),
          status: "available",
        },
        {
          startTime: getTodayAtTime(14, 15),
          endTime: getTodayAtTime(14, 30),
          status: "available",
        },
      ];

      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={allAvailableSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const availableButtons = screen.getAllByRole("button", { name: /book time slot/i });
      expect(availableButtons).toHaveLength(2);
    });

    it("should handle all booked slots", () => {
      const allBookedSlots: TimeSlotViewModel[] = [
        {
          startTime: getTodayAtTime(14, 0),
          endTime: getTodayAtTime(14, 15),
          status: "booked",
          reservation: {
            id: 1,
            start_time: getTodayAtTimeISOString(14, 0),
            end_time: getTodayAtTimeISOString(15, 0),
            duration: "01:00:00",
            status: "confirmed",
          },
        },
        {
          startTime: getTodayAtTime(14, 15),
          endTime: getTodayAtTime(14, 30),
          status: "booked",
          reservation: {
            id: 2,
            start_time: getTodayAtTimeISOString(14, 15),
            end_time: getTodayAtTimeISOString(15, 15),
            duration: "01:00:00",
            status: "confirmed",
          },
        },
      ];

      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={allBookedSlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      expect(screen.queryByRole("button", { name: /book time slot/i })).not.toBeInTheDocument();
    });

    it("should handle single time slot", () => {
      const singleSlot: TimeSlotViewModel[] = [
        {
          startTime: getTodayAtTime(14, 0),
          endTime: getTodayAtTime(14, 15),
          status: "available",
        },
      ];

      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={singleSlot}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(1);
    });

    it("should handle many time slots (32 for full day)", () => {
      // Generate 32 slots (8 hours * 4 slots per hour) starting from 14:00
      const manySlots: TimeSlotViewModel[] = Array.from({ length: 32 }, (_, i) => {
        const totalMinutes = i * 15; // Each slot is 15 minutes
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const startHour = 14 + hours;
        const startMinute = minutes;
        const endMinute = startMinute + 15;

        // Handle minute overflow
        const endHour = startHour + Math.floor(endMinute / 60);
        const finalEndMinute = endMinute % 60;

        const todayDateString = getToday().toISOString().split("T")[0];

        return {
          startTime: new Date(
            `${todayDateString}T${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}:00Z`
          ),
          endTime: new Date(
            `${todayDateString}T${endHour.toString().padStart(2, "0")}:${finalEndMinute.toString().padStart(2, "0")}:00Z`
          ),
          status: "available" as const,
        };
      });

      const onTimeSlotSelect = vi.fn();
      const onCancelReservation = vi.fn();

      render(
        <ScheduleView
          timeSlots={manySlots}
          userRole="user"
          onTimeSlotSelect={onTimeSlotSelect}
          onCancelReservation={onCancelReservation}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(32);
    });
  });
});
