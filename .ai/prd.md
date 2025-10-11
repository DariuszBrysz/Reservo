# Product Requirements Document (PRD) - Reservo
## 1. Product Overview
Reservo is a web-based application designed to streamline the process of reserving sports facilities. It replaces traditional manual tracking systems with an automated, user-friendly platform. The system supports two primary roles: Users, who can book facilities, and Administrators, who oversee and manage all reservations. The core functionality enables users to view facility availability, make, edit, and cancel their own reservations, while administrators have a comprehensive overview and the ability to manage all bookings.

## 2. User Problem
The manual tracking of sports facility reservations presents significant challenges. Facility managers are burdened with the time-consuming tasks of manually recording bookings, communicating with users, and handling scheduling conflicts. For users, this process is often inconvenient, involving phone calls or in-person visits, with no immediate visibility into facility availability. This leads to inefficiencies, potential for double-bookings, and a frustrating experience for everyone involved. Reservo aims to solve this by providing a centralized, automated system that is accessible to both users and administrators at any time.

## 3. Functional Requirements
### 3.1. User Account Management
-   Users must be able to register for an account within the application.
-   All users, including administrators, use the same registration and login system.
-   Administrator privileges are not granted through the application UI; they must be assigned manually in the database.

### 3.2. Facility and Reservation Viewing
-   Users can view a list of available sports facilities.
-   After selecting a facility, users can select a date from a 7-day view to see its schedule.
-   The schedule displays available and reserved time slots for the selected day.
-   Facility operating hours are fixed from 2:00 p.m. to 10:00 p.m.
-   Administrators can view the reservation schedule for any facility and day, which includes the reserving user's email address for each booking.

### 3.3. Reservation Management
-   Users can reserve a facility for a selected start time and duration.
-   Reservations can be made up to one week in advance.
-   Start times and durations can be selected in 15-minute intervals.
-   The minimum reservation duration is 30 minutes, and the maximum is 3 hours.
-   The system prevents double-bookings; a time slot can only be reserved by one user.
-   If a time slot becomes unavailable while a user is booking, a message will be displayed: “Sorry, this time slot is no longer available. Please select another time.”
-   Users can view a list of their own upcoming reservations.
-   Users can edit the duration of their reservations up to 12 hours before the start time. The new duration cannot conflict with existing reservations or extend beyond the 10:00 p.m. closing time.
-   Users can cancel their own reservations.
-   Users can export their reservations to an `.ics` file. The event title will be "Reservation: [Facility Name]".

### 3.4. Administrator Capabilities
-   Administrators can cancel any user's reservation at any time.
-   When canceling, an administrator has the option to provide a reason or message for the cancellation.
-   The administrator's view includes a distinct "Cancel Reservation" button for each booking.

### 3.5. System and UI
-   Date selection is presented as 7 interactive buttons for the upcoming week.
-   Time selection is handled by two dropdown menus: one for start time and one for duration.
-   All times within the application are managed in a single, fixed timezone.

## 4. Product Boundaries
The following features and functionalities are explicitly excluded from the MVP:
-   An in-app user interface for adding, editing, or removing sports facilities. (This must be done directly in the database).
-   Automated email notifications for reservation confirmations, changes, or cancellations.
-   A direct messaging system between users and administrators.
-   Password reset or "forgot password" functionality.
-   Support for multiple timezones.

## 5. User Stories
### ID: US-001
### Title: New User Registration
### Description: As a new user, I want to create an account so that I can log in and reserve sports facilities.
### Acceptance Criteria:
-   Given I am on the application's homepage, I can navigate to a registration page.
-   When I fill in the required fields (e.g., email, password) and submit the form, a new user account is created in the system.
-   Upon successful registration, I am redirected to the login page or logged in automatically.
-   If I enter invalid data (e.g., poorly formatted email), I see clear error messages.

### ID US-002
### Title: User Login
### Description: As a registered user, I want to log into my account to access the reservation system.
### Acceptance Criteria:
-   Given I am on the login page, I can enter my email and password.
-   When I submit the correct credentials, I am successfully authenticated and redirected to the main user dashboard.
-   If I enter incorrect credentials, I receive an "Invalid credentials" error message and remain on the login page.

### ID US-003
### Title: View Facility Availability
### Description: As a user, I want to select a facility and a date to see the available time slots.
### Acceptance Criteria:
-   Given I am logged in, I can see a list of available sports facilities.
-   When I select a facility, I am presented with a view to select a date.
-   The date selection shows the next 7 days.
-   When I select a date, a timeline or list is displayed showing all reservable hours (2 p.m. to 10 p.m.) with clear indicators for "available" and "booked" slots.

### ID US-004
### Title: Make a Reservation
### Description: As a user, I want to book an available time slot for a specific facility.
### Acceptance Criteria:
-   Given I am viewing the availability for a facility on a specific day, I can select a start time and duration for a new reservation.
-   The start time dropdown only shows available 15-minute intervals.
-   The duration dropdown allows selection in 15-minute increments, from a minimum of 30 minutes to a maximum of 3 hours.
-   When I confirm my selection, the system creates the reservation.
-   The reservation must not end after the 10 p.m. closing time.
-   After booking, the time slot is immediately shown as "booked" on the availability schedule.

### ID US-005
### Title: Handle Booking Conflict
### Description: As a user attempting to make a reservation, I want to be notified if the time slot becomes unavailable while I am booking.
### Acceptance Criteria:
-   Given I am on the booking screen for a specific time slot.
-   When I submit the reservation, the system re-validates that the time slot is still available.
-   If another user has booked the same slot in the interim, my reservation fails, and I see the message: “Sorry, this time slot is no longer available. Please select another time.”

### ID US-006
### Title: View My Reservations
### Description: As a user, I want to view a list of all my upcoming reservations so I can keep track of my bookings.
### Acceptance Criteria:
-   Given I am logged in, I can navigate to a "My Reservations" page.
-   This page lists all my future reservations, showing the facility name, date, start time, and end time for each.
-   If a reservation was canceled by an administrator, its status is clearly marked as "Canceled," and any associated message is visible.

### ID US-007
### Title Edit a Reservation
### Description: As a user, I want to change the duration of my reservation if my plans change.
### Acceptance Criteria:
-   Given I am viewing my list of reservations, I can select an option to edit a reservation.
-   Editing is only possible for reservations that are more than 12 hours in the future.
-   I can only modify the duration of the reservation; the facility, date, and start time are not editable.
-   The system validates that the new duration does not conflict with any existing reservations or extend past 10 p.m.
-   Upon successful edit, the reservation details are updated in my reservation list and on the facility's schedule.

### ID US-008
### Title: Cancel a Reservation
### Description: As a user, I want to cancel my reservation if I can no longer attend.
### Acceptance Criteria
-   Given I am viewing my list of reservations, I can select an option to cancel a reservation.
-   Cancelling is only possible for reservations that are more than 12 hours in the future.
-   When I confirm the cancellation, the reservation is removed from my list.
-   The corresponding time slot becomes available again on the facility's schedule.

### ID US-009
### Title: Export Reservation to ICS
### Description: As a user, I want to export my reservation to an `.ics` file so I can add it to my personal calendar.
### Acceptance Criteria:
-   Given I am viewing my reservations, there is an "Export to Calendar" button for each booking.
-   When I click the button, an `.ics` file is downloaded.
-   The file contains a calendar event with the title "Reservation: [Facility Name]" and the correct start and end times.

### ID US-010
### Title: Administrator View All Reservations
### Description: As an administrator, I want to view all reservations for any facility and day to monitor usage and manage bookings.
### Acceptance Criteria:
-   Given I am logged in as an administrator, I can select any facility and any date to view its schedule.
-   The schedule displays all reservations for that day.
-   For each reservation, the name of the facility, start/end times, and the reserving user's email address are displayed.

### ID US-011
### Title: Administrator Cancels a Reservation
### Description: As an administrator, I need to be able to cancel any user's reservation to handle facility maintenance or other administrative issues.
### Acceptance Criteria
-   Given I am viewing the reservation schedule as an administrator, each reservation has a "Cancel" button.
-   When I click "Cancel," I am prompted to confirm and have an optional field to enter a reason for the cancellation.
-   Upon confirmation, the reservation is canceled, and the time slot becomes available.
-   The canceled reservation's status is updated to "Canceled" in the original user's "My Reservations" view, along with the optional message.

## 6. Success Metrics
The primary success criterion for the MVP is to validate its utility and effectiveness in managing facility bookings. This will be measured by the facility utilization rate.

-   Primary Metric: Facility Utilization Rate
-   Target for Success: Achieve a facility utilization rate of at least 50%.
-   Measurement Method: this metric will be calculated by manually querying the application's database on a weekly basis.