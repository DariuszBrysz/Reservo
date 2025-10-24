/**
 * Unit tests for useFacilities hook
 *
 * Tests cover:
 * - Initial loading state
 * - Successful data fetching and transformation
 * - Error handling for failed API requests
 * - Error handling for network failures
 * - Empty facility list handling
 * - DTO to ViewModel transformation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFacilities } from "../../../../components/hooks/useFacilities";
import type { FacilityListDTO } from "@/types";
import type { FacilityViewModel } from "@/components/views/viewModels";

describe("useFacilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should start with loading state", () => {
      // Mock fetch to never resolve
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise(() => {
            // Intentionally empty - promise never resolves to test loading state
          })
      );

      const { result } = renderHook(() => useFacilities());

      expect(result.current.isLoading, "Hook should start in loading state").toBe(true);
      expect(result.current.data, "Data should be null initially").toBeNull();
      expect(result.current.error, "Error should be null initially").toBeNull();
    });
  });

  describe("Successful Data Fetching", () => {
    it("should fetch and transform facilities successfully", async () => {
      const mockFacilities: FacilityListDTO = {
        facilities: [
          {
            id: 1,
            name: "Basketball Court",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
          {
            id: 2,
            name: "Tennis Court",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
          {
            id: 3,
            name: "Swimming Pool",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities,
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading, "Loading should complete after fetch").toBe(false);
      });

      expect(result.current.data, "Should return transformed facility data").toMatchInlineSnapshot(`
        [
          {
            "id": 1,
            "name": "Basketball Court",
          },
          {
            "id": 2,
            "name": "Tennis Court",
          },
          {
            "id": 3,
            "name": "Swimming Pool",
          },
        ]
      `);
      expect(result.current.error, "Error should be null on successful fetch").toBeNull();
    });

    it("should call the correct API endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ facilities: [] }),
      });
      vi.stubGlobal("fetch", mockFetch);

      renderHook(() => useFacilities());

      await waitFor(() => {
        expect(mockFetch, "Should call the correct facilities API endpoint").toHaveBeenCalledWith("/api/facilities");
      });
    });

    it("should handle empty facility list", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ facilities: [] }),
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should transform DTOs to ViewModels correctly", async () => {
      const mockFacilities: FacilityListDTO = {
        facilities: [
          {
            id: 42,
            name: "Volleyball Court",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities,
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toMatchInlineSnapshot(`
        [
          {
            "id": 42,
            "name": "Volleyball Court",
          },
        ]
      `);

      // Verify that created_at is not included in ViewModel
      expect(result.current.data?.[0]).not.toHaveProperty("created_at");
    });
  });

  describe("Error Handling", () => {
    it("should handle HTTP error responses", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading, "Loading should complete after failed fetch").toBe(false);
      });

      expect(result.current.data, "Data should be null on error").toBeNull();
      expect(result.current.error, "Error should be set on HTTP failure").toBeInstanceOf(Error);
      expect(result.current.error?.message, "Error message should contain failure description").toContain(
        "Failed to fetch facilities"
      );
      expect(result.current.error?.message, "Error message should contain HTTP status code").toContain("500");
    });

    it("should handle 404 Not Found error", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toContain("404");
      expect(result.current.error?.message).toContain("Not Found");
    });

    it("should handle network errors", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network request failed"));

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Network request failed");
    });

    it("should handle non-Error exceptions gracefully", async () => {
      vi.mocked(fetch).mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("An unknown error occurred while fetching facilities");
    });

    it("should handle JSON parsing errors", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe("Invalid JSON");
    });
  });

  describe("State Management", () => {
    it("should set loading to true during fetch", async () => {
      let resolvePromise!: (value: unknown) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(fetch).mockReturnValueOnce(controlledPromise as Promise<Response>);

      const { result } = renderHook(() => useFacilities());

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();

      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({ facilities: [] }),
      } as Response);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should clear error state before new fetch", async () => {
      // First fetch fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error("First error"));

      const { result, rerender } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      // Simulate a new fetch by remounting
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ facilities: [] }),
      } as Response);

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set loading to false after error", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Fetch failed"));

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("Data Transformation", () => {
    it("should only include id and name in ViewModels", async () => {
      const mockFacilities: FacilityListDTO = {
        facilities: [
          {
            id: 1,
            name: "Test Facility",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities,
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const facility = result.current.data?.[0];
      expect(facility).toMatchInlineSnapshot(`
        {
          "id": 1,
          "name": "Test Facility",
        }
      `);
      expect(Object.keys(facility as FacilityViewModel)).toHaveLength(2);
    });

    it("should handle multiple facilities correctly", async () => {
      const mockFacilities: FacilityListDTO = {
        facilities: [
          {
            id: 1,
            name: "Facility 1",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
          {
            id: 2,
            name: "Facility 2",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
          {
            id: 3,
            name: "Facility 3",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
          {
            id: 4,
            name: "Facility 4",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
          {
            id: 5,
            name: "Facility 5",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities,
      } as Response);

      const { result } = renderHook(() => useFacilities());

      await waitFor(() => {
        expect(result.current.data).toHaveLength(5);
      });

      expect(result.current.data?.map((f) => f.id)).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
