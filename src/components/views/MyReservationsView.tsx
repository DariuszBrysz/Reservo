/**
 * MyReservationsView - Main view component for My Reservations page
 *
 * Displays user's reservations organized in tabs: Upcoming, Past, and Canceled.
 * Manages dialogs for editing and canceling reservations.
 */

import { useState } from "react";
import { toast } from "sonner";
import { useMyReservations } from "../hooks/useMyReservations";
import type { ReservationViewModel } from "./viewModels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ReservationList from "./ReservationList";
import EditReservationDialog from "../EditReservationDialog";
import UserCancelReservationDialog from "../UserCancelReservationDialog";
import { Skeleton } from "../ui/skeleton";

export default function MyReservationsView() {
  const {
    upcomingReservations,
    pastReservations,
    canceledReservations,
    isLoading,
    error,
    updateDuration,
    cancel,
    exportToIcs,
  } = useMyReservations();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationViewModel | null>(null);

  // Handle edit button click
  const handleEdit = (reservation: ReservationViewModel) => {
    setSelectedReservation(reservation);
    setEditDialogOpen(true);
  };

  // Handle cancel button click
  const handleCancel = (reservation: ReservationViewModel) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  // Handle save from edit dialog
  const handleSaveDuration = async (reservationId: number, newDuration: string) => {
    try {
      await updateDuration(reservationId, newDuration);
      toast.success("Reservation updated successfully");
      setEditDialogOpen(false);
      setSelectedReservation(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update reservation");
    }
  };

  // Handle confirm from cancel dialog
  const handleConfirmCancel = async (reservationId: number) => {
    try {
      await cancel(reservationId);
      toast.success("Reservation canceled successfully");
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel reservation");
    }
  };

  // Handle export
  const handleExport = (reservationId: number) => {
    exportToIcs(reservationId);
    toast.success("Downloading reservation as .ics file");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Reservations</h1>
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
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Reservations</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-4xl font-bold tracking-tight mb-2">My Reservations</h1>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
          >
            <span className="hidden sm:inline">Upcoming</span>
            <span className="sm:hidden">Up</span>
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-background/20 px-2 py-0.5 text-xs font-semibold">
              {upcomingReservations.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
          >
            <span className="hidden sm:inline">Past</span>
            <span className="sm:hidden">Pa</span>
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-background/20 px-2 py-0.5 text-xs font-semibold">
              {pastReservations.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="canceled"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
          >
            <span className="hidden sm:inline">Canceled</span>
            <span className="sm:hidden">Can</span>
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-background/20 px-2 py-0.5 text-xs font-semibold">
              {canceledReservations.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <ReservationList
            reservations={upcomingReservations}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onExport={handleExport}
            emptyMessage="You have no upcoming reservations."
          />
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <ReservationList
            reservations={pastReservations}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onExport={handleExport}
            emptyMessage="You have no past reservations."
          />
        </TabsContent>

        <TabsContent value="canceled" className="mt-6">
          <ReservationList
            reservations={canceledReservations}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onExport={handleExport}
            emptyMessage="You have no canceled reservations."
          />
        </TabsContent>
      </Tabs>

      <EditReservationDialog
        isOpen={editDialogOpen}
        reservation={selectedReservation}
        onSave={handleSaveDuration}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedReservation(null);
        }}
      />

      <UserCancelReservationDialog
        isOpen={cancelDialogOpen}
        reservation={selectedReservation}
        onConfirm={handleConfirmCancel}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedReservation(null);
        }}
      />
    </div>
  );
}
