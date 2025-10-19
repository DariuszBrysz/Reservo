# View Implementation Plan: My Reservations

## 1. Overview
This document outlines the implementation plan for the "My Reservations" view. This view allows authenticated users to see a consolidated list of their upcoming, past, and canceled sports facility reservations. It provides key management functionalities, including editing the duration of a reservation, canceling a booking, and exporting reservation details to an iCalendar (.ics) file. The user interface will be organized with tabs for easy navigation between different reservation categories.

## 2. View Routing
The "My Reservations" view will be a new page accessible at the following path:
- **Path**: `/my-reservations`

This will require creating a new Astro page file at `src/pages/my-reservations.astro`.

## 3. Component Structure
The view will be composed of a main Astro page that loads a top-level React component. The component hierarchy is as follows:

```
/src/pages/my-reservations.astro
└── /src/components/views/MyReservationsView.tsx (client:load)
    ├── Tabs (Shadcn/ui)
    │   ├── TabsList
    │   │   ├── TabsTrigger ("Upcoming")
    │   │   ├── TabsTrigger ("Past")
    │   │   └── TabsTrigger ("Canceled")
    │   ├── TabsContent ("Upcoming")
    │   │   └── ReservationList.tsx
    │   │       ├── ReservationCard.tsx[]
    │   │       └── EmptyStateMessage (if list is empty)
    │   ├── TabsContent ("Past")
    │   │   └── ReservationList.tsx
    │   └── TabsContent ("Canceled")
    │       └── ReservationList.tsx
    ├── EditReservationDialog.tsx (conditionally rendered)
    └── CancelReservationDialog.tsx (conditionally rendered)
```

## 4. Component Details

### `MyReservationsView.tsx`
- **Component Description**: This is the main stateful component that orchestrates the entire view. It manages the active tab, fetches reservation data for all categories, and handles the logic for opening and closing the edit and cancel dialogs.
- **Main Elements**: A `Tabs` component from Shadcn/ui to structure the layout. It will render the appropriate `ReservationList` based on the selected tab.
- **Handled Interactions**:
    - Handles tab selection to switch between "Upcoming", "Past", and "Canceled" views.
    - Manages the visibility of `EditReservationDialog` and `CancelReservationDialog`.
    - Triggers API calls for updating and canceling reservations.
- **Handled Validation**: None directly. It delegates validation to child components and API calls.
- **Types**: `ReservationViewModel[]`, `ReservationDetailDTO[]`
- **Props**: None.

### `ReservationList.tsx`
- **Component Description**: A stateless component that receives an array of reservations and renders them as a list of `ReservationCard` components. If the array is empty, it displays a user-friendly "empty state" message (e.g., "You have no upcoming reservations.").
- **Main Elements**: A container `div` that maps over the `reservations` prop to render `ReservationCard` components.
- **Handled Interactions**: Forwards events (`onEdit`, `onCancel`, `onExport`) from `ReservationCard` up to `MyReservationsView`.
- **Handled Validation**: None.
- **Types**: `ReservationViewModel[]`
- **Props**:
    - `reservations: ReservationViewModel[]`
    - `onEdit: (reservation: ReservationViewModel) => void`
    - `onCancel: (reservation: ReservationViewModel) => void`
    - `onExport: (reservationId: number) => void`

### `ReservationCard.tsx`
- **Component Description**: Displays the details for a single reservation, including facility name, date, time, and status. It also contains action buttons that are rendered conditionally.
- **Main Elements**: A `Card` component (Shadcn/ui) containing structured text elements (`<p>`, `<strong>`) to display reservation info. It includes `Button` components for actions.
- **Handled Interactions**:
    - `onClick` on "Edit" button: Calls the `onEdit` prop.
    - `onClick` on "Cancel" button: Calls the `onCancel` prop.
    - `onClick` on "Export" button: Calls the `onExport` prop.
- **Handled Validation**:
    - **12-Hour Rule**: The "Edit" and "Cancel" buttons will only be rendered if the reservation's start time is more than 12 hours in the future. This is determined by the `isEditable` and `isCancelable` flags in the `ReservationViewModel`.
- **Types**: `ReservationViewModel`
- **Props**:
    - `reservation: ReservationViewModel`
    - `onEdit: (reservation: ReservationViewModel) => void`
    - `onCancel: (reservation: ReservationViewModel) => void`
    - `onExport: (reservationId: number) => void`

### `EditReservationDialog.tsx`
- **Component Description**: A modal dialog that allows a user to change the duration of their reservation. It contains a form with a dropdown to select a new duration.
- **Main Elements**: A `Dialog` component (Shadcn/ui) containing a form with a `Select` component for duration and a "Save Changes" `Button`.
- **Handled Interactions**:
    - `onSubmit`: Calls the `onSave` prop with the new duration.
    - `onClose`: Closes the dialog.
- **Handled Validation**:
    - The `Select` dropdown will only contain valid duration options, calculated to be between 30 minutes and 3 hours, in 15-minute increments, and not extending the reservation beyond the 22:00 facility closing time.
- **Types**: `ReservationViewModel`, `UpdateReservationCommand`
- **Props**:
    - `isOpen: boolean`
    - `reservation: ReservationViewModel | null`
    - `onSave: (reservationId: number, newDuration: string) => void`
    - `onClose: () => void`

### `CancelReservationDialog.tsx`
- **Component Description**: A simple confirmation dialog to prevent accidental reservation cancellations.
- **Main Elements**: An `AlertDialog` component (Shadcn/ui) with a confirmation message and "Confirm" and "Cancel" buttons.
- **Handled Interactions**:
    - `onClick` on "Confirm": Calls the `onConfirm` prop.
    - `onClick` on "Cancel": Calls the `onClose` prop.
- **Handled Validation**: None.
- **Types**: `ReservationViewModel`
- **Props**:
    - `isOpen: boolean`
    - `reservation: ReservationViewModel | null`
    - `onConfirm: (reservationId: number) => void`
    - `onClose: () => void`

## 5. Types

### `ReservationViewModel`
A new client-side ViewModel will be created to transform the API data into a display-friendly format and encapsulate UI logic.

```typescript
// Location: src/components/views/viewModels.ts

export interface ReservationViewModel {
  // Display-ready fields
  id: number;
  facilityName: string;
  date: string; // Formatted as "Month Day, Year"
  startTime: string; // Formatted as "HH:mm"
  endTime: string; // Formatted as "HH:mm"
  status: "Confirmed" | "Canceled"; // Capitalized for display
  cancellationMessage: string | null;

  // UI logic flags
  isEditable: boolean; // True if start_time is >12 hours from now
  isCancelable: boolean; // True if start_time is >12 hours from now

  // Original data for actions
  originalStartTime: Date; // Date object for calculations
  originalDuration: string; // ISO 8601 duration
}
```

## 6. State Management
A custom hook, `useMyReservations`, will be created to manage the state and logic for this view. This hook will centralize data fetching, state updates, and interactions with the reservations API.

### `useMyReservations.ts`
- **Purpose**: To provide the `MyReservationsView` component with reservation data and methods to interact with it.
- **Exposed State**:
    - `upcomingReservations: ReservationViewModel[]`
    - `pastReservations: ReservationViewModel[]`
    - `canceledReservations: ReservationViewModel[]`
    - `isLoading: boolean`
    - `error: string | null`
- **Exposed Methods**:
    - `updateDuration(reservationId: number, newDuration: string): Promise<void>`
    - `cancel(reservationId: number): Promise<void>`
    - `exportToIcs(reservationId: number): void`
    - `refetch(): void`

This hook will handle all API calls and transform the `ReservationDetailDTO` from the API into the `ReservationViewModel`.

## 7. API Integration

The `useMyReservations` hook will integrate with the following API endpoints:

- **`GET /api/reservations`**
    - **Purpose**: To fetch reservations for each tab.
    - **Usage**:
        - Upcoming: `GET /api/reservations?status=confirmed&upcoming=true`
        - Past: `GET /api/reservations?status=confirmed&upcoming=false`
        - Canceled: `GET /api/reservations?status=canceled`
    - **Response Type**: `ReservationListDTO`

- **`PATCH /api/reservations/{id}`**
    - **Purpose**: To update the duration of a reservation.
    - **Request Type**: `UpdateReservationCommand` (e.g., `{ duration: "02:00:00" }`)
    - **Response Type**: `ReservationDTO`

- **`DELETE /api/reservations/{id}`**
    - **Purpose**: To cancel a user's reservation.
    - **Response**: `204 No Content`

- **`GET /api/reservations/{id}/export.ics`**
    - **Purpose**: To download the reservation as an `.ics` file.
    - **Usage**: This will be handled by setting `window.location.href`, not a standard fetch request.

## 8. User Interactions
- **Viewing Reservations**: On load, the "Upcoming" tab is active, and a loading skeleton is shown. Once data is fetched, the list is displayed.
- **Switching Tabs**: Clicking a tab immediately displays the corresponding list of reservations.
- **Editing a Reservation**:
    1. User clicks the "Edit" button on an eligible reservation card.
    2. The `EditReservationDialog` opens.
    3. User selects a new duration from the dropdown and clicks "Save Changes."
    4. The `updateDuration` method is called, making a `PATCH` request.
    5. The dialog closes, a success toast is shown, and the UI updates to reflect the new end time.
- **Canceling a Reservation**:
    1. User clicks the "Cancel" button on an eligible reservation card.
    2. The `CancelReservationDialog` opens for confirmation.
    3. User clicks "Confirm."
    4. The `cancel` method is called, making a `DELETE` request.
    5. The dialog closes, a success toast is shown, and the reservation is moved from the "Upcoming" list to the "Canceled" list.
- **Exporting a Reservation**:
    1. User clicks the "Export to .ics" button.
    2. The browser is directed to the export URL, triggering a file download.

## 9. Conditions and Validation
- **Action Button Visibility**: The "Edit" and "Cancel" buttons on `ReservationCard` are only visible if `reservation.isCancelable` (derived from the 12-hour rule) is `true`. This check will be performed in the `useMyReservations` hook when mapping DTOs to ViewModels.
- **Duration Selection**: The `Select` dropdown in `EditReservationDialog` will be populated only with valid durations that adhere to the business rules (30min - 3hr range, 15min steps, does not exceed 22:00 close time).

## 10. Error Handling
- **API Fetch Errors**: If any of the initial `GET` requests fail, a global error message will be displayed in the view instead of the lists.
- **Update/Cancel Errors**:
    - **403 Forbidden** (e.g., 12-hour window passed): A specific toast message will be shown: "Action forbidden. Reservations can only be changed more than 12 hours in advance."
    - **404 Not Found**: A toast will inform the user: "This reservation could not be found. It may have been canceled by an administrator." The list will be refetched.
    - **409 Conflict** (on edit): A toast will appear: "The new duration conflicts with another booking. Please select a different time." The edit dialog will remain open.
    - **500 Internal Server Error**: A generic error toast will be displayed: "An unexpected error occurred. Please try again."

## 11. Implementation Steps
1.  **Create Page File**: Create the new page at `src/pages/my-reservations.astro`. Import a `Layout` and render the `MyReservationsView` component with a `client:load` directive.
2.  **Define ViewModel**: Add the `ReservationViewModel` type definition to `src/components/views/viewModels.ts`.
3.  **Create Custom Hook**: Implement the `useMyReservations` hook in `src/components/hooks/useMyReservations.ts`. It should handle fetching data for all three categories, transforming DTOs to ViewModels (including the 12-hour rule logic), and exposing mutation methods.
4.  **Implement `MyReservationsView`**: Create the main view component. Use the `useMyReservations` hook to get data and functions. Set up the Shadcn `Tabs` layout and manage dialog visibility state.
5.  **Implement `ReservationList` and `ReservationCard`**: Create the stateless list and card components to display the reservation data and action buttons based on the ViewModel properties.
6.  **Implement `EditReservationDialog`**: Create the dialog component. Add logic to calculate and display valid duration options.
7.  **Implement `CancelReservationDialog`**: Create the simple confirmation dialog.
8.  **Add Toast Notifications**: Integrate a toast provider (e.g., `sonner`) to display feedback for success and error states for all API interactions.
9.  **Styling**: Apply Tailwind CSS classes as needed to match the application's design system. Ensure loading states (skeletons) and empty states are styled correctly.
10. **Testing**: Manually test all user stories: viewing lists, switching tabs, editing, canceling (both within and outside the 12-hour window), exporting, and handling API errors.
