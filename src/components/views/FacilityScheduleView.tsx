/**
 * FacilityScheduleView - Main container component for the facility schedule view
 *
 * This component orchestrates the entire schedule interface, managing state through
 * the useFacilitySchedule hook and rendering child components for date selection,
 * schedule display, and booking/cancellation dialogs.
 */

import { toast } from "sonner";
import { useFacilitySchedule } from "../hooks/useFacilitySchedule";
import { Skeleton } from "../ui/skeleton";
import DateSelector from "../DateSelector";
import ScheduleView from "../ScheduleView";
import BookingDialog from "../BookingDialog";
import CancelReservationDialog from "../CancelReservationDialog";

interface FacilityScheduleViewProps {
  facilityId: number;
}

export default function FacilityScheduleView({ facilityId }: FacilityScheduleViewProps) {
  const {
    schedule,
    isLoading,
    error,
    userRole,
    selectedDate,
    setSelectedDate,
    bookingState,
    openBookingDialog,
    cancelState,
    openCancelDialog,
    createReservation,
    cancelReservation,
    closeDialogs,
  } = useFacilitySchedule(facilityId);

  // Handle booking confirmation with error handling
  const handleBookingConfirm = async (command: Parameters<typeof createReservation>[0]) => {
    try {
      await createReservation(command);
      toast.success("Reservation created successfully!");
    } catch (err) {
      if (err instanceof Error && err.message === "CONFLICT") {
        toast.error("Sorry, this time slot is no longer available. Please select another time.");
      } else {
        toast.error("Failed to create reservation. Please try again.");
      }
      throw err;
    }
  };

  // Handle cancellation confirmation with error handling
  const handleCancelConfirm = async (command: Parameters<typeof cancelReservation>[0]) => {
    try {
      await cancelReservation(command);
      toast.success("Reservation canceled successfully");
    } catch (err) {
      toast.error("Failed to cancel reservation. Please try again.");
      throw err;
    }
  };

  // Handle initial loading state
  if (isLoading && !schedule) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !schedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Failed to Load Schedule</h2>
          <p className="text-muted-foreground">An unexpected error occurred</p>
        </div>
      </div>
    );
  }

  // Handle case where schedule data doesn't exist
  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No schedule data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
      {/* Facility name header */}
      <header>
        <h1 className="text-4xl font-bold tracking-tight">{schedule.facility.name}</h1>
      </header>

      {/* Date selector */}
      <section aria-label="Date selection">
        <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </section>

      {/* Schedule view with loading state */}
      <section aria-label="Schedule timeline">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <ScheduleView
            timeSlots={schedule.timeSlots}
            userRole={userRole}
            onTimeSlotSelect={openBookingDialog}
            onCancelReservation={openCancelDialog}
          />
        )}
      </section>

      {/* Booking dialog */}
      <BookingDialog
        isOpen={bookingState.isOpen}
        startTime={bookingState.startTime}
        facilityId={facilityId}
        timeSlots={schedule.timeSlots}
        onConfirm={handleBookingConfirm}
        onCancel={closeDialogs}
      />

      {/* Cancellation dialog */}
      <CancelReservationDialog isOpen={cancelState.isOpen} onConfirm={handleCancelConfirm} onCancel={closeDialogs} />
    </div>
  );
}
