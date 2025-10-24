/**
 * Unit tests for FacilityListView component
 *
 * Tests cover:
 * - Loading state with skeleton loaders
 * - Success state with facility cards
 * - Error state with error message
 * - Empty state (no facilities)
 * - Integration with useFacilities hook
 * - Accessibility and semantic HTML
 *
 * Test scenarios from test-plan.md:
 * - FAC-001: User can view list of all available facilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FacilityListView } from "../../../../components/views/FacilityListView";
import * as useFacilitiesModule from "../../../../components/hooks/useFacilities";
import type { FacilityViewModel } from "../../../../components/views/viewModels";

// Mock the useFacilities hook
vi.mock("../../../../components/hooks/useFacilities");

describe("FacilityListView", () => {
  const mockUseFacilities = vi.mocked(useFacilitiesModule.useFacilities);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display skeleton loaders while loading", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<FacilityListView />);

      expect(screen.getByText("Available Facilities")).toBeInTheDocument();

      // Check for skeleton loaders (they should not have real content)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should display heading during loading", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<FacilityListView />);

      const heading = screen.getByRole("heading", { name: /available facilities/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });

    it("should display 6 skeleton loaders", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const skeletons = container.querySelectorAll(".h-\\[120px\\]");
      expect(skeletons).toHaveLength(6);
    });

    it("should use grid layout for skeletons", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
    });
  });

  describe("Success State - FAC-001", () => {
    it("should display list of facilities when data is loaded", () => {
      const mockFacilities: FacilityViewModel[] = [
        { id: 1, name: "Basketball Court" },
        { id: 2, name: "Tennis Court" },
        { id: 3, name: "Swimming Pool" },
      ];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      expect(screen.getByText("Tennis Court")).toBeInTheDocument();
      expect(screen.getByText("Swimming Pool")).toBeInTheDocument();
    });

    it("should render facility cards in a grid", () => {
      const mockFacilities: FacilityViewModel[] = [
        { id: 1, name: "Basketball Court" },
        { id: 2, name: "Tennis Court" },
      ];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(2);
    });

    it("should display heading in success state", () => {
      const mockFacilities: FacilityViewModel[] = [{ id: 1, name: "Basketball Court" }];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      const heading = screen.getByRole("heading", { name: /available facilities/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });

    it("should render clickable links for each facility", () => {
      const mockFacilities: FacilityViewModel[] = [
        { id: 1, name: "Basketball Court" },
        { id: 2, name: "Tennis Court" },
      ];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute("href", "/facilities/1");
      expect(links[1]).toHaveAttribute("href", "/facilities/2");
    });

    it("should handle single facility", () => {
      const mockFacilities: FacilityViewModel[] = [{ id: 1, name: "Basketball Court" }];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(1);
    });

    it("should handle many facilities", () => {
      const mockFacilities: FacilityViewModel[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Facility ${i + 1}`,
      }));

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(10);
    });

    it("should use consistent layout with max-width container", () => {
      const mockFacilities: FacilityViewModel[] = [{ id: 1, name: "Basketball Court" }];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const mainContainer = container.querySelector(".max-w-5xl");
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when fetch fails", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch facilities"),
      });

      render(<FacilityListView />);

      expect(screen.getByText(/error loading facilities/i)).toBeInTheDocument();
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });

    it("should display heading in error state", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Network error"),
      });

      render(<FacilityListView />);

      const heading = screen.getByRole("heading", { name: /available facilities/i, level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("should display error icon", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      const { container } = render(<FacilityListView />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should style error state distinctively", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      const { container } = render(<FacilityListView />);

      const errorBox = container.querySelector(".border-destructive");
      expect(errorBox).toBeInTheDocument();
    });

    it("should not show facility cards when there is an error", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<FacilityListView />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should handle different error types", () => {
      const errors = [new Error("Network error"), new Error("500 Internal Server Error"), new Error("Timeout")];

      errors.forEach((error) => {
        mockUseFacilities.mockReturnValue({
          data: null,
          isLoading: false,
          error,
        });

        const { unmount } = render(<FacilityListView />);

        expect(screen.getByText(/error loading facilities/i)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no facilities exist", () => {
      mockUseFacilities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      expect(screen.getByText(/no facilities available/i)).toBeInTheDocument();
      expect(screen.getByText(/there are currently no facilities to display/i)).toBeInTheDocument();
    });

    it("should display heading in empty state", () => {
      mockUseFacilities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      const heading = screen.getByRole("heading", { name: /available facilities/i, level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("should display empty state icon", () => {
      mockUseFacilities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should not display error styling in empty state", () => {
      mockUseFacilities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const errorBox = container.querySelector(".border-destructive");
      expect(errorBox).not.toBeInTheDocument();
    });

    it("should handle null data as empty", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      expect(screen.getByText(/no facilities available/i)).toBeInTheDocument();
    });
  });

  describe("State Transitions", () => {
    it("should transition from loading to success", async () => {
      const mockFacilities: FacilityViewModel[] = [{ id: 1, name: "Basketball Court" }];

      // Start with loading
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<FacilityListView />);

      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

      // Transition to success
      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      rerender(<FacilityListView />);

      await waitFor(() => {
        expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      });
      expect(document.querySelector(".animate-pulse")).not.toBeInTheDocument();
    });

    it("should transition from loading to error", async () => {
      // Start with loading
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<FacilityListView />);

      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

      // Transition to error
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      rerender(<FacilityListView />);

      await waitFor(() => {
        expect(screen.getByText(/error loading facilities/i)).toBeInTheDocument();
      });
    });

    it("should transition from loading to empty", async () => {
      // Start with loading
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<FacilityListView />);

      // Transition to empty
      mockUseFacilities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      rerender(<FacilityListView />);

      await waitFor(() => {
        expect(screen.getByText(/no facilities available/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      mockUseFacilities.mockReturnValue({
        data: [{ id: 1, name: "Basketball Court" }],
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent(/available facilities/i);
    });

    it("should have proper heading structure in all states", () => {
      const states = [
        { data: null, isLoading: true, error: null },
        { data: [], isLoading: false, error: null },
        { data: null, isLoading: false, error: new Error("Error") },
        { data: [{ id: 1, name: "Test" }], isLoading: false, error: null },
      ];

      states.forEach((state) => {
        mockUseFacilities.mockReturnValue(state);
        const { unmount } = render(<FacilityListView />);

        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toBeInTheDocument();

        unmount();
      });
    });

    it("should use semantic HTML for error icon", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed"),
      });

      const { container } = render(<FacilityListView />);

      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should use semantic HTML for empty state icon", () => {
      mockUseFacilities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Layout and Styling", () => {
    it("should use consistent container styling", () => {
      mockUseFacilities.mockReturnValue({
        data: [{ id: 1, name: "Basketball Court" }],
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const mainContainer = container.querySelector(".container");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("mx-auto");
      expect(mainContainer).toHaveClass("px-4");
      expect(mainContainer).toHaveClass("py-8");
    });

    it("should use responsive grid layout", () => {
      mockUseFacilities.mockReturnValue({
        data: [{ id: 1, name: "Basketball Court" }],
        isLoading: false,
        error: null,
      });

      const { container } = render(<FacilityListView />);

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
      expect(grid).toHaveClass("gap-6");
    });

    it("should have consistent spacing in all states", () => {
      const states = [
        { data: [{ id: 1, name: "Test" }], isLoading: false, error: null },
        { data: [], isLoading: false, error: null },
        { data: null, isLoading: false, error: new Error("Error") },
      ];

      states.forEach((state) => {
        mockUseFacilities.mockReturnValue(state);
        const { container, unmount } = render(<FacilityListView />);

        const mainContainer = container.querySelector(".container");
        expect(mainContainer).toHaveClass("py-8");

        unmount();
      });
    });
  });

  describe("Integration with useFacilities Hook", () => {
    it("should call useFacilities hook", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<FacilityListView />);

      expect(mockUseFacilities).toHaveBeenCalledTimes(1);
    });

    it("should use data from useFacilities hook", () => {
      const mockFacilities: FacilityViewModel[] = [{ id: 42, name: "Special Facility" }];

      mockUseFacilities.mockReturnValue({
        data: mockFacilities,
        isLoading: false,
        error: null,
      });

      render(<FacilityListView />);

      expect(screen.getByText("Special Facility")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "/facilities/42");
    });

    it("should respond to hook state changes", () => {
      mockUseFacilities.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<FacilityListView />);

      mockUseFacilities.mockReturnValue({
        data: [{ id: 1, name: "Test Facility" }],
        isLoading: false,
        error: null,
      });

      rerender(<FacilityListView />);

      expect(screen.getByText("Test Facility")).toBeInTheDocument();
    });
  });
});
