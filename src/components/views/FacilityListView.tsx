import { useFacilities } from "../hooks/useFacilities";
import { FacilityCard } from "../FacilityCard";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Main view component for displaying the list of facilities
 *
 * Manages all view states:
 * - Loading: Displays skeleton loaders
 * - Error: Shows error message
 * - Empty: Displays "no facilities" message
 * - Success: Renders grid of facility cards
 *
 * This is the entry point for the facility selection workflow.
 */
export function FacilityListView() {
  const { data, isLoading, error } = useFacilities();

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Available Facilities</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-[120px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Available Facilities</h1>
        <div className="rounded-lg border-2 border-destructive bg-destructive/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Facilities</h2>
          <p className="text-muted-foreground max-w-md mx-auto">An unexpected error occurred</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Available Facilities</h1>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No Facilities Available</h2>
            <p className="text-muted-foreground">
              There are currently no facilities to display. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render facility cards
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl" data-testid="facility-list-view">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Available Facilities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="facility-grid">
        {data.map((facility, index) => (
          <FacilityCard key={facility.id} facility={facility} index={index} />
        ))}
      </div>
    </div>
  );
}
