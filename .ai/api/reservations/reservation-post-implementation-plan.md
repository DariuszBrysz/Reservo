# API Endpoint Implementation Plan: POST /api/reservations

## 1. Endpoint Overview
This endpoint allows authenticated users to create a new reservation for a sports facility. It validates the reservation details against a set of business rules, checks for scheduling conflicts, and inserts a new record into the `reservations` table upon successful validation.

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/api/reservations`
- **Parameters**: None (all data is in the request body)
- **Request Body**: The request body must be a JSON object conforming to the `CreateReservationCommand` model.

  ```json
  {
    "facility_id": 1,
    "start_time": "2025-10-15T14:00:00Z",
    "duration": "01:30:00"
  }
  ```

## 3. Used Types
- **Command Model**: `CreateReservationCommand` from `src/types.ts` will be used to type the request payload.
- **DTO**: `ReservationDTO` from `src/types.ts` will be used as the structure for the successful response payload.

## 4. Data Flow
1.  A `POST` request is sent to `/api/reservations` with the reservation details in the request body.
2.  The Astro middleware (`src/middleware/index.ts`) intercepts the request to verify the user's authentication status using `Astro.locals.supabase`. If the user is not authenticated, it returns a `401 Unauthorized` error. The authenticated user's ID is attached to `Astro.locals.user`.
3.  The API route handler in `src/pages/api/reservations/index.ts` receives the request.
4.  A Zod schema is used to parse and validate the request body against the defined validation rules (data types, format, and business logic). If validation fails, a `400 Bad Request` response is returned with a descriptive error message.
5.  The validated data and the user ID are passed to a new service method, `ReservationsService.createReservation()`.
6.  The `createReservation` method performs the following actions:
    a.  Verifies that the `facility_id` exists in the `facilities` table. If not, it throws a "Not Found" error, which the handler will convert to a `404 Not Found` response.
    b.  It constructs a new reservation object, including the `user_id` from the authenticated session.
    c.  It calls the Supabase client to `insert` the new reservation into the `reservations` table.
7.  The database has a trigger to prevent double-bookings. If the `insert` operation violates this constraint, Supabase will return a PostgreSQL error. The service layer must catch this specific error and re-throw a custom "Conflict" error.
8.  The API route handler catches the "Conflict" error and returns a `409 Conflict` response.
9.  On successful insertion, the `createReservation` method queries and returns the newly created reservation, including the computed `end_time`.
10. The API route handler receives the new reservation object, formats it as a `ReservationDTO`, and returns a `201 Created` response with the DTO in the body.

## 5. Security Considerations
- **Authentication**: All requests to this endpoint must be authenticated. The middleware will reject any request without a valid Supabase session token.
- **Authorization**: Any authenticated user is authorized to create a reservation. The `user_id` for the new reservation must be sourced from the authenticated session (`Astro.locals.user.id`), not from the request body, to prevent users from making reservations on behalf of others.
- **Input Validation**: All incoming data will be strictly validated using a Zod schema to prevent invalid data from being processed and stored. This mitigates risks such as NoSQL injection (though we use PostgreSQL) and other data integrity issues.
- **SQL Injection**: All database interactions will use the Supabase client's query builder, which uses parameterized queries, effectively preventing SQL injection attacks. No raw SQL queries will be used.

## 6. Error Handling
The endpoint will return specific HTTP status codes and error messages for different failure scenarios.

| Status Code | Reason | Error Response Example |
| :--- | :--- | :--- |
| `400 Bad Request` | The request body is malformed, or the data fails business rule validation (e.g., invalid time, duration too short). | `{ "error": "Bad Request", "message": "Reservation start time must be in the future." }` |
| `401 Unauthorized`| The request lacks a valid authentication token. | `{ "error": "Unauthorized", "message": "Authentication required." }` |
| `404 Not Found` | The `facility_id` specified in the request does not correspond to an existing facility. | `{ "error": "Not Found", "message": "Facility with ID 1 not found." }` |
| `409 Conflict` | The requested time slot for the facility is already reserved. | `{ "error": "Conflict", "message": "Sorry, this time slot is no longer available. Please select another time." }` |
| `500 Internal Server Error` | An unexpected server-side error occurred, such as a database connection failure. | `{ "error": "Internal Server Error", "message": "An unexpected error occurred." }` |

## 7. Implementation Steps
1.  **Create Service File**: Create a new file `src/lib/services/reservations.service.ts`.
2.  **Define Zod Schema**: In `reservations.service.ts`, define a comprehensive Zod schema to validate the `CreateReservationCommand` payload. This schema should include `.refine()` calls for all business logic rules specified in the API documentation (future time, 7-day window, 14:00-22:00 time window, 15-minute intervals for start time and duration, end time before 22:00).
3.  **Implement `createReservation` Service Method**:
    -   Create a `createReservation` function within `reservations.service.ts`.
    -   It should accept the validated `CreateReservationCommand` data and the `userId` as arguments.
    -   It will also require an instance of the `SupabaseClient`.
    -   First, query the `facilities` table to ensure the `facility_id` exists. If not, throw a custom `NotFoundError`.
    -   Use the Supabase client to `insert` the reservation data into the `reservations` table.
    -   Wrap the `insert` call in a `try...catch` block. In the `catch` block, check for a PostgreSQL unique violation error (code `23505`) and throw a custom `ConflictError` if detected. Re-throw other errors.
    -   After a successful insert, query for the newly created record and return it.
4.  **Create API Route Handler**:
    -   Create a new file `src/pages/api/reservations/index.ts`.
    -   Add `export const prerender = false;` as per project rules.
    -   Implement the `POST` handler function.
5.  **Integrate Service in API Handler**:
    -   In the `POST` handler, get the Supabase client and user session from `context.locals`. Redirect or return 401 if no user.
    -   Parse the request body using `await context.request.json()`.
    -   Validate the body using the Zod schema from the reservations service. If validation fails, return a `400` response with Zod's error messages.
    -   Call `ReservationsService.createReservation()` with the validated data and user ID.
    -   Use a `try...catch` block to handle potential `NotFoundError` and `ConflictError` from the service, returning `404` and `409` responses respectively.
    -   On success, calculate the `end_time` for the response DTO.
    -   Return a `201 Created` response with the reservation data formatted as `ReservationDTO`.
