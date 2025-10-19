/**
 * ReservationList - Displays a list of reservations
 *
 * Stateless component that renders reservation cards or an empty state message.
 */

import type { ReservationViewModel } from "./viewModels";
import ReservationCard from "./ReservationCard";

interface ReservationListProps {
  reservations: ReservationViewModel[];
  onEdit: (reservation: ReservationViewModel) => void;
  onCancel: (reservation: ReservationViewModel) => void;
  onExport: (reservationId: number) => void;
  emptyMessage: string;
}

export default function ReservationList({
  reservations,
  onEdit,
  onCancel,
  onExport,
  emptyMessage,
}: ReservationListProps) {
  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          onEdit={onEdit}
          onCancel={onCancel}
          onExport={onExport}
        />
      ))}
    </div>
  );
}
