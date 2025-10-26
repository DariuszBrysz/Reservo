/**
 * EditReservationDialog - Dialog for editing reservation duration
 *
 * Allows users to change the duration of their reservation within valid constraints.
 */

import { useState, useEffect } from "react";
import type { ReservationViewModel } from "./views/viewModels";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface EditReservationDialogProps {
  isOpen: boolean;
  reservation: ReservationViewModel | null;
  onSave: (reservationId: number, newDuration: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Calculate valid duration options for a reservation
 * Rules:
 * - Minimum: 30 minutes (00:30:00)
 * - Maximum: 3 hours (03:00:00)
 * - Increments: 15 minutes
 * - Must not extend beyond 22:00 facility closing time
 */
function calculateValidDurations(startTime: Date): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const closingTime = new Date(startTime);
  closingTime.setUTCHours(22, 0, 0, 0);

  // Generate options from 30 minutes to 3 hours in 15-minute increments
  for (let minutes = 30; minutes <= 180; minutes += 15) {
    const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

    // Check if end time exceeds closing time
    if (endTime > closingTime) {
      break;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const duration = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
    const label = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}m`;

    options.push({ value: duration, label });
  }

  return options;
}

export default function EditReservationDialog({ isOpen, reservation, onSave, onClose }: EditReservationDialogProps) {
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validDurations, setValidDurations] = useState<{ value: string; label: string }[]>([]);

  // Reset state when dialog opens/closes or reservation changes
  useEffect(() => {
    if (isOpen && reservation) {
      const durations = calculateValidDurations(reservation.originalStartTime);
      setValidDurations(durations);
      setSelectedDuration(reservation.originalDuration);
      setIsSubmitting(false);
    } else {
      setValidDurations([]);
      setSelectedDuration("");
      setIsSubmitting(false);
    }
  }, [isOpen, reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservation || !selectedDuration) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(reservation.id, selectedDuration);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!reservation) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Reservation Duration</DialogTitle>
          <DialogDescription className="text-base">
            Change the duration of your reservation at <strong>{reservation.facilityName}</strong> on {reservation.date}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="duration" className="text-sm font-semibold">
                New Duration
              </Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration} disabled={isSubmitting}>
                <SelectTrigger id="duration" className="h-11">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {validDurations.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Time Slot</p>
              <p className="text-base font-semibold">
                {reservation.startTime} - {reservation.endTime}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedDuration === reservation.originalDuration}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
