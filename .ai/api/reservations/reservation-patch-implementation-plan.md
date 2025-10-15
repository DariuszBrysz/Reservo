# API Endpoint Implementation Plan: PATCH /api/reservations/{id}

## 1. Endpoint Overview
This endpoint allows for the modification of an existing reservation. It supports two primary use cases based on user roles:
1.  A regular user can update the duration of their own reservation.
2.  An admin user can cancel any reservation.

The endpoint enforces strict business logic, including time-based restrictions for users and conflict checking to ensure schedule integrity.

## 2. Request Details
- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/reservations/{id}`
- **Parameters**:
    - **Path (Required)**:
        - `id` (integer): The ID of the reservation to update.
- **Request Body**: A JSON object conforming to the `UpdateReservationCommand` type. The payload must be one of the following structures:
    - **For Users (Update Duration)**:
      ```json
      {
        "duration": "HH:MM:SS"
      }
      ```
    - **For Admins (Cancel Reservation)**:
      ```json
      {
        "status": "canceled",
        "cancellation_message": "Optional reason for cancellation."
      }
      ```

## 3. Used Types
The implementation will utilize the following data structures defined in `src/types.ts`:
- **Request Command Model**: `UpdateReservationCommand`
- **Response DTO**: `ReservationDTO`
- **Error DTO**: `ErrorResponse`
- **Enums**: `AppRole`

## 4. Response Details
- **Success (200 OK)**: Returns the complete, updated reservation object as `ReservationDTO`.
  ```json
  {
    "id": 100,
    "facility_id": 1,
    "user_id": "uuid",
    "start_time": "2025-10-15T14:00:00Z",
    "duration": "02:00:00",
    "end_time": "2025-10-15T16:00:00Z",
    "status": "confirmed",
    "cancellation_message": null,
    "created_at": "2025-10-12T10:30:00Z",
    "updated_at": "2025-10-12T10:35:00Z"
  }
  ```
- **Error**: Returns an `ErrorResponse` object with a corresponding status code.
  - `400 Bad Request`
  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found`
  - `409 Conflict`
  - `500 Internal Server Error`

## 5. Data Flow
1.  A `PATCH` request is made to `/api/reservations/{id}`.
2.  Astro middleware (`src/middleware/index.ts`) validates the user's authentication session and attaches the user object and Supabase client to `Astro.locals`.
3.  The API route handler in `src/pages/api/reservations/[id].ts` is invoked.
4.  The handler parses the `id` from the URL and the JSON payload from the request body.
5.  Input is validated using a predefined `zod` schema. If invalid, a `400 Bad Request` is returned.
6.  The handler calls the `updateReservation` method in the `ReservationsService` (`src/lib/services/reservations.service.ts`), passing the reservation ID, update payload, and authenticated user details.
7.  **Inside `ReservationsService`**:
    a. Fetch the target reservation from the database using its ID. If not found, throw a "Not Found" error.
    b. Fetch the user's roles from the `user_roles` table.
    c. Perform authorization checks: is the user the owner OR do they have an `admin` role? If not, throw a "Forbidden" error.
    d. Based on the user's role and the request payload, execute the appropriate logic:
        - **User Logic**: Validate the 12-hour modification window. Validate the new duration against business rules (range, increments, 22:00 end time). Check for scheduling conflicts with other reservations.
        - **Admin Logic**: Verify the payload is for cancellation.
    e. If all checks pass, construct and execute an `UPDATE` query via the Supabase client.
    f. Return the updated reservation data.
8.  The API route handler receives the result from the service. On success, it formats a `200 OK` response. If the service throws an error, it catches it and maps it to the appropriate HTTP error response (e.g., 403, 404, 409).

## 6. Security Considerations
- **Authentication**: Handled by existing Astro middleware, which must reject any unauthenticated requests with a `401 Unauthorized` error.
- **Authorization**: The service layer is the primary gatekeeper. It must enforce that users can only modify their own reservations, while admins have broader cancellation privileges. Direct object access will be prevented by this ownership/role check.
- **Input Validation**: A strict `zod` schema will be used in the API route to sanitize the request body, preventing invalid data types, oversized fields, and parameter pollution. The schema should reject any fields not explicitly defined in `UpdateReservationCommand`.

## 7. Implementation Steps
1.  **Create Service File**: Create a new file `src/lib/services/reservations.service.ts`.
2.  **Define Zod Schema**: In a shared location like `src/lib/schemas.ts`, define a `zod` schema for the `UpdateReservationCommand` payload. This schema will handle type validation and basic constraints.
3.  **Implement `updateReservation` Service Method**:
    - Add a function `updateReservation(id, payload, user)` to `reservations.service.ts`.
    - This function will contain the core business logic: fetching the reservation, checking permissions (ownership vs. admin), validating business rules based on role, checking for conflicts, and executing the database update.
    - It should throw custom, distinguishable errors for "Not Found", "Forbidden", and "Conflict" scenarios.
4.  **Create API Route**: Create the file `src/pages/api/reservations/[id].ts`.
5.  **Implement `PATCH` Handler**:
    - In the new API route file, export an async `PATCH` function that accepts the Astro `APIContext`.
    - Retrieve the `id`, request body, user, and Supabase client.
    - Use the `zod` schema to validate the input.
    - Wrap the call to `reservationsService.updateReservation` in a `try...catch` block.
    - In the `try` block, return a `200 OK` response with the data from the service.
    - In the `catch` block, inspect the error type and return the appropriate HTTP error response (400, 403, 404, 409, 500).
6.  **Add `prerender` flag**: Add `export const prerender = false;` to the API route file to ensure it is treated as a dynamic endpoint.
