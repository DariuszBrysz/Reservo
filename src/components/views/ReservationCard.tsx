/**
 * ReservationCard - Displays a single reservation
 *
 * Shows reservation details with conditional action buttons based on status and time.
 */

import type { ReservationViewModel } from "./viewModels";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface ReservationCardProps {
  reservation: ReservationViewModel;
  onEdit: (reservation: ReservationViewModel) => void;
  onCancel: (reservation: ReservationViewModel) => void;
  onExport: (reservationId: number) => void;
}

export default function ReservationCard({ reservation, onEdit, onCancel, onExport }: ReservationCardProps) {
  const showActions = reservation.isEditable || reservation.isCancelable;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl font-semibold">{reservation.facilityName}</CardTitle>
          <span
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
              reservation.status === "Confirmed"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {reservation.status}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="font-semibold text-foreground">{reservation.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <p className="font-semibold text-foreground">
                {reservation.startTime} - {reservation.endTime}
              </p>
            </div>
          </div>
        </div>

        {reservation.cancellationMessage && (
          <>
            <Separator />
            <div className="rounded-md p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Cancellation Reason</p>
              <p className="text-sm text-foreground leading-relaxed">{reservation.cancellationMessage}</p>
            </div>
          </>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {reservation.isEditable && (
              <Button variant="outline" onClick={() => onEdit(reservation)} className="gap-2 flex-1 sm:flex-initial">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="hidden sm:inline">Edit Duration</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
            {reservation.isCancelable && (
              <Button
                variant="destructive"
                onClick={() => onCancel(reservation)}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </Button>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => onExport(reservation.id)}
            className="gap-2 w-full sm:w-auto sm:ml-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export to Calendar
          </Button>
        </CardFooter>
      )}

      {!showActions && reservation.status === "Confirmed" && (
        <CardFooter>
          <Button
            variant="secondary"
            onClick={() => onExport(reservation.id)}
            className="ml-auto gap-2 w-full sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export to Calendar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
