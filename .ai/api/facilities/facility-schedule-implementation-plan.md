# API Endpoint Implementation Plan: GET /api/facilities/{id}/schedule

## 1. Endpoint Overview
This endpoint provides the daily schedule for a specific sports facility. It requires authentication and returns the facility's basic information, and a list of all confirmed reservations for a given date. The visibility of user information within the reservation list is controlled based on the requesting user's role, ensuring data privacy.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/facilities/{id}/schedule`
- **Parameters**:
  - **Path (Required)**:
    - `id` (integer): The unique identifier for the facility.
  - **Query (Required)**:
    - `date` (string): The date for the schedule in `YYYY-MM-DD` format.
- **Request Body**: None.

## 3. Used Types
This endpoint will use and require modifications to types defined in `src/types.ts`:
- `FacilityScheduleDTO`: The main response object.
- `FacilityInfo`: For the nested `facility` object in the response.
- `ScheduleReservationDTO`: For each object within the `reservations` array.
- `ErrorResponse`: For standardized error reporting.

## 4. Response Details
- **Success (200 OK)**:
  ```json
  {
    "facility": { "id": 1, "name": "Tennis Court A" },
    "date": "2025-10-15",
    "reservations": [
      {
        "id": 100,
        "start_time": "2025-10-15T14:00:00Z",
        "duration": "01:30:00",
        "end_time": "2025-10-15T15:30:00Z",
        "status": "confirmed",
        "user": { "email": "user@example.com" }
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: For invalid `id` or `date` format.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the facility with the specified `id` does not exist.
  - `500 Internal Server Error`: For any unexpected server-side issues.

## 5. Data Flow
1. A `GET` request is made to `/api/facilities/{id}/schedule?date=YYYY-MM-DD`.
2. Astro's middleware intercepts the request to verify user authentication via `Astro.cookies`.
3. The API route handler in `src/pages/api/facilities/[id]/schedule.ts` is invoked.
4. The handler uses Zod to parse and validate the `id` from the path and the `date` from the query string.
5. The handler calls the `getFacilitySchedule` function in the `facilities.service.ts`, passing the Supabase client instance, facility ID, and date.
6. The `getFacilitySchedule` service function executes a Supabase query to:
   a. Fetch the facility's `id` and `name` from the `facilities` table. If not found, it throws a "Not Found" error.
   b. Fetch all reservations from the `reservations` table that match the `facility_id` and the given `date`, and have a status of `'confirmed'`. The query will join with the `auth.users` table to retrieve the email for each reservation's user.
7. The service function processes the results, calculating the `end_time` for each reservation, and returns the structured data to the handler.
8. The handler receives the data and applies authorization logic: it iterates through the reservations and sets the `user` field to `null` unless the requesting user is an admin or is the owner of the reservation.
9. The handler constructs the final `FacilityScheduleDTO` object.
10. A `200 OK` response with the JSON payload is sent to the client.

## 6. Security Considerations
- **Authentication**: The endpoint must be protected. The handler will check for a valid user session in `context.locals.user`.
- **Authorization**: The logic to conditionally expose `user.email` must be securely implemented in the API route handler. It will use the requesting user's ID and role (from the JWT in `context.locals.user`) to determine visibility for each reservation.
- **Input Validation**: All inputs (`id`, `date`) will be strictly validated using Zod to prevent malicious input from affecting database queries.

## 7. Implementation Steps
1.  **Create Service Function**: In `src/lib/services/facilities.service.ts`, implement the `getFacilitySchedule` async function. This function will contain the Supabase queries to fetch facility and reservation data. It should handle the case where a facility is not found.
2.  **Create API Endpoint File**: Create the new file `src/pages/api/facilities/[id]/schedule.ts`.
3.  **Implement Input Validation**: In the new endpoint file, define Zod schemas to validate the `id` path parameter and the `date` query parameter.
4.  **Implement GET Handler**:
    -   Create an `async function GET({ params, url, context })` handler.
    -   Ensure `export const prerender = false;` is set.
    -   Check `context.locals.user` to verify authentication.
    -   Use the Zod schemas to validate `params` and `url.searchParams`. Return a `400` error on failure.
5.  **Integrate Service**: Call the `getFacilitySchedule` service function with the validated data. Wrap this call in a try/catch block to handle errors (e.g., "Not Found" from the service, database errors).
6.  **Apply Authorization Logic**: Process the reservations returned from the service. Based on the `context.locals.user`'s ID and role, conditionally include the `user` object in each reservation.
7.  **Construct Final Response**: Assemble the final response object conforming to the `FacilityScheduleDTO` and return it with a `200 OK` status.
8.  **Testing**: Add integration tests to verify the endpoint's functionality, including correct data retrieval, proper error handling for invalid inputs, and correct application of the authorization logic for user email visibility.
