/**
 * CancelReservationDialog - Confirmation dialog for canceling reservations
 *
 * Admin-only component that displays a confirmation dialog with an optional
 * text area for providing a cancellation reason.
 */

import { useState, useEffect } from "react";
import type { UpdateReservationCommand } from "../types";
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
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface CancelReservationDialogProps {
  isOpen: boolean;
  onConfirm: (command: UpdateReservationCommand) => Promise<void>;
  onCancel: () => void;
}

const MAX_REASON_LENGTH = 500;

export default function CancelReservationDialog({ isOpen, onConfirm, onCancel }: CancelReservationDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const command: UpdateReservationCommand = {
        status: "canceled",
        cancellation_message: reason.trim() || undefined,
      };

      await onConfirm(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel reservation");
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_REASON_LENGTH - reason.length;
  const isReasonTooLong = reason.length > MAX_REASON_LENGTH;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="cancellation-reason">
            Cancellation Reason <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="cancellation-reason"
            placeholder="Provide a reason for cancellation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[100px]"
            aria-describedby="char-count"
          />
          <div id="char-count" className={`text-xs ${isReasonTooLong ? "text-destructive" : "text-muted-foreground"}`}>
            {remainingChars} characters remaining
          </div>

          {error && (
            <div className="text-sm text-destructive" role="alert">
              {error}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isSubmitting}>
            Keep Reservation
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting || isReasonTooLong}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? "Canceling..." : "Cancel Reservation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
