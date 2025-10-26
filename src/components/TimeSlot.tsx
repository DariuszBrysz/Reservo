/**
 * TimeSlot - Component representing a single 15-minute time slot
 *
 * Displays a time slot in the schedule with different appearances based on its status
 * (available or booked). For booked slots, shows reservation details and allows
 * administrators to cancel the reservation.
 */

import type { TimeSlotViewModel } from "./views/viewModels";
import type { AppRole } from "../types";
import { Button } from "./ui/button";

interface TimeSlotProps {
  timeSlot: TimeSlotViewModel;
  userRole: AppRole;
  onSelect: () => void;
  onCancel: (reservationId: number) => void;
  index?: number;
}

/**
 * Formats a Date object to time string (e.g., "14:00")
 */
function formatTime(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function TimeSlot({ timeSlot, userRole, onSelect, onCancel, index }: TimeSlotProps) {
  const { startTime, endTime, status, reservation } = timeSlot;
  const isAvailable = status === "available";
  const isBooked = status === "booked";
  const isAdmin = userRole === "admin";

  const startTimeStr = formatTime(startTime);
  const endTimeStr = formatTime(endTime);

  // Available slot - clickable to book
  if (isAvailable) {
    return (
      <button
        onClick={onSelect}
        className="w-full p-3 text-left border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Book time slot from ${startTimeStr} to ${endTimeStr}`}
        data-testid={`time-slot-available-${index !== undefined ? index : startTimeStr}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {startTimeStr} - {endTimeStr}
          </span>
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
      </button>
    );
  }

  // Booked slot - non-interactive for users, shows details
  if (isBooked && reservation) {
    const resStartTime = formatTime(new Date(reservation.start_time));
    const resEndTime = formatTime(new Date(reservation.end_time));

    return (
      <div
        className="w-full p-3 border-2 border-primary bg-primary/10 rounded-lg"
        aria-label={`Booked time slot from ${resStartTime} to ${resEndTime}`}
        data-testid={`time-slot-booked-${index !== undefined ? index : resStartTime}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">
              {resStartTime} - {resEndTime}
            </div>
            {isAdmin && reservation.user && (
              <div className="text-xs text-muted-foreground mt-1 truncate">{reservation.user.email}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Status: {reservation.status}</div>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(reservation.id);
              }}
              aria-label={`Cancel reservation for ${reservation.user?.email || "user"}`}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Fallback (should not happen)
  return null;
}
