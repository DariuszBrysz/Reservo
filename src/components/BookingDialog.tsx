/**
 * BookingDialog - Modal dialog for creating a new reservation
 *
 * Allows users to select a duration for their booking and confirm the reservation.
 * Dynamically calculates available durations to prevent bookings that extend past
 * closing time (22:00) or overlap with existing reservations.
 */

import { useState, useEffect } from "react";
import type { CreateReservationCommand } from "../types";
import type { TimeSlotViewModel } from "./views/viewModels";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface BookingDialogProps {
  isOpen: boolean;
  startTime: Date | null;
  facilityId: number;
  timeSlots: TimeSlotViewModel[];
  onConfirm: (command: CreateReservationCommand) => Promise<void>;
  onCancel: () => void;
}

/**
 * Converts duration in minutes to ISO 8601 duration format (HH:MM:SS)
 */
function formatDurationToISO(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
}

/**
 * Formats minutes to human-readable string (e.g., "1 hour 30 minutes")
 */
function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minutes`;
  }
  if (mins === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minutes`;
}

/**
 * Calculates available duration options based on facility closing time and existing reservations
 */
function calculateAvailableDurations(startTime: Date, timeSlots: TimeSlotViewModel[]): number[] {
  const durations: number[] = [];
  const closingTime = new Date(startTime);
  closingTime.setUTCHours(22, 0, 0, 0);

  // Find the next booked slot after the start time
  const nextBookedSlot = timeSlots.find((slot) => slot.status === "booked" && slot.startTime > startTime);

  // Minimum 30 minutes, maximum 3 hours (180 minutes), in 15-minute increments
  const minDuration = 30;
  const maxDuration = 180;
  const increment = 15;

  for (let duration = minDuration; duration <= maxDuration; duration += increment) {
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Check if end time is within operating hours
    if (endTime > closingTime) {
      break;
    }

    // Check if duration would overlap with next reservation
    if (nextBookedSlot && endTime > nextBookedSlot.startTime) {
      break;
    }

    durations.push(duration);
  }

  return durations;
}

export default function BookingDialog({
  isOpen,
  startTime,
  facilityId,
  timeSlots,
  onConfirm,
  onCancel,
}: BookingDialogProps) {
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate available durations when dialog opens or start time changes
  const availableDurations = startTime ? calculateAvailableDurations(startTime, timeSlots) : [];

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDuration("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!startTime) {
    return null;
  }

  const handleConfirm = async () => {
    if (!selectedDuration) {
      setError("Please select a duration");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const durationMinutes = parseInt(selectedDuration, 10);
      const command: CreateReservationCommand = {
        facility_id: facilityId,
        start_time: startTime.toISOString(),
        duration: formatDurationToISO(durationMinutes),
      };

      await onConfirm(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reservation");
      setIsSubmitting(false);
    }
  };

  const startTimeStr = startTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = selectedDuration ? new Date(startTime.getTime() + parseInt(selectedDuration, 10) * 60000) : null;

  const endTimeStr = endTime
    ? endTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
      <DialogContent className="sm:max-w-[425px]" data-testid="booking-dialog">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>Select the duration for your reservation starting at {startTimeStr}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration} disabled={isSubmitting}>
              <SelectTrigger
                id="duration"
                aria-label="Select reservation duration"
                data-testid="duration-select-trigger"
              >
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent data-testid="duration-select-content">
                {availableDurations.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No available durations</div>
                ) : (
                  availableDurations.map((duration, index) => (
                    <SelectItem key={duration} value={duration.toString()} data-testid={`duration-option-${index}`}>
                      {formatDurationLabel(duration)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start time:</span>
              <span className="font-medium">{startTimeStr}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">End time:</span>
              <span className="font-medium">{endTimeStr}</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive" role="alert" data-testid="booking-error-message">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} data-testid="booking-cancel-button">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDuration || isSubmitting}
            data-testid="booking-confirm-button"
          >
            {isSubmitting ? "Creating..." : "Confirm Reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
