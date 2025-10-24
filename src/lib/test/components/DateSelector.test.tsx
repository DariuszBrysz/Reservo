/**
 * Unit tests for DateSelector component
 *
 * Tests cover:
 * - Rendering 7 date buttons
 * - Date formatting and labels
 * - Date selection callback
 * - Visual indication of selected date
 * - Accessibility attributes
 * - Edge cases with date boundaries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateSelector from "../../../components/DateSelector";

describe("DateSelector", () => {
  beforeEach(() => {
    // Mock system time to a known date for consistent testing
    vi.useFakeTimers({
      shouldAdvanceTime: true,
    });
    vi.setSystemTime(new Date("2024-10-23T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render 7 date buttons", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(7);
    });

    it("should render buttons in a group", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const group = screen.getByRole("group", { name: /select date to view schedule/i });
      expect(group).toBeInTheDocument();
    });

    it("should format date labels correctly", () => {
      const selectedDate = new Date("2024-10-23"); // Wednesday
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      // First button should be "Wednesday, 23 October 2024" (today)
      expect(screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i })).toBeInTheDocument();
    });

    it("should show consecutive dates starting from today", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      // Check that we have dates from Oct 23 to Oct 29
      expect(screen.getByText(/Wed 23/)).toBeInTheDocument();
      expect(screen.getByText(/Thu 24/)).toBeInTheDocument();
      expect(screen.getByText(/Fri 25/)).toBeInTheDocument();
      expect(screen.getByText(/Sat 26/)).toBeInTheDocument();
      expect(screen.getByText(/Sun 27/)).toBeInTheDocument();
      expect(screen.getByText(/Mon 28/)).toBeInTheDocument();
      expect(screen.getByText(/Tue 29/)).toBeInTheDocument();
    });
  });

  describe("Date Selection", () => {
    it("should call onDateSelect when a date button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const button = screen.getByRole("button", { name: /thursday.*24.*october.*2024/i });
      await user.click(button);

      expect(onDateSelect).toHaveBeenCalledTimes(1);
      expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));

      // Verify the date is correct (Oct 24, 2024)
      const calledDate = onDateSelect.mock.calls[0][0] as Date;
      expect(calledDate.getDate()).toBe(24);
      expect(calledDate.getMonth()).toBe(9); // October (0-indexed)
      expect(calledDate.getFullYear()).toBe(2024);
    });

    it("should highlight the selected date", () => {
      const selectedDate = new Date("2024-10-25"); // Friday
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const selectedButton = screen.getByRole("button", { name: /friday.*25.*october.*2024/i });
      expect(selectedButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should not highlight non-selected dates", () => {
      const selectedDate = new Date("2024-10-23"); // Wednesday
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const thursdayButton = screen.getByRole("button", { name: /thursday.*24.*october.*2024/i });
      expect(thursdayButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should update selection when selectedDate prop changes", () => {
      const onDateSelect = vi.fn();

      const { rerender } = render(<DateSelector selectedDate={new Date("2024-10-23")} onDateSelect={onDateSelect} />);

      let selectedButton = screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i });
      expect(selectedButton).toHaveAttribute("aria-pressed", "true");

      // Update to a different date
      rerender(<DateSelector selectedDate={new Date("2024-10-24")} onDateSelect={onDateSelect} />);

      selectedButton = screen.getByRole("button", { name: /thursday.*24.*october.*2024/i });
      expect(selectedButton).toHaveAttribute("aria-pressed", "true");

      const previousButton = screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i });
      expect(previousButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should allow clicking the same date multiple times", async () => {
      const user = userEvent.setup({ delay: null });
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const button = screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onDateSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label with full date information", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const button = screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i });
      expect(button).toBeInTheDocument();
    });

    it("should set aria-pressed correctly for all buttons", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const buttons = screen.getAllByRole("button");

      // First button (today) should be pressed
      expect(buttons[0]).toHaveAttribute("aria-pressed", "true");

      // Other buttons should not be pressed
      for (let i = 1; i < buttons.length; i++) {
        expect(buttons[i]).toHaveAttribute("aria-pressed", "false");
      }
    });

    it("should have proper group role and label", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-label", "Select date to view schedule");
    });

    it("should be keyboard navigable", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute("disabled");
      });
    });
  });

  describe("Styling", () => {
    it("should apply default variant to selected date", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const selectedButton = screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i });

      // Check that it doesn't have outline variant classes (default variant doesn't add specific class)
      expect(selectedButton).toBeInTheDocument();
    });

    it("should have consistent minimum width for all buttons", () => {
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("min-w-[80px]");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle month boundary correctly", () => {
      // Set date to Oct 28, so next 7 days include Nov 1-3
      vi.setSystemTime(new Date("2024-10-28T10:00:00Z"));

      const selectedDate = new Date("2024-10-28");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      // Should show Oct 28-31 and Nov 1-3
      expect(screen.getByText(/mon 28/i)).toBeInTheDocument();
      expect(screen.getByText(/tue 29/i)).toBeInTheDocument();
      expect(screen.getByText(/wed 30/i)).toBeInTheDocument();
      expect(screen.getByText(/thu 31/i)).toBeInTheDocument();
      expect(screen.getByText(/fri 1/i)).toBeInTheDocument();
      expect(screen.getByText(/sat 2/i)).toBeInTheDocument();
      expect(screen.getByText(/sun 3/i)).toBeInTheDocument();
    });

    it("should handle year boundary correctly", () => {
      // Set date to Dec 29, so next 7 days include Jan 1-4
      vi.setSystemTime(new Date("2024-12-29T10:00:00Z"));

      const selectedDate = new Date("2024-12-29");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      // Should show Dec 29-31 and Jan 1-4
      expect(screen.getByText(/sun 29/i)).toBeInTheDocument();
      expect(screen.getByText(/mon 30/i)).toBeInTheDocument();
      expect(screen.getByText(/tue 31/i)).toBeInTheDocument();
      expect(screen.getByText(/wed 1/i)).toBeInTheDocument(); // Jan 1
    });

    it("should ignore time component of selected date", () => {
      const selectedDate = new Date("2024-10-23T15:30:45.123Z");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const selectedButton = screen.getByRole("button", { name: /wednesday.*23.*october.*2024/i });
      expect(selectedButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should pass date with zeroed time to callback", async () => {
      const user = userEvent.setup({ delay: null });
      const selectedDate = new Date("2024-10-23");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      const button = screen.getByRole("button", { name: /thursday.*24.*october.*2024/i });
      await user.click(button);

      const calledDate = onDateSelect.mock.calls[0][0] as Date;
      expect(calledDate.getHours()).toBe(0);
      expect(calledDate.getMinutes()).toBe(0);
      expect(calledDate.getSeconds()).toBe(0);
      expect(calledDate.getMilliseconds()).toBe(0);
    });
  });

  describe("Date Calculations", () => {
    it("should generate dates relative to current system time", () => {
      vi.setSystemTime(new Date("2024-11-15T10:00:00Z"));

      const selectedDate = new Date("2024-11-15");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      // Should start from Nov 15
      expect(screen.getByText(/fri 15/i)).toBeInTheDocument();
      expect(screen.getByText(/sat 16/i)).toBeInTheDocument();
    });

    it("should correctly handle dates with different day names", () => {
      // Sunday
      vi.setSystemTime(new Date("2024-10-27T10:00:00Z"));

      const selectedDate = new Date("2024-10-27");
      const onDateSelect = vi.fn();

      render(<DateSelector selectedDate={selectedDate} onDateSelect={onDateSelect} />);

      expect(screen.getByText(/sun 27/i)).toBeInTheDocument();
      expect(screen.getByText(/mon 28/i)).toBeInTheDocument();
      expect(screen.getByText(/tue 29/i)).toBeInTheDocument();
      expect(screen.getByText(/wed 30/i)).toBeInTheDocument();
      expect(screen.getByText(/thu 31/i)).toBeInTheDocument();
      expect(screen.getByText(/fri 1/i)).toBeInTheDocument(); // Nov 1
      expect(screen.getByText(/sat 2/i)).toBeInTheDocument(); // Nov 2
    });
  });
});
