# View Implementation Plan: Facility Schedule

## 1. Overview
This document outlines the implementation plan for the `Facility Schedule View`. This view is the primary interface for users to see the availability of a specific sports facility, make new reservations, and for administrators to manage existing bookings. It will display a 7-day selector and a daily timeline of 15-minute time slots, indicating whether they are available or booked.

## 2. View Routing
The view will be accessible at the following dynamic path:
- **Path**: `/facilities/[id]`

This will be implemented by creating a file at `src/pages/facilities/[id].astro`. This Astro page will be responsible for extracting the `id` parameter from the URL and rendering the main React component for the view.

## 3. Component Structure
The view will be composed of a container component that manages state and several child components responsible for specific UI sections.

```
- FacilityScheduleView.tsx (Container)
  - h1 (Facility Name)
  - DateSelector.tsx
    - Button (for each of the next 7 days)
  - ScheduleView.tsx
    - TimeSlot.tsx (for each 15-minute interval from 14:00 to 22:00)
  - BookingDialog.tsx (Shadcn/ui Dialog)
    - Select (for duration)
    - Button (Confirm)
  - CancelReservationDialog.tsx (Shadcn/ui AlertDialog)
    - Textarea (for cancellation reason)
    - Button (Confirm Cancellation)
```

## 4. Component Details

### `FacilityScheduleView.tsx`
- **Component description**: The main container component that fetches data, manages the overall view state, and orchestrates interactions between its child components.
- **Main elements**: Renders the facility name, `DateSelector`, `ScheduleView`, and the modal dialogs (`BookingDialog`, `CancelReservationDialog`). It will also display loading skeletons and error states.
- **Handled interactions**:
  - Handles date selection changes from `DateSelector`.
  - Handles the initiation of a booking process from `ScheduleView`.
  - Handles the initiation of a reservation cancellation from `ScheduleView`.
- **Handled validation**: None. It delegates validation to child components like `BookingDialog`.
- **Types**: `FacilityScheduleDTO`, `FacilityScheduleViewModel`
- **Props**: `{ facilityId: number }`

### `DateSelector.tsx`
- **Component description**: A simple component that displays interactive buttons for the next 7 days, allowing the user to select a date to view its schedule.
- **Main elements**: A container (`div`) with 7 Shadcn/ui `Button` components. The currently selected date's button will have a distinct "active" style.
- **Handled interactions**: `onClick` on each button to notify the parent of the newly selected date.
- **Handled validation**: None.
- **Types**: `Date`
- **Props**: `{ selectedDate: Date, onDateSelect: (date: Date) => void }`

### `ScheduleView.tsx`
- **Component description**: Renders the vertical timeline of all 15-minute time slots for the selected day.
- **Main elements**: A list (`div`) that maps over an array of `TimeSlotViewModel` objects and renders a `TimeSlot` component for each one.
- **Handled interactions**:
  - Delegates `onClick` events from available `TimeSlot` components to the parent.
  - Delegates cancellation requests from booked `TimeSlot` components to the parent.
- **Handled validation**: None.
- **Types**: `TimeSlotViewModel[]`, `AppRole`
- **Props**: `{ timeSlots: TimeSlotViewModel[], userRole: AppRole, onTimeSlotSelect: (startTime: Date) => void, onCancelReservation: (reservationId: number) => void }`

### `TimeSlot.tsx`
- **Component description**: Represents a single 15-minute interval in the schedule. Its appearance and behavior change based on whether it's available, booked, or part of a user's new selection.
- **Main elements**: A `button` element styled with Tailwind CSS according to its status. If booked, it displays reservation details (start/end time, user email for admins). Admins will also see a "Cancel" button.
- **Handled interactions**:
  - `onClick`: If the slot is available, it calls a handler passed via props.
  - `onClick` on "Cancel" button: If the user is an admin, it calls a cancellation handler passed via props.
- **Handled validation**: The component is non-interactive if its status is 'booked' (except for the admin's cancel button).
- **Types**: `TimeSlotViewModel`
- **Props**: `{ timeSlot: TimeSlotViewModel, userRole: AppRole, onSelect: () => void, onCancel: (reservationId: number) => void }`

### `BookingDialog.tsx`
- **Component description**: A modal dialog that allows a user to finalize their reservation by selecting a duration.
- **Main elements**: A Shadcn/ui `Dialog` containing a form with a `Label` for duration and a `Select` component for choosing the duration. It includes "Cancel" and "Confirm Reservation" buttons.
- **Handled interactions**: `onValueChange` for the duration select, `onClick` for the confirm and cancel buttons.
- **Handled validation**:
  - A duration must be selected.
  - The "Confirm Reservation" button is disabled until a valid duration is chosen.
  - The list of available durations is dynamically generated to ensure the reservation does not end after 22:00 or overlap with other reservations.
- **Types**: `CreateReservationCommand`
- **Props**: `{ isOpen: boolean, startTime: Date, onConfirm: (command: CreateReservationCommand) => void, onCancel: () => void }`

### `CancelReservationDialog.tsx`
- **Component description**: A confirmation dialog for administrators to cancel a reservation.
- **Main elements**: A Shadcn/ui `AlertDialog` containing a `Textarea` for an optional cancellation reason and buttons to confirm or abort the action.
- **Handled interactions**: `onClick` for the "Confirm Cancellation" and "Cancel" buttons.
- **Handled validation**: The optional reason may have a client-side character limit hint, but the primary validation is on the backend.
- **Types**: `UpdateReservationCommand`
- **Props**: `{ isOpen: boolean, onConfirm: (command: UpdateReservationCommand) => void, onCancel: () => void }`

## 5. Types
In addition to the DTOs from `src/types.ts`, the following `ViewModel` types are required to represent the UI state.

### `TimeSlotStatus`
A string literal type to define the possible states of a time slot in the UI.
```typescript
type TimeSlotStatus = 'available' | 'booked';
```

### `TimeSlotViewModel`
Represents a single 15-minute slot in the schedule, combining API data with UI state. An array of these will be generated to cover the entire operating day (14:00 - 22:00).
```typescript
interface TimeSlotViewModel {
  startTime: Date; // A JavaScript Date object for the start of the slot
  endTime: Date;   // A JavaScript Date object for the end of the slot
  status: TimeSlotStatus;
  // Included only if status is 'booked'
  reservation?: ScheduleReservationDTO; 
}
```

### `FacilityScheduleViewModel`
The top-level view model that aggregates all data needed to render the entire view.
```typescript
interface FacilityScheduleViewModel {
  facility: FacilityInfo;
  date: string; // YYYY-MM-DD format
  timeSlots: TimeSlotViewModel[];
}
```

## 6. State Management
All state logic will be encapsulated within a custom React hook, `useFacilitySchedule`, to keep the main component clean and logic reusable.

### `useFacilitySchedule(facilityId: number)`
- **Purpose**: To manage data fetching, state updates, and user actions for the facility schedule.
- **Internal State**:
  - `selectedDate: Date`: The currently selected day.
  - `schedule: FacilityScheduleViewModel | null`: The transformed data for rendering.
  - `isLoading: boolean`: Loading state for API calls.
  - `error: Error | null`: Error state for API calls.
  - `userRole: AppRole`: The current user's role ('admin' or 'user').
  - `bookingState: { isOpen: boolean, startTime: Date | null }`: State for the `BookingDialog`.
  - `cancelState: { isOpen: boolean, reservationId: number | null }`: State for the `CancelReservationDialog`.
- **Exposed Functions**:
  - `setSelectedDate(date: Date)`
  - `createReservation(command: CreateReservationCommand)`
  - `cancelReservation(command: UpdateReservationCommand)`
  - `openBookingDialog(startTime: Date)`
  - `openCancelDialog(reservationId: number)`
  - `closeDialogs()`

## 7. API Integration
The view will interact with three main API endpoints.

- **`GET /api/facilities/{id}/schedule`**:
  - **Usage**: Called on initial load and whenever the selected date changes.
  - **Request**: Requires `id` (from URL) and `date` (from state, formatted as `YYYY-MM-DD`).
  - **Response Type**: `FacilityScheduleDTO`.
- **`POST /api/reservations`**:
  - **Usage**: Called when a user confirms a new reservation in the `BookingDialog`.
  - **Request Type**: `CreateReservationCommand`.
  - **Response Type**: `ReservationDTO`. On success, the schedule for the current date will be re-fetched.
- **`PATCH /api/reservations/{id}`**:
  - **Usage**: Called when an administrator confirms a cancellation in the `CancelReservationDialog`.
  - **Request Type**: `UpdateReservationCommand`.
  - **Response Type**: `ReservationDTO`. On success, the schedule will be re-fetched.

## 8. User Interactions

- **Selecting a Date**: User clicks a date button in `DateSelector`. This updates the `selectedDate` state, triggering a new API call to fetch the schedule for that day. The `ScheduleView` updates with the new data.
- **Initiating a Booking**: User clicks an 'available' `TimeSlot`. The `BookingDialog` opens, pre-filled with the selected start time.
- **Confirming a Booking**: User selects a valid duration in `BookingDialog` and clicks "Confirm". The `createReservation` function is called, which makes a `POST` request. On success, the dialog closes and the schedule refreshes.
- **Canceling a Booking (Admin)**: An admin clicks the "Cancel" button on a booked `TimeSlot`. The `CancelReservationDialog` opens.
- **Confirming Cancellation (Admin)**: Admin confirms the cancellation (with an optional reason). The `cancelReservation` function is called, making a `PATCH` request. On success, the dialog closes and the schedule refreshes.

## 9. Conditions and Validation
Client-side validation will be implemented to provide immediate feedback to the user and prevent invalid API requests.

- **Booking Duration**: In the `BookingDialog`, the `Select` component for duration will be dynamically populated. It will only show options that result in an end time on or before the facility's closing time of 22:00, and it does not overlap with other reservations.
- **Form Submission**: The "Confirm" button in the `BookingDialog` will be disabled until a duration is selected.
- **Role-Based UI**: The user's role (`admin` or `user`) will be determined once. This role will be used to conditionally:
  - Render user emails on booked time slots for admins.
  - Render the "Cancel Reservation" button on booked time slots for admins.

## 10. Error Handling
The view will handle API and user errors gracefully.

- **Data Fetching Errors**: If the initial fetch for the schedule fails (e.g., facility not found), a full-page error message will be displayed. If a subsequent fetch (on date change) fails, a smaller error indicator will be shown within the component.
- **Booking Conflict (`409 Conflict`)**: If the `POST /api/reservations` call fails with a 409 status, a `Sonner` toast notification will be displayed with the message: "Sorry, this time slot is no longer available. Please select another time."
- **Other API Errors**: For other errors during booking or cancellation (e.g., 400, 500), a generic error toast will be displayed (e.g., "Failed to create reservation. Please try again.").
- **Loading State**: While data is being fetched, `Skeleton` components from Shadcn/ui will be displayed in place of the `ScheduleView` to indicate activity.

## 11. Implementation Steps
1.  **Create Astro Page**: Create `src/pages/facilities/[id].astro`. Implement logic to get the `id` from `Astro.params` and pass it as a prop to a client-side React component.
2.  **Create Container Component**: Create the main `FacilityScheduleView.tsx` component.
3.  **Implement Custom Hook**: Create the `useFacilitySchedule` hook. Implement the state variables and the initial data fetching logic for the schedule and user role.
4.  **Develop Data Transformation**: Write the utility function that transforms the `FacilityScheduleDTO` into a `FacilityScheduleViewModel`, generating a full list of `TimeSlotViewModel` objects for the day.
5.  **Build UI Components**:
    -   Create `DateSelector.tsx`.
    -   Create `ScheduleView.tsx`.
    -   Create `TimeSlot.tsx`, including conditional rendering for different statuses and user roles.
6.  **Integrate Loading/Error States**: Wire up the `isLoading` and `error` states from the hook to render `Skeleton` components or error messages in `FacilityScheduleView`.
7.  **Implement Booking Flow**:
    -   Create `BookingDialog.tsx`.
    -   Implement the logic to open the dialog and pass the `startTime`.
    -   Implement the `createReservation` function in the hook, including the `POST` request and success/error handling (especially the 409 toast).
8.  **Implement Admin Cancellation Flow**:
    -   Add the "Cancel" button to `TimeSlot.tsx` (visible only to admins).
    -   Create `CancelReservationDialog.tsx`.
    -   Implement the `cancelReservation` function in the hook, including the `PATCH` request and state updates.
9.  **Refine and Test**: Thoroughly test all user stories, including the admin flow, booking conflicts, and edge cases (e.g., selecting the last possible time slot).
10. **Add Accessibility Features**: Ensure all interactive elements are keyboard-navigable and use appropriate ARIA attributes to announce time slot status. Manage focus when opening and closing dialogs.
