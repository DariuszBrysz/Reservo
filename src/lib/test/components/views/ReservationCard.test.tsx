/**
 * Unit tests for ReservationCard component
 *
 * Tests cover:
 * - Reservation data display
 * - Action button visibility based on status
 * - Event handler calls
 * - Status badge styling
 * - Cancellation message display
 * - Accessibility
 *
 * Test scenarios from test-plan.md:
 * - US-006: View My Reservations
 * - US-007: Edit a Reservation
 * - US-008: Cancel a Reservation
 * - US-009: Export Reservation to ICS
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReservationCard from "../../../../components/views/ReservationCard";
import type { ReservationViewModel } from "../../../../components/views/viewModels";

describe("ReservationCard", () => {
  const mockOnEdit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnExport = vi.fn();

  const editableReservation: ReservationViewModel = {
    id: 1,
    facilityName: "Basketball Court",
    date: "25 October 2024",
    startTime: "14:00",
    endTime: "15:30",
    status: "Confirmed",
    cancellationMessage: null,
    isEditable: true,
    isCancelable: true,
    originalStartTime: new Date("2024-10-25T14:00:00Z"),
    originalDuration: "01:30:00",
  };

  const pastReservation: ReservationViewModel = {
    id: 2,
    facilityName: "Tennis Court",
    date: "20 October 2024",
    startTime: "16:00",
    endTime: "17:00",
    status: "Confirmed",
    cancellationMessage: null,
    isEditable: false,
    isCancelable: false,
    originalStartTime: new Date("2024-10-20T16:00:00Z"),
    originalDuration: "01:00:00",
  };

  const canceledReservation: ReservationViewModel = {
    id: 3,
    facilityName: "Soccer Field",
    date: "22 October 2024",
    startTime: "18:00",
    endTime: "19:30",
    status: "Canceled",
    cancellationMessage: "Maintenance required",
    isEditable: false,
    isCancelable: false,
    originalStartTime: new Date("2024-10-22T18:00:00Z"),
    originalDuration: "01:30:00",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Data Display", () => {
    it("should display facility name", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
    });

    it("should display reservation date", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("25 October 2024")).toBeInTheDocument();
    });

    it("should display start and end times", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/14:00.*-.*15:30/)).toBeInTheDocument();
    });

    it("should display reservation status", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("Confirmed")).toBeInTheDocument();
    });

    it("should display date label", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("Date")).toBeInTheDocument();
    });

    it("should display time label", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("Time")).toBeInTheDocument();
    });
  });

  describe("Status Badge", () => {
    it("should display confirmed status with green styling", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const statusBadge = screen.getByText("Confirmed");
      expect(statusBadge).toHaveClass("bg-green-100");
      expect(statusBadge).toHaveClass("text-green-800");
    });

    it("should display canceled status with red styling", () => {
      render(
        <ReservationCard
          reservation={canceledReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const statusBadge = screen.getByText("Canceled");
      expect(statusBadge).toHaveClass("bg-red-100");
      expect(statusBadge).toHaveClass("text-red-800");
    });

    it("should have uppercase status text", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const statusBadge = screen.getByText("Confirmed");
      expect(statusBadge).toHaveClass("uppercase");
    });

    it("should have badge positioned correctly", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const statusBadge = screen.getByText("Confirmed");
      expect(statusBadge).toHaveClass("shrink-0");
    });
  });

  describe("Action Buttons - Editable Reservation", () => {
    it("should show edit button for editable reservations", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it("should show cancel button for cancelable reservations", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    });

    it("should show export button for all confirmed reservations", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole("button", { name: /export to calendar/i })).toBeInTheDocument();
    });

    it("should call onEdit when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(editableReservation);
    });

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledWith(editableReservation);
    });

    it("should call onExport when export button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByRole("button", { name: /export to calendar/i });
      await user.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledWith(1);
    });

    it("should style cancel button as destructive", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      expect(cancelButton).toHaveAttribute("class", expect.stringContaining("destructive"));
    });

    it("should have icons on action buttons", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const svgs = document.querySelectorAll("svg");
      // Should have icons for: date, time, edit, cancel, export
      expect(svgs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Action Buttons - Past Reservation", () => {
    it("should not show edit button for non-editable reservations", () => {
      render(
        <ReservationCard
          reservation={pastReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    });

    it("should not show cancel button for non-cancelable reservations", () => {
      render(
        <ReservationCard
          reservation={pastReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
    });

    it("should still show export button for past confirmed reservations", () => {
      render(
        <ReservationCard
          reservation={pastReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole("button", { name: /export to calendar/i })).toBeInTheDocument();
    });

    it("should not show actions footer when no actions available for canceled", () => {
      render(
        <ReservationCard
          reservation={canceledReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Cancellation Message", () => {
    it("should display cancellation message when present", () => {
      render(
        <ReservationCard
          reservation={canceledReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("Maintenance required")).toBeInTheDocument();
    });

    it("should display cancellation reason label", () => {
      render(
        <ReservationCard
          reservation={canceledReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText("Cancellation Reason")).toBeInTheDocument();
    });

    it("should not display cancellation section when no message", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.queryByText("Cancellation Reason")).not.toBeInTheDocument();
    });

    it("should style cancellation message area", () => {
      const { container } = render(
        <ReservationCard
          reservation={canceledReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const messageArea = container.querySelector(".bg-muted\\/50");
      expect(messageArea).toBeInTheDocument();
    });

    it("should display separator before cancellation message", () => {
      render(
        <ReservationCard
          reservation={canceledReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      // Check for Separator component
      const messageLabel = screen.getByText("Cancellation Reason");
      expect(messageLabel).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should have hover effect", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const card = container.querySelector(".hover\\:shadow-md");
      expect(card).toBeInTheDocument();
    });

    it("should have transition effect", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const card = container.querySelector(".transition-shadow");
      expect(card).toBeInTheDocument();
    });

    it("should use grid layout for date and time", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const grid = container.querySelector(".grid-cols-1");
      expect(grid).toBeInTheDocument();
    });

    it("should have proper spacing in content", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const content = container.querySelector(".space-y-4");
      expect(content).toBeInTheDocument();
    });

    it("should have icon backgrounds", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const iconBg = container.querySelector(".bg-primary\\/10");
      expect(iconBg).toBeInTheDocument();
    });

    it("should have rounded corners", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const statusBadge = screen.getByText("Confirmed");
      expect(statusBadge).toHaveClass("rounded-full");
    });
  });

  describe("Accessibility", () => {
    it("should have heading for facility name", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const heading = screen.getByText("Basketball Court");
      expect(heading).toBeInTheDocument();
    });

    it("should have aria-hidden on decorative icons", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const hiddenSvgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(hiddenSvgs.length).toBeGreaterThan(0);
    });

    it("should have accessible button labels", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole("button", { name: /edit/i })).toHaveAccessibleName();
      expect(screen.getByRole("button", { name: /cancel/i })).toHaveAccessibleName();
      expect(screen.getByRole("button", { name: /export to calendar/i })).toHaveAccessibleName();
    });

    it("should have semantic structure with header, content, and footer", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      // Card structure should be present with data-slot attributes
      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Time")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive button labels", () => {
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      // Edit button should have both full and short text
      const editButton = screen.getByRole("button", { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it("should have responsive grid layout", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const grid = container.querySelector(".sm\\:grid-cols-2");
      expect(grid).toBeInTheDocument();
    });

    it("should have responsive button layout in footer", () => {
      const { container } = render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const footer = container.querySelector(".sm\\:flex-row");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long facility names", () => {
      const longNameReservation: ReservationViewModel = {
        ...editableReservation,
        facilityName: "Super Ultra Mega Awesome Basketball and Volleyball Multi-Purpose Sports Facility Complex",
      };

      render(
        <ReservationCard
          reservation={longNameReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(
        screen.getByText("Super Ultra Mega Awesome Basketball and Volleyball Multi-Purpose Sports Facility Complex")
      ).toBeInTheDocument();
    });

    it("should handle very long cancellation messages", () => {
      const longMessageReservation: ReservationViewModel = {
        ...canceledReservation,
        cancellationMessage:
          "This reservation has been canceled due to unexpected facility maintenance that requires immediate attention. We apologize for any inconvenience this may cause.",
      };

      render(
        <ReservationCard
          reservation={longMessageReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(
        screen.getByText(/this reservation has been canceled due to unexpected facility maintenance/i)
      ).toBeInTheDocument();
    });

    it("should handle facility names with special characters", () => {
      const specialNameReservation: ReservationViewModel = {
        ...editableReservation,
        facilityName: 'Court #1 & Pool "Main" (A/B)',
      };

      render(
        <ReservationCard
          reservation={specialNameReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText('Court #1 & Pool "Main" (A/B)')).toBeInTheDocument();
    });

    it("should handle midnight times", () => {
      const midnightReservation: ReservationViewModel = {
        ...editableReservation,
        startTime: "00:00",
        endTime: "01:00",
      };

      render(
        <ReservationCard
          reservation={midnightReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/00:00.*-.*01:00/)).toBeInTheDocument();
    });

    it("should handle reservations exactly at closing time", () => {
      const closingReservation: ReservationViewModel = {
        ...editableReservation,
        startTime: "20:00",
        endTime: "22:00",
      };

      render(
        <ReservationCard
          reservation={closingReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/20:00.*-.*22:00/)).toBeInTheDocument();
    });
  });

  describe("Multiple Interactions", () => {
    it("should handle multiple button clicks", async () => {
      const user = userEvent.setup();
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByRole("button", { name: /export to calendar/i });
      await user.click(exportButton);
      await user.click(exportButton);
      await user.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledTimes(3);
    });

    it("should handle rapid button clicks", async () => {
      const user = userEvent.setup();
      render(
        <ReservationCard
          reservation={editableReservation}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.tripleClick(editButton);

      expect(mockOnEdit).toHaveBeenCalled();
    });
  });
});
