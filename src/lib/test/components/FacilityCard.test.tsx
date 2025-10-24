/**
 * Unit tests for FacilityCard component
 *
 * Tests cover:
 * - Component rendering with facility data
 * - Navigation link to facility schedule
 * - Accessibility attributes
 * - Hover and focus states
 * - Card layout and styling
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FacilityCard } from "../../../components/FacilityCard";
import type { FacilityViewModel } from "../../../components/views/viewModels";

describe("FacilityCard", () => {
  const mockFacility: FacilityViewModel = {
    id: 1,
    name: "Basketball Court",
  };

  describe("Rendering", () => {
    it("should render facility name", () => {
      render(<FacilityCard facility={mockFacility} />);

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
    });

    it("should render as a link", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("should link to facility schedule page", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/facilities/1");
    });

    it("should render facility name in card title", () => {
      render(<FacilityCard facility={mockFacility} />);

      const cardTitle = document.querySelector('[data-slot="card-title"]');
      expect(cardTitle).toBeInTheDocument();
      expect(cardTitle).toHaveTextContent("Basketball Court");
    });

    it("should render different facility data correctly", () => {
      const facility: FacilityViewModel = {
        id: 42,
        name: "Tennis Court",
      };

      render(<FacilityCard facility={facility} />);

      expect(screen.getByText("Tennis Court")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "/facilities/42");
    });
  });

  describe("Accessibility", () => {
    it("should have keyboard focusable link", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href");
    });

    it("should have focus-visible outline styles", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus-visible:outline-none");
      expect(link).toHaveClass("focus-visible:ring-2");
    });

    // it("should have proper heading hierarchy", () => {
    //   render(<FacilityCard facility={mockFacility} />);

    //   // CardTitle should render as a heading
    //   const heading = screen.getByRole("heading");
    //   expect(heading).toBeInTheDocument();
    // });

    it("should be navigable by screen readers", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain("Basketball Court");
    });
  });

  describe("Styling", () => {
    it("should apply hover transition classes", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("transition-transform");
      expect(link).toHaveClass("hover:scale-105");
    });

    it("should have rounded corners", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("rounded-lg");
    });

    it("should render as a block-level element", () => {
      render(<FacilityCard facility={mockFacility} />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("block");
    });
  });

  describe("Edge Cases", () => {
    it("should handle facility with single character name", () => {
      const facility: FacilityViewModel = {
        id: 1,
        name: "A",
      };

      render(<FacilityCard facility={facility} />);

      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("should handle facility with very long name", () => {
      const facility: FacilityViewModel = {
        id: 1,
        name: "Super Ultra Mega Awesome Basketball and Volleyball Multi-Purpose Sports Facility",
      };

      render(<FacilityCard facility={facility} />);

      expect(
        screen.getByText("Super Ultra Mega Awesome Basketball and Volleyball Multi-Purpose Sports Facility")
      ).toBeInTheDocument();
    });

    it("should handle facility with special characters in name", () => {
      const facility: FacilityViewModel = {
        id: 1,
        name: "Court #1 - VIP & Premium",
      };

      render(<FacilityCard facility={facility} />);

      expect(screen.getByText("Court #1 - VIP & Premium")).toBeInTheDocument();
    });

    it("should handle facility with ID 0", () => {
      const facility: FacilityViewModel = {
        id: 0,
        name: "Test Facility",
      };

      render(<FacilityCard facility={facility} />);

      expect(screen.getByRole("link")).toHaveAttribute("href", "/facilities/0");
    });

    it("should handle large facility ID", () => {
      const facility: FacilityViewModel = {
        id: 999999,
        name: "Test Facility",
      };

      render(<FacilityCard facility={facility} />);

      expect(screen.getByRole("link")).toHaveAttribute("href", "/facilities/999999");
    });
  });

  describe("Multiple Instances", () => {
    it("should render multiple cards with different data", () => {
      const facilities: FacilityViewModel[] = [
        { id: 1, name: "Basketball Court" },
        { id: 2, name: "Tennis Court" },
        { id: 3, name: "Swimming Pool" },
      ];

      const { container } = render(
        <div>
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      );

      expect(screen.getByText("Basketball Court")).toBeInTheDocument();
      expect(screen.getByText("Tennis Court")).toBeInTheDocument();
      expect(screen.getByText("Swimming Pool")).toBeInTheDocument();

      const links = container.querySelectorAll("a");
      expect(links).toHaveLength(3);
    });
  });
});
