# API Endpoint Implementation Plan: GET /api/reservations/{id}

## 1. Endpoint Overview
This endpoint retrieves the details of a specific reservation identified by its ID. It requires user authentication and enforces authorization rules, ensuring that users can only access their own reservations unless they have administrative privileges.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/reservations/{id}`
- **Parameters**:
  - **Required**:
    - `id` (Path Parameter, integer): The unique identifier for the reservation.
- **Request Body**: None.

## 3. Used Types
- **`ReservationDetailDTO`**: For the successful response payload, detailing the reservation and its associated facility.
- **`ErrorResponse`**: For standardized error reporting.
- **`AppRole`**: To check user roles for authorization.

## 4. Response Details
- **Success (200 OK)**:
  - **Payload**: A JSON object conforming to the `ReservationDetailDTO` type.
  ```json
  {
    "id": 100,
    "facility": {
      "id": 1,
      "name": "Tennis Court A"
    },
    "start_time": "2025-10-15T14:00:00Z",
    "duration": "01:30:00",
    "end_time": "2025-10-15T15:30:00Z",
    "status": "confirmed",
    "cancellation_message": null,
    "created_at": "2025-10-12T10:30:00Z",
    "updated_at": "2025-10-12T10:30:00Z"
  }
  ```
- **Error**:
  - `400 Bad Request`: Invalid `id` format.
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User is not authorized to view the reservation.
  - `404 Not Found`: The reservation with the specified `id` does not exist.
  - `500 Internal Server Error`: Unexpected server-side error.

## 5. Data Flow
1. A `GET` request is made to `/api/reservations/{id}`.
2. The Astro middleware (`src/middleware/index.ts`) intercepts the request to verify the user's authentication status using the Supabase session. If the user is not authenticated, it returns a `401` response.
3. The API route handler in `src/pages/api/reservations/[id].ts` receives the request.
4. The handler validates the `id` path parameter to ensure it is a positive integer. If not, it returns a `400` response.
5. The handler calls the `getReservationDetails` function in the `reservations.service.ts`.
6. The service function executes a Supabase query to fetch the reservation with the given `id`, joining with the `facilities` table to get the facility name.
7. The service checks if a reservation was found. If not, it throws a "Not Found" error.
8. The service checks the user's role. If the user is not an admin, it verifies that the `user_id` on the reservation matches the authenticated user's ID. If they do not match, it throws a "Forbidden" error.
9. The service computes the `end_time` by adding the `duration` to the `start_time`.
10. The service maps the query result to the `ReservationDetailDTO` format and returns it to the handler.
11. The route handler sends the `ReservationDetailDTO` back to the client with a `200 OK` status.

## 6. Security Considerations
- **Authentication**: The route will be protected by the existing Astro middleware, which validates the Supabase JWT.
- **Authorization**: The service layer will implement strict ownership checks. The user's role will be fetched from the `user_roles` table to determine if they are an `admin`. Non-admin users can only access reservations where `reservation.user_id` matches their session `user.id`.
- **Input Validation**: The `id` parameter will be sanitized and validated using Zod to prevent potential injection attacks or unexpected behavior from invalid input.

## 7. Implementation Steps
1.  **Create Service File**:
    - Create a new file: `src/lib/services/reservations.service.ts`.
2.  **Implement `getReservationDetails` Service Function**:
    - Inside `reservations.service.ts`, create an async function `getReservationDetails(id: number, supabase: SupabaseClient, user: User)`.
    - The function should perform a Supabase query to select a reservation by `id` and join the `facilities` table to include `facility.id` and `facility.name`.
    - **Query**: `supabase.from('reservations').select('*, facility:facilities(id, name)').eq('id', id).single()`
    - If the query returns no data, throw a custom `NotFoundError`.
    - Fetch the user's role from the `user_roles` table.
    - If the user's role is not `'admin'`, compare `reservation.user_id` with `user.id`. If they don't match, throw a custom `ForbiddenError`.
    - Calculate the `end_time`.
    - Format the data into a `ReservationDetailDTO` and return it.
3.  **Create API Route File**:
    - Create a new file: `src/pages/api/reservations/[id].ts`.
4.  **Implement API Route Handler**:
    - Export `prerender = false`.
    - Define an `async` function for the `GET` method that accepts the `APIContext`.
    - Use `context.locals.user` to get the authenticated user session. (Middleware must provide this).
    - Parse and validate the `id` parameter from `context.params.id` using a Zod schema.
    - Wrap the call to the service function in a `try...catch` block to handle potential errors.
    - Call `reservationsService.getReservationDetails(...)` with the validated ID and Supabase client instance from `context.locals.supabase`.
    - On success, return a `200 OK` JSON response with the DTO.
    - In the `catch` block, check the type of error (e.g., `NotFoundError`, `ForbiddenError`) and return the corresponding `404` or `403` error response. For generic errors, return a `500` response.
