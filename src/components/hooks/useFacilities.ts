import { useState, useEffect } from "react";
import type { FacilityListDTO } from "@/types";
import type { FacilityViewModel } from "../views/viewModels";

/**
 * Custom hook for fetching and managing facility list data
 *
 * Handles the complete lifecycle of fetching facilities from the API:
 * - Manages loading, error, and success states
 * - Transforms DTOs to ViewModels
 * - Provides a clean interface for components
 *
 * @returns Object containing data, loading state, and error state
 */
export function useFacilities() {
  const [data, setData] = useState<FacilityViewModel[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/facilities");

        if (!response.ok) {
          throw new Error(`Failed to fetch facilities: ${response.status} ${response.statusText}`);
        }

        const result: FacilityListDTO = await response.json();

        // Transform DTOs to ViewModels
        const viewModels: FacilityViewModel[] = result.facilities.map((facility) => ({
          id: facility.id,
          name: facility.name,
        }));

        setData(viewModels);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred while fetching facilities"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  return { data, isLoading, error };
}
