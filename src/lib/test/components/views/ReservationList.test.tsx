/**
 * Unit tests for ReservationList component
 *
 * Tests cover:
 * - Empty state display
 * - Multiple reservation rendering
 * - Event handler prop passing
 * - Accessibility
 *
 * Test scenarios from test-plan.md:
 * - US-006: View My Reservations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReservationList from "../../../../components/views/ReservationList";
import type { ReservationViewModel } from "../../../../components/views/viewModels";

describe("ReservationList", () => {
  const mockOnEdit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnExport = vi.fn();

  const upcomingReservation: ReservationViewModel = {
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

  describe("Empty State", () => {
    it("should display empty message when no reservations", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="You have no upcoming reservations."
        />
      );

      expect(screen.getByText("You have no upcoming reservations.")).toBeInTheDocument();
    });

    it("should display empty icon", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations found."
        />
      );

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-muted-foreground");
    });

    it("should center empty state content", () => {
      const { container } = render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const emptyContainer = container.querySelector(".items-center");
      expect(emptyContainer).toBeInTheDocument();
      expect(emptyContainer).toHaveClass("justify-center");
    });

    it("should display custom empty message", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="Custom empty message"
        />
      );

      expect(screen.getByText("Custom empty message")).toBeInTheDocument();
    });

    it("should not display reservation cards in empty state", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.queryByText("Basketball Court")).not.toBeInTheDocument();
    });
  });

  describe("Single Reservation", () => {
    it("should display single reservation", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
    });

    it("should not display empty message when reservations exist", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.queryByText("No reservations.")).not.toBeInTheDocument();
    });

    it("should display reservation details", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("25 October 2024")).toBeInTheDocument();
      expect(screen.getByText(/14:00/)).toBeInTheDocument();
      expect(screen.getByText(/15:30/)).toBeInTheDocument();
    });
  });

  describe("Multiple Reservations", () => {
    it("should display multiple reservations", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation, pastReservation, canceledReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      expect(screen.getByText("Tennis Court")).toBeInTheDocument();
      expect(screen.getByText("Soccer Field")).toBeInTheDocument();
    });

    it("should render reservations in order", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation, pastReservation, canceledReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const facilityNames = screen.getAllByText(/court|field/i);
      expect(facilityNames[0]).toHaveTextContent("Basketball Court");
      expect(facilityNames[1]).toHaveTextContent("Tennis Court");
      expect(facilityNames[2]).toHaveTextContent("Soccer Field");
    });

    it("should have proper spacing between reservations", () => {
      const { container } = render(
        <ReservationList
          reservations={[upcomingReservation, pastReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const listContainer = container.querySelector(".space-y-4");
      expect(listContainer).toBeInTheDocument();
    });

    it("should assign unique keys to each reservation", () => {
      const { container } = render(
        <ReservationList
          reservations={[upcomingReservation, pastReservation, canceledReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      // All three cards should be rendered
      const cards = container.querySelectorAll('[class*="transition-shadow"]');
      expect(cards.length).toBe(3);
    });
  });

  describe("Event Handler Propagation", () => {
    it("should pass onEdit handler to reservation cards", async () => {
      const user = userEvent.setup();
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(upcomingReservation);
    });

    it("should pass onCancel handler to reservation cards", async () => {
      const user = userEvent.setup();
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledWith(upcomingReservation);
    });

    it("should pass onExport handler to reservation cards", async () => {
      const user = userEvent.setup();
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const exportButton = screen.getByRole("button", { name: /export to calendar/i });
      await user.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledWith(1);
    });

    it("should handle multiple clicks on different reservations", async () => {
      const user = userEvent.setup();
      render(
        <ReservationList
          reservations={[upcomingReservation, pastReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const exportButtons = screen.getAllByRole("button", { name: /export to calendar/i });
      await user.click(exportButtons[0]);
      await user.click(exportButtons[1]);

      expect(mockOnExport).toHaveBeenCalledWith(1);
      expect(mockOnExport).toHaveBeenCalledWith(2);
      expect(mockOnExport).toHaveBeenCalledTimes(2);
    });
  });

  describe("Reservation States", () => {
    it("should display confirmed reservations", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("Confirmed")).toBeInTheDocument();
    });

    it("should display canceled reservations", () => {
      render(
        <ReservationList
          reservations={[canceledReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("Canceled")).toBeInTheDocument();
    });

    it("should display cancellation message when present", () => {
      render(
        <ReservationList
          reservations={[canceledReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("Maintenance required")).toBeInTheDocument();
    });

    it("should show action buttons for editable reservations", () => {
      render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    });

    it("should not show edit button for non-editable reservations", () => {
      render(
        <ReservationList
          reservations={[pastReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    });

    it("should not show cancel button for non-cancelable reservations", () => {
      render(
        <ReservationList
          reservations={[pastReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should use proper container styling for list", () => {
      const { container } = render(
        <ReservationList
          reservations={[upcomingReservation]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const listContainer = container.querySelector(".space-y-4");
      expect(listContainer).toBeInTheDocument();
    });

    it("should style empty state properly", () => {
      const { container } = render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const emptyContainer = container.querySelector(".py-20");
      expect(emptyContainer).toBeInTheDocument();
      expect(emptyContainer).toHaveClass("text-center");
    });

    it("should have circular icon background in empty state", () => {
      const { container } = render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const iconBg = container.querySelector(".rounded-full");
      expect(iconBg).toBeInTheDocument();
      expect(iconBg).toHaveClass("bg-muted");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible empty state message", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="You have no upcoming reservations."
        />
      );

      const message = screen.getByText("You have no upcoming reservations.");
      expect(message).toHaveClass("text-muted-foreground");
    });

    it("should have aria-hidden on decorative icon", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const svg = document.querySelector('svg[aria-hidden="true"]');
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long empty messages", () => {
      const longMessage =
        "You currently have no upcoming reservations scheduled. Please visit the facilities page to make a new booking.";

      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle many reservations", () => {
      const manyReservations = Array.from({ length: 20 }, (_, i) => ({
        ...upcomingReservation,
        id: i + 1,
        facilityName: `Facility ${i + 1}`,
      }));

      render(
        <ReservationList
          reservations={manyReservations}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      expect(screen.getByText("Facility 1")).toBeInTheDocument();
      expect(screen.getByText("Facility 20")).toBeInTheDocument();
    });

    it("should handle reservations with identical data except IDs", () => {
      const identicalReservations = [upcomingReservation, { ...upcomingReservation, id: 999 }];

      render(
        <ReservationList
          reservations={identicalReservations}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const facilityNames = screen.getAllByText("Basketball Court");
      expect(facilityNames.length).toBe(2);
    });

    it("should handle empty string as empty message", () => {
      render(
        <ReservationList
          reservations={[]}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage=""
        />
      );

      // Should still render empty state
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should render efficiently with many reservations", () => {
      const manyReservations = Array.from({ length: 100 }, (_, i) => ({
        ...upcomingReservation,
        id: i + 1,
      }));

      const { container } = render(
        <ReservationList
          reservations={manyReservations}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
          onExport={mockOnExport}
          emptyMessage="No reservations."
        />
      );

      const cards = container.querySelectorAll('[class*="transition-shadow"]');
      expect(cards.length).toBe(100);
    });
  });
});
