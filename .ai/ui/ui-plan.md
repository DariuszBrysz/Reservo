# UI Architecture for Reservo

## 1. UI Structure Overview

The UI architecture for Reservo is designed as a client-rendered application built on Astro with React for interactive islands. It follows a simple, view-based structure optimized for the core user flows of browsing facilities, viewing schedules, and managing reservations.

The architecture is built around three primary views, supported by a set of reusable, accessible components from the `shadcn/ui` library. A central layout ensures consistent navigation across the application. Security is enforced on the client side by conditionally rendering UI elements based on the user's role and business logic (e.g., the 12-hour rule), complementing the backend's Row Level Security (RLS) policies.

## 2. View List

### 2.1. Facility List View

*   **View Path**: `/`
*   **Main Purpose**: To display all available sports facilities, serving as the main entry point for users to begin the reservation process.
*   **Key Information to Display**:
    *   A list of available facilities by name.
*   **Key View Components**:
    *   `Layout`: Provides the main application frame with navigation.
    *   `FacilityCard`: A clickable card for each facility that navigates to its schedule.
    *   `Skeleton`: Used as a placeholder while the list of facilities is loading.
*   **UX, Accessibility, and Security Considerations**:
    *   **UX**: On initial load, `Skeleton` components prevent layout shift and provide immediate feedback. If no facilities are available, a clear "No facilities available at this time" message will be displayed.
    *   **Accessibility**: The list of facilities will be navigable via keyboard. Each `FacilityCard` will be a proper link with a descriptive `aria-label`.
    *   **Security**: This is a read-only view accessible to all authenticated users.

### 2.2. Facility Schedule View

*   **View Path**: `/facilities/[id]`
*   **Main Purpose**: To display the detailed daily schedule for a specific facility, show availability, and allow users to make reservations. This view also serves as the main administrative interface for managing bookings.
*   **Key Information to Display**:
    *   Facility name.
    *   A 7-day date selector.
    *   A timeline of 15-minute time slots from 14:00 to 22:00
    *   Clear visual distinction between available, booked, and selected time slots.
    *   For administrators: the reserving user's email address on each booking.
*   **Key View Components**:
    *   `DateSelector`: A component with 7 interactive buttons for the upcoming week.
    *   `ScheduleView`: A component that displays the schedule as a vertical list.
    *   `TimeSlot`: A clickable element representing a 15-minute interval.
    *   `BookingDialog`: A modal for selecting a duration and confirming a new reservation.
    *   `AlertDialog`: For admins to confirm reservation cancellations.
*   **UX, Accessibility, and Security Considerations**:
    *   **UX**: Failed booking attempts due to conflicts (`409 Conflict`) will trigger a `Sonner` toast notification explaining the issue.
    *   **Accessibility**: All interactive elements (date buttons, time slots) will be keyboard-focusable and operable. ARIA attributes will be used to announce the status of each time slot (e.g., "15:00, Available"). Focus will be managed when dialogs are opened and closed.
    *   **Security**: The view will inspect the user's JWT role to conditionally render admin-only information (user emails) and controls ("Cancel Reservation" button). All booking attempts are validated by the backend.

### 2.3. My Reservations View

*   **View Path**: `/my-reservations`
*   **Main Purpose**: To provide users with a consolidated view of all their reservations, allowing them to manage upcoming bookings.
*   **Key Information to Display**:
    *   A list of reservations, each showing:
        *   Facility name
        *   Date, start time, and end time
        *   Reservation status ("Confirmed", "Canceled")
        *   Administrator's cancellation message (if applicable)
*   **Key View Components**:
    *   `Tabs`: To switch between "Upcoming," "Past," and "Canceled" reservation lists.
    *   `ReservationCard`: Displays the details for a single reservation.
    *   Action Buttons (`Button`): "Edit," "Cancel," and "Export to .ics" buttons, rendered conditionally.
    *   `EditReservationDialog`: A modal to modify the duration of an upcoming reservation.
*   **UX, Accessibility, and Security Considerations**:
    *   **UX**: Using `Tabs` helps organize reservations and reduces clutter. An empty state message will be shown if a user has no reservations in a selected category.
    *   **Accessibility**: Tabs will be fully keyboard-navigable. Each `ReservationCard` will contain structured, semantic HTML for easy screen reader consumption.
    *   **Security**: "Edit" and "Cancel" buttons will only be rendered on a `ReservationCard` if the reservation is more than 12 hours in the future. This client-side check mirrors the backend authorization rule, preventing users from attempting invalid actions.

## 3. User Journey Map

### Primary User Flow: Making a Reservation

1.  **Start**: The user lands on the **Facility List View** (`/`).
2.  **Select Facility**: The user clicks a `FacilityCard`.
3.  **View Schedule**: The app navigates to the **Facility Schedule View** (`/facilities/[id]`), which defaults to today's schedule.
4.  **Select Date**: The user interacts with the `DateSelector` to view the schedule for a different day.
5.  **Initiate Booking**: The user clicks an available `TimeSlot` in the `ScheduleView`.
6.  **Confirm Details**: A `BookingDialog` opens, allowing the user to select a duration and confirm.
7.  **Complete**: The reservation is optimistically created in the UI, and an API call is made. A success toast confirms the booking and provides a link to the **My Reservations View**.
8.  **Manage**: The user can then navigate to the **My Reservations View** (`/my-reservations`) to see the new booking under the "Upcoming" tab.

### Administrator Flow: Canceling a Reservation

1.  **Navigate**: An administrator navigates to the **Facility Schedule View** for any facility.
2.  **Identify Reservation**: The schedule displays all bookings, including user emails and a "Cancel" button on each.
3.  **Initiate Cancellation**: The admin clicks the "Cancel" button on a reservation.
4.  **Confirm Action**: An `AlertDialog` prompts for confirmation and allows the admin to enter an optional reason.
5.  **Complete**: Upon confirmation, the API is called, and the UI updates to show the time slot as available.

## 4. Layout and Navigation Structure

The application will use a single, persistent layout (`src/layouts/Layout.astro`) that contains a main header and a content area.

*   **Header**:
    *   Contains the "Reservo" logo, which links to the homepage (`/`).
    *   Primary navigation links:
        *   **Facilities**: Navigates to the `Facility List View` (`/`).
        *   **My Reservations**: Navigates to the `My Reservations View` (`/my-reservations`).
    *   A user profile/logout section.

This simple and consistent navigation structure ensures users can easily move between the core sections of the application.

## 5. Key Components

The following components are central to the UI and will be reused across different views.

*   **`FacilityCard`**: A simple, clickable card representing a single facility. Used in the `Facility List View`.
*   **`ReservationCard`**: A detailed card displaying all information for a single reservation. It conditionally renders action buttons based on user role and business logic. Used in the `My Reservations View`.
*   **`DateSelector`**: A component providing 7 buttons to select a day within the upcoming week. Used in the `Facility Schedule View`.
*   **`ScheduleView`**: A container component responsible for rendering the facility schedule. It processes reservation data to display a grid of `TimeSlot` components.
*   **`BookingDialog`**: A modal form for creating a reservation. It includes inputs for selecting a duration.
*   **`EditReservationDialog`**: A modal form used to update the duration of an existing reservation.
*   **`Sonner` (Toast)**: Provides non-intrusive feedback for actions like successful bookings, updates, or API errors.
*   **`AlertDialog`**: Used to confirm destructive actions, such as an administrator canceling a user's reservation.
