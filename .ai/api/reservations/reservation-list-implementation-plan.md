# API Endpoint Implementation Plan: GET /api/reservations

## 1. Endpoint Overview
This endpoint retrieves a paginated list of reservations. It is designed to serve both regular users, who can only view their own reservations, and admin users, who can view all reservations across the system. The endpoint provides robust filtering capabilities based on reservation status, facility, and time.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/reservations`
- **Parameters**:
  - **Optional**:
    - `all` (boolean): If `true`, retrieves reservations for all users. This parameter is restricted to admin users. Defaults to `false`.
    - `status` (string): Filters reservations by status. Allowed values are `confirmed` or `canceled`.
    - `upcoming` (boolean): If `true`, returns only reservations with a `start_time` in the future. Defaults to `true`.
    - `facility_id` (integer): Filters reservations for a specific facility ID.
    - `limit` (integer): Specifies the number of results per page. Defaults to `50`, with a maximum value of `100`.
    - `offset` (integer): Specifies the starting index for pagination. Defaults to `0`.

## 3. Used Types
The implementation will use the following types defined in `src/types.ts`:
- `ReservationListDTO`: The root object for the response payload.
- `ReservationDetailDTO`: Defines the structure of each reservation item.
- `FacilityInfo`: Represents the nested facility data within a reservation.
- `PaginationDTO`: Defines the structure of the pagination metadata.
- `GetReservationsQuery`: Represents the validated query parameters.
- `ErrorResponse`: The standard structure for JSON error responses.

## 4. Response Details
- **Success (200 OK)**:
  - **Payload**: A JSON object conforming to the `ReservationListDTO` type.
  ```json
  {
    "reservations": [
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
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  }
  ```
- **Error**:
  - **Payload**: A JSON object conforming to the `ErrorResponse` type. Example for a 403 Forbidden error:
  ```json
  {
    "error": "Forbidden",
    "message": "Insufficient permissions"
  }
  ```

## 5. Data Flow
1.  A `GET` request is made to `/api/reservations`.
2.  Astro middleware verifies the user's authentication status. If the user is not authenticated, it returns a `401 Unauthorized` error.
3.  The `GET` handler in `src/pages/api/reservations/index.ts` receives the request.
4.  URL query parameters are parsed and validated against a Zod schema. If validation fails, a `400 Bad Request` error is returned.
5.  The handler checks if the `all=true` parameter is present. If so, it verifies that the authenticated user has the `reservations.view_all` permission by calling a database function. If the user lacks permission, a `403 Forbidden` error is returned.
6.  The validated parameters and user context are passed to the `getReservations` function in the `reservations.service.ts`.
7.  The service constructs a Supabase query to fetch reservations and their related facility data.
    - The query is dynamically built to include filters for `status`, `upcoming` (`start_time`), and `facility_id`.
    - Row-Level Security (RLS) policies in Supabase automatically restrict the query to the current user's reservations unless the query is run with an admin role that bypasses RLS.
    - Pagination is applied using `.range()`.
8.  The service executes the query along with a request for the total count (`{ count: 'exact' }`) to populate pagination metadata.
9.  The database results are mapped to an array of `ReservationDetailDTO` objects. During this mapping, the `end_time` for each reservation is computed by adding its `duration` to its `start_time`.
10. The service constructs and returns the final `ReservationListDTO` object.
11. The endpoint handler sends the `ReservationListDTO` as a JSON response with a `200 OK` status.
12. Any unexpected errors during this process are caught, logged to the console, and a `500 Internal Server Error` is returned to the client.

## 6. Security Considerations
- **Authentication**: Handled by Astro middleware, ensuring that only authenticated users can access the endpoint.
- **Authorization**: Access to all reservations (`all=true`) is strictly controlled by checking for the `reservations.view_all` permission. This prevents unauthorized data exposure.
- **Data Segregation**: Supabase RLS policies are the primary mechanism for ensuring users can only access their own data.
- **Input Validation**: All query parameters are rigorously validated using Zod to prevent invalid data from affecting the query logic and to protect against potential DoS vectors (e.g., an excessively large `limit`).

## 7. Error Handling
- **400 Bad Request**: Invalid or malformed query parameters.
- **401 Unauthorized**: User is not authenticated.
- **403 Forbidden**: A non-admin user attempts to use the `all=true` parameter.
- **500 Internal Server Error**: Database connection failures or other unexpected server-side exceptions.

## 8. Implementation Steps
1.  **Create Service File**: Create the file `src/lib/services/reservations.service.ts`.
2.  **Create API Route**: Create the file `src/pages/api/reservations/index.ts`.
3.  **Define Validation Schema**: In `reservations.service.ts` (or a shared validation module), define a Zod schema to validate and parse the query parameters, including defaults and coercions.
4.  **Implement `reservations.service.ts`**:
    -   Create the `getReservations` function that accepts a Supabase client instance and the validated query parameters.
    -   Inside the function, build the Supabase query dynamically based on the provided filters.
    -   Select reservation columns and related facility data (`facilities (id, name)`).
    -   Apply pagination using `.range(offset, offset + limit - 1)`.
    -   Execute the query to get both the data and the total count.
    -   Map the results to `ReservationDetailDTO[]`, ensuring the `end_time` is calculated.
    -   Return the complete `ReservationListDTO` object.
5.  **Implement API Route Handler (`index.ts`)**:
    -   Add `export const prerender = false;`.
    -   Implement the `GET` function which receives the `APIContext`.
    -   Retrieve the `supabase` client and `session` from `context.locals`. Return `401` if no session exists.
    -   Parse and validate the URL's search parameters using the Zod schema. Return `400` on failure.
    -   If `all=true`, check if the user is an admin. This may involve calling a helper or a database function. Return `403` if the user is not an admin.
    -   Invoke the `getReservations` service function with the necessary arguments.
    -   Wrap the service call in a `try/catch` block to handle unexpected errors and return a `500` status code if necessary.
    -   Return the data from the service as a JSON response with a `200` status code.
6.  **Database Function (Recommended)**:
    -   Create a PostgreSQL function `has_permission(p_user_id uuid, p_permission app_permission)` that returns a boolean.
    -   This function will check the `user_roles` and `role_permissions` tables to determine if the user has the specified permission.
    -   Call this function from the API route handler for the admin check.
7.  **Database Indexing**:
    -   Verify that indexes are in place on foreign keys (`facility_id`, `user_id`) and frequently queried columns (`start_time`, `status`) in the `reservations` table.
