/**
 * UserCancelReservationDialog - Simple confirmation dialog for users canceling their own reservations
 *
 * Unlike the admin CancelReservationDialog, this version doesn't require a cancellation reason.
 */

import type { ReservationViewModel } from "./views/viewModels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface UserCancelReservationDialogProps {
  isOpen: boolean;
  reservation: ReservationViewModel | null;
  onConfirm: (reservationId: number) => Promise<void>;
  onClose: () => void;
}

export default function UserCancelReservationDialog({
  isOpen,
  reservation,
  onConfirm,
  onClose,
}: UserCancelReservationDialogProps) {
  if (!reservation) {
    return null;
  }

  const handleConfirm = async () => {
    await onConfirm(reservation.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl flex items-center gap-2">
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
            Cancel Reservation
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            Are you sure you want to cancel your reservation at <strong>{reservation.facilityName}</strong> on{" "}
            <strong>{reservation.date}</strong> from <strong>{reservation.startTime}</strong> to{" "}
            <strong>{reservation.endTime}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mt-2">
          <p className="text-sm font-medium text-destructive">This action cannot be undone.</p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
          <AlertDialogCancel onClick={onClose}>Keep Reservation</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Cancel Reservation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
