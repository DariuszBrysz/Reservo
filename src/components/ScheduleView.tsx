/**
 * ScheduleView - Component that renders the complete daily timeline
 *
 * Displays a vertical list of all time slots for the selected day,
 * delegating rendering of individual slots to the TimeSlot component.
 */

import TimeSlot from "./TimeSlot";
import type { TimeSlotViewModel } from "./views/viewModels";
import type { AppRole } from "../types";

interface ScheduleViewProps {
  timeSlots: TimeSlotViewModel[];
  userRole: AppRole;
  onTimeSlotSelect: (startTime: Date) => void;
  onCancelReservation: (reservationId: number) => void;
}

export default function ScheduleView({
  timeSlots,
  userRole,
  onTimeSlotSelect,
  onCancelReservation,
}: ScheduleViewProps) {
  if (timeSlots.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No time slots available for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Daily schedule timeline" data-testid="schedule-view">
      {timeSlots.map((timeSlot, index) => (
        <div key={`${timeSlot.startTime.toISOString()}-${index}`} role="listitem">
          <TimeSlot
            timeSlot={timeSlot}
            userRole={userRole}
            onSelect={() => onTimeSlotSelect(timeSlot.startTime)}
            onCancel={onCancelReservation}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}
