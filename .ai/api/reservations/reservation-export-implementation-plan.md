# API Endpoint Implementation Plan: GET /api/reservations/{id}/export.ics

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /api/reservations/{id}/export.ics` endpoint. Its purpose is to allow authenticated users to download a reservation's details as an iCalendar (.ics) file. This enables users to easily add their reservations to their personal calendars. The endpoint will enforce authorization rules, ensuring users can only access their own reservations, while administrators can access any reservation.

## 2. Request Details
-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/reservations/{id}/export.ics`
-   **Parameters**:
    -   **Path Parameters (Required)**:
        -   `id` (integer): The unique identifier of the reservation.
-   **Request Body**: None.

## 3. Used Types
The implementation will primarily use the following existing type definition from `src/types.ts`:
-   `ReservationDetailDTO`: To represent the reservation data fetched from the service, which includes nested facility information required for the ICS file.

## 4. Response Details
-   **Success Response (200 OK)**:
    -   **Headers**:
        -   `Content-Type`: `text/calendar; charset=utf-8`
        -   `Content-Disposition`: `attachment; filename="reservation-{id}.ics"`
    -   **Body**: A string formatted as a valid iCalendar (.ics) file.
-   **Error Responses**:
    -   `400 Bad Request`: If the `id` parameter is not a valid integer.
    -   `401 Unauthorized`: If the request is made without a valid session.
    -   `403 Forbidden`: If a non-admin user tries to access a reservation belonging to another user.
    -   `404 Not Found`: If the reservation with the specified `id` does not exist.
    -   `500 Internal Server Error`: For any unexpected server-side errors.

## 5. Data Flow
1.  The client sends a `GET` request to `/api/reservations/{id}/export.ics`.
2.  Astro's middleware intercepts the request to verify the user's authentication status via the Supabase session token from cookies. User information is attached to `context.locals`.
3.  The API route handler in `src/pages/api/reservations/[id]/export.ics.ts` is executed.
4.  The handler extracts the `id` from `context.params` and validates it using Zod to ensure it is a number.
5.  The handler calls a new service function, `findReservationForExport(id, user, userRole)`, located in `src/lib/services/reservations.service.ts`.
6.  The service function queries the Supabase database to retrieve the reservation with the specified `id`, including a join to fetch the associated facility's name.
7.  The service performs an authorization check:
    -   If the reservation is not found, it throws a `NotFoundError`.
    -   If the user is not an admin and the `reservation.user_id` does not match the authenticated user's ID, it throws a `ForbiddenError`.
8.  If successful, the service returns the `ReservationDetailDTO` object.
9.  The API handler passes the reservation data to a new utility function, `generateIcsContent(reservation)`, which constructs the `.ics` file string.
10. The handler creates a `Response` object with the `.ics` string as the body and sets the appropriate `Content-Type` and `Content-Disposition` headers.
11. The `Response` object is returned to the client.

## 6. Security Considerations
-   **Authentication**: Will be handled by the existing Supabase integration in the Astro middleware (`src/middleware/index.ts`). The endpoint will be protected, and unauthenticated requests will result in a `401 Unauthorized` error.
-   **Authorization**: This is a critical aspect. The service layer will contain strict checks to prevent Insecure Direct Object Reference (IDOR) vulnerabilities. It will verify that the `user_id` of the requested reservation matches the ID of the logged-in user unless the user has an `admin` role.
-   **Input Validation**: The `id` path parameter will be parsed and validated as an integer using Zod to prevent SQL injection or other injection attacks and to ensure data integrity.

## 7. Implementation Steps
1.  **Create API Route File**: Create a new file at `src/pages/api/reservations/[id]/export.ics.ts`.
2.  **Update Reservation Service**:
    -   In `src/lib/services/reservations.service.ts`, create a new asynchronous function `findReservationForExport`.
    -   This function will accept `reservationId`, `userId`, and `isAdmin` as parameters.
    -   It will perform the database query to fetch the reservation and facility details.
    -   It will implement the authorization logic (owner or admin).
    -   It will throw custom errors (`NotFoundError`, `ForbiddenError`) for failure cases.
3.  **Create ICS Utility**:
    -   Create a new utility function `generateIcsContent(reservation: ReservationDetailDTO)` in `src/lib/utils.ts` (or a new `src/lib/ics.ts`).
    -   This function will take a reservation object and return a formatted `.ics` string according to the specification. It will need to calculate the end time based on `start_time` and `duration`.
4.  **Implement API Route Handler**:
    -   In `export.ics.ts`, define the `GET` handler function.
    -   Retrieve the authenticated user and their role from `context.locals`.
    -   Use a Zod schema to parse and validate the `id` from `context.params`.
    -   Wrap the logic in a `try...catch` block to handle potential errors from the service layer.
    -   Call `findReservationForExport` to get the reservation data.
    -   Call `generateIcsContent` to create the file content.
    -   Return a new `Response` with the content, a `200` status, and the required `Content-Type` and `Content-Disposition` headers.
    -   In the `catch` block, handle custom errors and return the appropriate HTTP status codes (`403`, `404`) and a JSON error message. Handle generic errors with a `500` status.
5.  **Add `prerender = false`**: Ensure `export const prerender = false;` is added to the API route file to force dynamic rendering.
