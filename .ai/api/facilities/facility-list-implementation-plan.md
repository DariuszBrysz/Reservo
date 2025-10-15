# API Endpoint Implementation Plan: GET /api/facilities

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /api/facilities` REST API endpoint. The endpoint's purpose is to retrieve a comprehensive list of all sports facilities available for reservation. Access to this endpoint is restricted to authenticated users.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/api/facilities`
- **Parameters**:
  - **Required**: None
  - **Optional**: None
- **Request Body**: None

## 3. Used Types
The implementation will use the following Data Transfer Objects (DTOs) defined in `src/types.ts`:
- `FacilityListDTO`: For the successful response payload, containing the list of facilities.
- `FacilityDTO`: For the individual facility objects within the list.
- `ErrorResponse`: For structuring error response payloads.

## 4. Response Details
### Success Response (200 OK)
- **Description**: Returned when the list of facilities is successfully retrieved.
- **Content-Type**: `application/json`
- **Body**: `FacilityListDTO`
- **Example**:
  ```json
  {
    "facilities": [
      {
        "id": 1,
        "name": "Tennis Court A",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
      },
      {
        "id": 2,
        "name": "Squash Court",
        "created_at": "2025-02-20T14:30:00Z",
        "updated_at": "2025-02-20T14:30:00Z"
      }
    ]
  }
  ```

### Error Responses
- **401 Unauthorized**:
  - **Description**: Returned if the request is made without a valid authentication token.
  - **Body**: `ErrorResponse`
  - **Example**:
    ```json
    {
      "error": "Unauthorized",
      "message": "Authentication required"
    }
    ```
- **500 Internal Server Error**:
  - **Description**: Returned if an unexpected server-side error occurs, such as a database failure.
  - **Body**: `ErrorResponse`
  - **Example**:
    ```json
    {
      "error": "Internal Server Error",
      "message": "An unexpected error occurred. Please try again later."
    }
    ```

## 5. Data Flow
1.  A client sends a `GET` request to `/api/facilities`.
2.  The Astro middleware at `src/middleware/index.ts` intercepts the request to perform authentication by validating the user's Supabase session. If authentication fails, it immediately returns a `401 Unauthorized` response.
3.  Upon successful authentication, the request is forwarded to the API route handler located at `src/pages/api/facilities/index.ts`.
4.  The handler invokes the `FacilityService.getAllFacilities()` method, passing the `SupabaseClient` instance from `Astro.locals`.
5.  The `getAllFacilities` method, located in `src/lib/services/facility.service.ts`, executes a database query to select all records from the `facilities` table.
6.  The service method returns an array of facility records to the route handler.
7.  The handler constructs the `FacilityListDTO` payload and sends a `200 OK` JSON response to the client.

## 6. Security Considerations
- **Authentication**: All requests to this endpoint must be authenticated. This is enforced by the global Astro middleware, which validates the Supabase session token from the request headers.
- **Authorization**: Any user with a valid authentication token is authorized to access this endpoint. No specific role-based access control is required for listing facilities.
- **Input Sanitization**: Not applicable, as this endpoint does not process any user input.
- **Data Exposure**: The endpoint only exposes non-sensitive information (`id`, `name`, `created_at`, `updated_at`), which is safe for client consumption.

## 7. Implementation Steps
1.  **Create Service File**: Create a new file at `src/lib/services/facility.service.ts` to house the business logic for facility-related operations.
2.  **Implement `FacilityService`**:
    -   Inside `facility.service.ts`, define a `FacilityService` class.
    -   Add a static method `async getAllFacilities(supabase: SupabaseClient): Promise<Facility[]>` that:
        -   Queries the `facilities` table using the provided Supabase client.
        -   Selects all columns.
        -   Includes robust error handling for the database query. If an error occurs, it should be logged and re-thrown to be caught by the API handler.
        -   Returns the array of facilities on success.
3.  **Create API Route**: Create a new file at `src/pages/api/facilities/index.ts` to define the endpoint.
4.  **Implement `GET` Handler**:
    -   In `index.ts`, export an `async` function named `GET` that accepts the `APIContext`.
    -   Set `export const prerender = false;` to ensure the route is processed dynamically at request time.
    -   Retrieve the `supabase` client from `context.locals`.
    -   Call `FacilityService.getAllFacilities(supabase)`.
    -   Use a `try...catch` block to handle potential errors from the service.
    -   On success, format the data into the `FacilityListDTO` structure and return a `200 OK` JSON response.
    -   In the `catch` block, log the error and return a `500 Internal Server Error` JSON response.
