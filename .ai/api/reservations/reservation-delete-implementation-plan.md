# API Endpoint Implementation Plan: DELETE /api/reservations/{id}

## 1. Endpoint Overview
This endpoint allows an authenticated user to cancel their own reservation. The cancellation is subject to specific business rules: the user must be the owner of the reservation, the reservation must be in a "confirmed" state, and the cancellation request must be made more than 12 hours before the reservation's scheduled start time.

## 2. Request Details
- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/reservations/{id}`
- **Parameters**:
  - **Path Parameters**:
    - `id` (integer, required): The unique identifier for the reservation to be canceled.
- **Request Body**: None.

## 3. Used Types
- **`ErrorResponse`**: Standard interface for returning error details.
  ```typescript
  // src/types.ts
  export interface ErrorResponse {
    error: string;
    message: string;
  }
  ```

## 4. Response Details
- **Success**:
  - **Status Code**: `204 No Content`
  - **Body**: Empty.
- **Error**:
  - **Status Code**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`
  - **Body**: `ErrorResponse` object.
    ```json
    {
      "error": "Forbidden",
      "message": "Specific reason for the failure."
    }
    ```

## 5. Data Flow
1. The client sends a `DELETE` request to `/api/reservations/{id}`.
2. Astro's middleware (`src/middleware/index.ts`) intercepts the request to verify the user's session and attaches the Supabase client and session info to `Astro.locals`.
3. The API route handler at `src/pages/api/reservations/[id].ts` receives the request.
4. The handler validates the `id` parameter using `zod`.
5. The handler retrieves the authenticated user's ID from `Astro.locals.session`.
6. The handler calls the `cancelUserReservation` function in `reservations.service.ts`, passing the `reservationId`, `userId`, and the `supabase` client instance.
7. The `reservations.service.ts` function executes the core logic:
    a. Fetches the reservation from the `reservations` table using the provided `id`.
    b. If not found, it throws a "Not Found" error.
    c. It verifies that the `user_id` from the reservation matches the `userId` from the session. If not, it throws a "Forbidden" error.
    d. It checks if the reservation `status` is 'confirmed'. If not, it throws a "Forbidden" error.
    e. It calculates the difference between the current time and the reservation's `start_time`. If less than 12 hours, it throws a "Forbidden" error.
    f. If all checks pass, it executes a `DELETE` query on the `reservations` table for the given `id`.
8. The API handler catches any errors thrown by the service and maps them to the appropriate HTTP error response.
9. If the service function completes successfully, the handler returns a `204 No Content` response.

## 6. Security Considerations
- **Authentication**: Access is restricted to authenticated users. The middleware will reject any requests without a valid session, returning a `401 Unauthorized` error.
- **Authorization**: The service layer must enforce that a user can only cancel their own reservations by comparing `reservations.user_id` with the session's `user.id`. This prevents Insecure Direct Object Reference (IDOR) vulnerabilities.
- **Input Validation**: The `id` path parameter will be strictly validated using `zod` to ensure it is a positive integer, preventing potential SQL injection or unexpected behavior from invalid input.

## 7. Error Handling
The endpoint will return specific error responses based on the failure condition:
- `400 Bad Request`: If the `id` parameter is invalid (e.g., not a number, negative).
- `401 Unauthorized`: If the request lacks a valid authentication token.
- `403 Forbidden`:
  - If the user is not the owner of the reservation. Message: "You are not authorized to perform this action."
  - If the reservation is not in 'confirmed' status. Message: "This reservation cannot be canceled."
  - If the request is made less than 12 hours before the start time. Message: "Reservations can only be canceled more than 12 hours before start time."
- `404 Not Found`: If no reservation exists with the given `id`.
- `500 Internal Server Error`: For any unexpected server-side issues, such as a database connection failure. A generic error message will be returned to the client.

## 8. Implementation Steps
1. **Create Service File**:
   - Create a new file: `src/lib/services/reservations.service.ts`.
2. **Implement Service Function**:
   - In `reservations.service.ts`, create an async function `cancelUserReservation({ reservationId, userId, supabase })`.
   - This function will contain the full data fetching, validation, and deletion logic described in the "Data Flow" section.
   - It should throw custom errors (e.g., `NotFoundError`, `ForbiddenError`) to be caught by the route handler.
3. **Create API Route**:
   - Create the API route file: `src/pages/api/reservations/[id].ts`.
4. **Implement DELETE Handler**:
   - Add `export const prerender = false;`.
   - Implement the `DELETE({ params, locals })` function.
   - Use a `try...catch` block for error handling.
   - **Inside `try`**:
     - Use `zod` to parse `params.id` into a positive integer.
     - Check for a valid session on `locals.session`. If not present, return a `401 Unauthorized` response.
     - Call `reservationsService.cancelUserReservation` with the validated `id`, user ID from the session, and the `locals.supabase` client.
     - If successful, return a new `Response(null, { status: 204 })`.
   - **Inside `catch`**:
     - Catch `zod` errors and return a `400 Bad Request` response.
     - Catch custom errors from the service and return the appropriate `403`, `404`, or `500` response with a JSON body.
     - Log the error to the console.
