# API Endpoint Implementation Plan: GET /api/facilities/{id}

## 1. Endpoint Overview
This endpoint retrieves the details of a single sports facility identified by its unique ID. It is a read-only operation that requires the user to be authenticated.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/facilities/{id}`
- **Parameters**:
  - **Path Parameters**:
    - `id` (integer, required): The unique identifier for the facility.
- **Request Body**: None.

## 3. Used Types
- **Success Response**: `FacilityDTO` from `src/types.ts`.
- **Error Response**: `ErrorResponse` from `src/types.ts`.

## 4. Response Details
- **Success (200 OK)**: Returns a JSON object representing the facility.
  ```json
  {
    "id": 1,
    "name": "Tennis Court A",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the `id` parameter is invalid.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If no facility with the specified `id` exists.
  - `500 Internal Server Error`: For unexpected server-side errors.

## 5. Data Flow
1. A client sends a `GET` request to `/api/facilities/{id}`.
2. The Astro middleware (`src/middleware/index.ts`) verifies the user's session and attaches the Supabase client and user context to `context.locals`.
3. The API route handler at `src/pages/api/facilities/[id].ts` is executed.
4. The handler validates that the `id` parameter is a positive integer using Zod.
5. The handler calls the `getFacilityById` function in `src/lib/services/facilities.service.ts`, passing the validated `id` and the `supabase` client from `context.locals`.
6. The service function executes a `SELECT` query on the `facilities` table to find the facility with the matching `id`.
7. The service function returns the facility object if found, otherwise `null`.
8. The API handler checks the service's return value and sends the appropriate JSON response:
   - If a facility is returned, it sends a `200 OK` response with the `FacilityDTO` payload.
   - If `null` is returned, it sends a `404 Not Found` response.

## 6. Security Considerations
- **Authentication**: The endpoint must verify that `context.locals.user` exists, ensuring that only authenticated users can proceed. If not, a `401 Unauthorized` error will be returned.
- **Authorization**: No specific roles are required. Any authenticated user is authorized to access this resource.
- **Input Validation**: The `id` path parameter will be strictly validated to be a positive integer to prevent invalid data from being processed.
- **Data Access**: The Supabase client will be used to query the database, which prevents SQL injection vulnerabilities through parameterized queries.

## 7. Error Handling
A structured error handling approach will be implemented:
- **Validation Errors**: A Zod schema will catch malformed `id` parameters, resulting in a `400 Bad Request`.
- **Authentication Errors**: A check for `context.locals.user` will guard the endpoint, returning a `401 Unauthorized`.
- **Resource Not Found**: If the service layer returns `null`, the handler will return a `404 Not Found`.
- **Server Errors**: A `try...catch` block will wrap the main logic to handle any unexpected exceptions (e.g., database connection issues), returning a `500 Internal Server Error` and logging the error to the console.

## 8. Performance Considerations
- The database query uses the primary key (`id`) for the lookup, which is highly efficient and will be indexed by default in PostgreSQL.
- The data payload is small and no complex joins or computations are required.
- No significant performance bottlenecks are anticipated for this endpoint.

## 9. Implementation Steps
1. **Define Validation Schema**: Create a Zod schema to validate that the `id` path parameter is a positive integer.
2. **Implement Service Function**:
   - In `src/lib/services/facilities.service.ts`, create an async function `getFacilityById(id: number, supabase: SupabaseClient): Promise<Facility | null>`.
   - This function will query the `facilities` table using `supabase.from('facilities').select().eq('id', id).single()`.
   - It will return the facility object on success or `null` if not found.
3. **Create API Route Handler**:
   - In `src/pages/api/facilities/[id].ts`, implement the `GET` request handler.
4. **Add Authentication Check**:
   - At the beginning of the `GET` handler, check if `context.locals.user` is present. If not, return a `401 Unauthorized` response.
5. **Validate Input**:
   - Use the Zod schema to parse and validate `context.params.id`. If validation fails, return a `400 Bad Request` response with error details.
6. **Call Service and Handle Response**:
   - Wrap the logic in a `try...catch` block.
   - Call `await getFacilityById(...)` with the validated ID.
   - If the result is `null`, return a `404 Not Found` response.
   - If a facility is returned, send a `200 OK` response with the facility data.
7. **Handle Server Errors**:
   - In the `catch` block, log the error to the console and return a `500 Internal Server Error` response.
