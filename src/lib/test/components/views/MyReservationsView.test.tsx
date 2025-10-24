/**
 * Unit tests for MyReservationsView component
 *
 * Tests cover:
 * - Loading state display
 * - Error state handling
 * - Tab navigation and reservation display
 * - Edit dialog management
 * - Cancel dialog management
 * - Export functionality
 * - Success/error toast notifications
 * - Integration with useMyReservations hook
 *
 * Test scenarios from test-plan.md:
 * - RES-003: User can view list of their own upcoming reservations
 * - RES-004: User can cancel their upcoming reservations
 * - US-006: View My Reservations
 * - US-007: Edit a Reservation
 * - US-008: Cancel a Reservation
 * - US-009: Export Reservation to ICS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyReservationsView from "../../../../components/views/MyReservationsView";
import * as useMyReservationsModule from "../../../../components/hooks/useMyReservations";
import type { ReservationViewModel } from "../../../../components/views/viewModels";

// Mock the useMyReservations hook
vi.mock("../../../../components/hooks/useMyReservations");

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Radix UI Select components for testing
vi.mock("../../../../components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
  }) => (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      data-testid="duration-select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

describe("MyReservationsView", () => {
  const mockUseMyReservations = vi.mocked(useMyReservationsModule.useMyReservations);

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

  const defaultHookReturn = {
    upcomingReservations: [upcomingReservation],
    pastReservations: [pastReservation],
    canceledReservations: [canceledReservation],
    isLoading: false,
    error: null,
    updateDuration: vi.fn(),
    cancel: vi.fn(),
    exportToIcs: vi.fn(),
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyReservations.mockReturnValue(defaultHookReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should display skeleton loaders while loading", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      const { container } = render(<MyReservationsView />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show multiple skeleton cards", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      const { container } = render(<MyReservationsView />);

      // Should show skeleton for tabs and multiple reservation cards
      const skeletons = container.querySelectorAll(".h-40");
      expect(skeletons.length).toBe(3);
    });

    it("should not display reservations while loading", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<MyReservationsView />);

      expect(screen.queryByText("Basketball Court")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when loading fails", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        error: "Failed to load reservations",
      });

      render(<MyReservationsView />);

      expect(screen.getByText(/error loading reservations/i)).toBeInTheDocument();
      expect(screen.getByText("Failed to load reservations")).toBeInTheDocument();
    });

    it("should display error icon in error state", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        error: "Network error",
      });

      render(<MyReservationsView />);

      // Check for SVG error icon
      const svgs = document.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    it("should still show page title in error state", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        error: "Failed to load reservations",
      });

      render(<MyReservationsView />);

      expect(screen.getByRole("heading", { name: "My Reservations" })).toBeInTheDocument();
    });

    it("should not display tabs in error state", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        error: "Failed to load reservations",
      });

      render(<MyReservationsView />);

      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });
  });

  describe("Success State - US-006", () => {
    it("should display page heading", () => {
      render(<MyReservationsView />);

      const heading = screen.getByRole("heading", { name: "My Reservations" });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });

    it("should display tabs for different reservation types", () => {
      render(<MyReservationsView />);

      expect(screen.getByRole("tab", { name: /upcoming/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /past/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /canceled/i })).toBeInTheDocument();
    });

    it("should show reservation counts in tabs", () => {
      render(<MyReservationsView />);

      const upcomingTab = screen.getByRole("tab", { name: /upcoming/i });
      const pastTab = screen.getByRole("tab", { name: /past/i });
      const canceledTab = screen.getByRole("tab", { name: /canceled/i });

      expect(upcomingTab).toHaveTextContent("1");
      expect(pastTab).toHaveTextContent("1");
      expect(canceledTab).toHaveTextContent("1");
    });

    it("should display upcoming reservations by default", () => {
      render(<MyReservationsView />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
    });

    it("should have upcoming tab selected by default", () => {
      render(<MyReservationsView />);

      const upcomingTab = screen.getByRole("tab", { name: /upcoming/i });
      expect(upcomingTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("Tab Navigation", () => {
    it("should switch to past reservations tab", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const pastTab = screen.getByRole("tab", { name: /past/i });
      await user.click(pastTab);

      expect(screen.getByText("Tennis Court")).toBeInTheDocument();
    });

    it("should switch to canceled reservations tab", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const canceledTab = screen.getByRole("tab", { name: /canceled/i });
      await user.click(canceledTab);

      expect(screen.getByText("Soccer Field")).toBeInTheDocument();
    });

    it("should update active tab styling", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const pastTab = screen.getByRole("tab", { name: /past/i });
      await user.click(pastTab);

      expect(pastTab).toHaveAttribute("data-state", "active");
    });

    it("should hide previous tab content when switching", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();

      const pastTab = screen.getByRole("tab", { name: /past/i });
      await user.click(pastTab);

      expect(screen.queryByText("Basketball Court")).not.toBeInTheDocument();
    });
  });

  describe("Empty State Display", () => {
    it("should show empty message when no upcoming reservations", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        upcomingReservations: [],
      });

      render(<MyReservationsView />);

      expect(screen.getByText(/you have no upcoming reservations/i)).toBeInTheDocument();
    });

    it("should show empty message for past reservations", async () => {
      const user = userEvent.setup();
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        pastReservations: [],
      });

      render(<MyReservationsView />);

      const pastTab = screen.getByRole("tab", { name: /past/i });
      await user.click(pastTab);

      expect(screen.getByText(/you have no past reservations/i)).toBeInTheDocument();
    });

    it("should show empty message for canceled reservations", async () => {
      const user = userEvent.setup();
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        canceledReservations: [],
      });

      render(<MyReservationsView />);

      const canceledTab = screen.getByRole("tab", { name: /canceled/i });
      await user.click(canceledTab);

      expect(screen.getByText(/you have no canceled reservations/i)).toBeInTheDocument();
    });

    it("should show zero in tab count when empty", () => {
      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        upcomingReservations: [],
      });

      render(<MyReservationsView />);

      const upcomingTab = screen.getByRole("tab", { name: /upcoming/i });
      expect(upcomingTab).toHaveTextContent("0");
    });
  });

  describe("Edit Dialog Management - US-007", () => {
    it("should not display edit dialog initially", () => {
      render(<MyReservationsView />);

      expect(screen.queryByRole("dialog", { name: /edit reservation duration/i })).not.toBeInTheDocument();
    });

    it("should open edit dialog when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should close edit dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should call updateDuration when save is confirmed", async () => {
      const user = userEvent.setup();
      const updateDuration = vi.fn().mockResolvedValue(undefined);

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        updateDuration,
      });

      render(<MyReservationsView />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select new duration using the mocked select
      const durationSelect = screen.getByTestId("duration-select");
      await user.selectOptions(durationSelect, "02:00:00");

      // Save changes
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateDuration).toHaveBeenCalledWith(1, "02:00:00");
      });
    });

    it("should show success toast after successful update", async () => {
      const user = userEvent.setup();
      const updateDuration = vi.fn().mockResolvedValue(undefined);
      const { toast } = await import("sonner");

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        updateDuration,
      });

      render(<MyReservationsView />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const durationSelect = screen.getByTestId("duration-select");
      await user.selectOptions(durationSelect, "02:00:00");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Reservation updated successfully");
      });
    });

    it("should show error toast when update fails", async () => {
      const user = userEvent.setup();
      const updateDuration = vi.fn().mockRejectedValue(new Error("Update failed"));
      const { toast } = await import("sonner");

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        updateDuration,
      });

      render(<MyReservationsView />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const durationSelect = screen.getByTestId("duration-select");
      await user.selectOptions(durationSelect, "02:00:00");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
      });
    });

    it("should close dialog after successful update", async () => {
      const user = userEvent.setup();
      const updateDuration = vi.fn().mockResolvedValue(undefined);

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        updateDuration,
      });

      render(<MyReservationsView />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const durationSelect = screen.getByTestId("duration-select");
      await user.selectOptions(durationSelect, "02:00:00");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Cancel Dialog Management - US-008", () => {
    it("should not display cancel dialog initially", () => {
      render(<MyReservationsView />);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should open cancel dialog when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("should close cancel dialog when keep reservation is clicked", async () => {
      const user = userEvent.setup();
      render(<MyReservationsView />);

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const keepButton = screen.getByRole("button", { name: /keep reservation/i });
      await user.click(keepButton);

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("should call cancel when cancellation is confirmed", async () => {
      const user = userEvent.setup();
      const cancel = vi.fn().mockResolvedValue(undefined);

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        cancel,
      });

      render(<MyReservationsView />);

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /cancel reservation/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(cancel).toHaveBeenCalledWith(1);
      });
    });

    it("should show success toast after successful cancellation", async () => {
      const user = userEvent.setup();
      const cancel = vi.fn().mockResolvedValue(undefined);
      const { toast } = await import("sonner");

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        cancel,
      });

      render(<MyReservationsView />);

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /cancel reservation/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Reservation canceled successfully");
      });
    });

    it("should show error toast when cancellation fails", async () => {
      const user = userEvent.setup();
      const cancel = vi.fn().mockRejectedValue(new Error("Cancellation failed"));
      const { toast } = await import("sonner");

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        cancel,
      });

      render(<MyReservationsView />);

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /cancel reservation/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Cancellation failed");
      });
    });

    it("should close dialog after successful cancellation", async () => {
      const user = userEvent.setup();
      const cancel = vi.fn().mockResolvedValue(undefined);

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        cancel,
      });

      render(<MyReservationsView />);

      const cancelButton = screen.getByRole("button", { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /cancel reservation/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality - US-009", () => {
    it("should call exportToIcs when export button is clicked", async () => {
      const user = userEvent.setup();
      const exportToIcs = vi.fn();

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        exportToIcs,
      });

      render(<MyReservationsView />);

      const exportButton = screen.getByRole("button", { name: /export to calendar/i });
      await user.click(exportButton);

      expect(exportToIcs).toHaveBeenCalledWith(1);
    });

    it("should show success toast when exporting", async () => {
      const user = userEvent.setup();
      const exportToIcs = vi.fn();
      const { toast } = await import("sonner");

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        exportToIcs,
      });

      render(<MyReservationsView />);

      const exportButton = screen.getByRole("button", { name: /export to calendar/i });
      await user.click(exportButton);

      expect(toast.success).toHaveBeenCalledWith("Downloading reservation as .ics file");
    });

    it("should allow export from past reservations tab", async () => {
      const user = userEvent.setup();
      const exportToIcs = vi.fn();

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        exportToIcs,
      });

      render(<MyReservationsView />);

      const pastTab = screen.getByRole("tab", { name: /past/i });
      await user.click(pastTab);

      const exportButton = screen.getByRole("button", { name: /export to calendar/i });
      await user.click(exportButton);

      expect(exportToIcs).toHaveBeenCalledWith(2);
    });
  });

  describe("Layout and Styling", () => {
    it("should use consistent container styling", () => {
      const { container } = render(<MyReservationsView />);

      const mainContainer = container.querySelector(".container");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("mx-auto");
      expect(mainContainer).toHaveClass("px-4");
      expect(mainContainer).toHaveClass("py-8");
    });

    it("should use max-width container", () => {
      const { container } = render(<MyReservationsView />);

      const maxWidthContainer = container.querySelector(".max-w-5xl");
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it("should have proper heading styling", () => {
      render(<MyReservationsView />);

      const heading = screen.getByRole("heading", { name: "My Reservations" });
      expect(heading).toHaveClass("text-4xl");
      expect(heading).toHaveClass("font-bold");
    });
  });

  describe("Integration with Hook", () => {
    it("should call useMyReservations hook", () => {
      render(<MyReservationsView />);

      expect(mockUseMyReservations).toHaveBeenCalled();
    });

    it("should use all hook return values", () => {
      const customHookReturn = {
        upcomingReservations: [upcomingReservation],
        pastReservations: [],
        canceledReservations: [],
        isLoading: false,
        error: null,
        updateDuration: vi.fn(),
        cancel: vi.fn(),
        exportToIcs: vi.fn(),
        refetch: vi.fn(),
      };

      mockUseMyReservations.mockReturnValue(customHookReturn);

      render(<MyReservationsView />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /past/i })).toHaveTextContent("0");
    });
  });

  describe("Responsive Design", () => {
    it("should show responsive tab labels", () => {
      render(<MyReservationsView />);

      // Desktop labels
      expect(screen.getByText("Upcoming")).toBeInTheDocument();
      expect(screen.getByText("Past")).toBeInTheDocument();
      expect(screen.getByText("Canceled")).toBeInTheDocument();
    });

    it("should have grid layout for tabs", () => {
      const { container } = render(<MyReservationsView />);

      const tabsList = container.querySelector(".grid-cols-3");
      expect(tabsList).toBeInTheDocument();
    });
  });

  describe("Multiple Reservations", () => {
    it("should display multiple upcoming reservations", () => {
      const multipleReservations = [
        upcomingReservation,
        { ...upcomingReservation, id: 4, facilityName: "Pool" },
        { ...upcomingReservation, id: 5, facilityName: "Gym" },
      ];

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        upcomingReservations: multipleReservations,
      });

      render(<MyReservationsView />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      expect(screen.getByText("Pool")).toBeInTheDocument();
      expect(screen.getByText("Gym")).toBeInTheDocument();
    });

    it("should update tab count with multiple reservations", () => {
      const multipleReservations = [
        upcomingReservation,
        { ...upcomingReservation, id: 4, facilityName: "Pool" },
        { ...upcomingReservation, id: 5, facilityName: "Gym" },
      ];

      mockUseMyReservations.mockReturnValue({
        ...defaultHookReturn,
        upcomingReservations: multipleReservations,
      });

      render(<MyReservationsView />);

      const upcomingTab = screen.getByRole("tab", { name: /upcoming/i });
      expect(upcomingTab).toHaveTextContent("3");
    });
  });
});
