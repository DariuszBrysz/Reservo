# View Implementation Plan: Facility List

## 1. Overview
This document outlines the implementation plan for the Facility List view. This view serves as the application's main entry point after authentication, displaying a list of all available sports facilities. Users can select a facility from this list to navigate to its detailed schedule and begin the reservation process. The view will handle loading states, empty states (no facilities available), and potential error scenarios.

## 2. View Routing
-   **Path**: `/`
-   The view will be implemented as the main index page of the application.

## 3. Component Structure
The view will be composed of the following components in a hierarchical structure:

```
src/layouts/Layout.astro
└── src/pages/index.astro
    └── src/components/views/FacilityListView.tsx (client:load)
        ├── src/components/ui/skeleton.tsx (Rendered during loading)
        └── src/components/FacilityCard.tsx (Rendered for each facility)
            └── src/components/ui/card.tsx (Shadcn/ui)
```

## 4. Component Details

### `src/pages/index.astro`
-   **Component description**: The main Astro page for the root URL. It provides the static page shell and includes the primary client-side React component.
-   **Main elements**:
    -   `Layout`: The main application layout.
    -   `FacilityListView`: The client-side React component, included with a `client:load` directive to make it interactive.
-   **Handled interactions**: None.
-   **Handled validation**: None.
-   **Types**: None.
-   **Props**: None.

### `src/components/views/FacilityListView.tsx`
-   **Component description**: A client-side React component responsible for fetching and rendering the list of facilities. It manages all view states, including loading, success (with and without data), and error.
-   **Main elements**:
    -   A container `div`.
    -   Conditionally renders a grid of `Skeleton` components during the initial data fetch.
    -   Conditionally renders a "No facilities available" message if the fetched list is empty.
    -   Conditionally renders an error message if the API call fails.
    -   Maps over the fetched facility data to render a list of `FacilityCard` components.
-   **Handled interactions**: Triggers data fetching on component mount.
-   **Handled validation**: Checks if the fetched facilities array is empty to display the appropriate message.
-   **Types**:
    -   DTO: `FacilityListDTO`, `ErrorResponse`
    -   ViewModel: `FacilityViewModel`
-   **Props**: None.

### `src/components/FacilityCard.tsx`
-   **Component description**: A presentational component that displays information for a single facility and links to its schedule page.
-   **Main elements**:
    -   An `<a>` tag for navigation to `/facilities/[id]`.
    -   A `Card` component from Shadcn/ui to structure the content.
    -   Displays the facility's name.
-   **Handled interactions**: `click` event, which is handled by the `<a>` tag to navigate the user.
-   **Handled validation**: None.
-   **Types**:
    -   ViewModel: `FacilityViewModel`
-   **Props**:
    -   `facility: FacilityViewModel`

## 5. Types

### DTOs (from API)
-   `FacilityListDTO`: The expected response object from the `GET /api/facilities` endpoint.
    ```typescript
    import type { FacilityDTO } from "./types";

    export interface FacilityListDTO {
      facilities: FacilityDTO[];
    }
    ```
-   `FacilityDTO`: Represents a single facility as defined by the backend.
    ```typescript
    export interface FacilityDTO {
      id: number;
      name: string;
      created_at: string;
      updated_at: string;
    }
    ```

### ViewModels (for UI)
-   `FacilityViewModel`: A simplified version of `FacilityDTO` containing only the data necessary for the UI. This promotes separation between the API data layer and the view layer.
    ```typescript
    export interface FacilityViewModel {
      id: number;
      name: string;
    }
    ```

## 6. State Management
State will be managed within the `FacilityListView` component using a custom React hook, `useFacilities`.

### `hooks/useFacilities.ts`
-   **Purpose**: To encapsulate the logic for fetching facilities, managing loading and error states, and transforming the DTOs into ViewModels.
-   **State**:
    -   `data: FacilityViewModel[] | null`: Stores the list of facilities.
    -   `isLoading: boolean`: Tracks the data fetching status.
    -   `error: Error | null`: Stores any errors from the API call.
-   **Functionality**: It will use a `useEffect` hook to fetch data from `/api/facilities` when the component mounts. The fetched `FacilityDTO[]` will be mapped to `FacilityViewModel[]` before being set in the state.

## 7. API Integration
-   **Endpoint**: `GET /api/facilities`
-   **Request**:
    -   The `useFacilities` hook will make a `GET` request to this endpoint.
    -   The request must be authenticated. The underlying HTTP client (e.g., Supabase client's `fetch`) should handle the inclusion of authentication tokens.
-   **Response Types**:
    -   **Success (200 OK)**: The request will expect a JSON response matching the `FacilityListDTO` type.
    -   **Error (401, 500)**: The request will handle JSON responses matching the `ErrorResponse` type, as well as network errors.

## 8. User Interactions
1.  **User loads the page (`/`)**:
    -   The `FacilityListView` component mounts.
    -   A loading state is displayed, featuring multiple `Skeleton` components arranged in a grid.
    -   The `useFacilities` hook is invoked, triggering an API call to `GET /api/facilities`.
    -   The view transitions from loading to success, error, or empty state based on the API response.
2.  **User clicks on a `FacilityCard`**:
    -   The user is navigated to the detailed schedule view for that facility.
    -   The URL will change to `/facilities/{id}`, where `{id}` is the ID of the selected facility.

## 9. Conditions and Validation
-   **Authentication**:
    -   **Condition**: User must be authenticated to view the facility list.
    -   **Validation**: The API endpoint enforces this. If a `401 Unauthorized` response is received, the application should ideally have a global handler that redirects to a login page.
-   **Data Availability**:
    -   **Condition**: The list of facilities returned from the API can be empty.
    -   **Validation**: Inside `FacilityListView`, after a successful API call, a check `data.facilities.length === 0` will be performed. If true, the component will render the "No facilities available" message instead of the facility list.

## 10. Error Handling
-   **Network or Server Errors**: If the `fetch` call fails (e.g., network issue or a 5xx response from the server), the `useFacilities` hook will catch the error and populate its `error` state. The `FacilityListView` component will then display a generic error message, such as "Could not load facilities. Please try again later."
-   **Unauthorized Access**: If the API returns a 401 status, this indicates the user's session is invalid. While the component can show an error, the preferred UX is a global redirect to the login page, which should be handled at the application's fetch/routing level.

## 11. Implementation Steps
1.  **Create Page Component**: Create the file `src/pages/index.astro`. Set up the basic page structure using the main `Layout.astro` and include a placeholder for the React component.
2.  **Create ViewModel Types**: Define the `FacilityViewModel` alongside the component.
3.  **Develop Custom Hook**: Create the `src/hooks/useFacilities.ts` file. Implement the data fetching logic, including state management for `data`, `isLoading`, and `error`. Handle the transformation from `FacilityDTO` to `FacilityViewModel`.
4.  **Develop `FacilityCard` Component**: Create `src/components/FacilityCard.tsx`. This component will accept a `facility` prop of type `FacilityViewModel` and render its name within a navigable `<a>` tag styled with the Shadcn `Card` component.
5.  **Develop `FacilityListView` Component**: Create `src/components/views/FacilityListView.tsx`.
    -   Use the `useFacilities` hook to get the view state.
    -   Implement the conditional rendering logic:
        -   If `isLoading`, render a grid of `Skeleton` components.
        -   If `error`, render an error message.
        -   If `data` is available, check if it's empty. If so, render the "no facilities" message.
        -   If `data` has items, map over them and render `FacilityCard` for each.
6.  **Integrate Component**: In `src/pages/index.astro`, import and render the `FacilityListView` component, ensuring the `client:load` directive is used to enable client-side interactivity.
7.  **Styling**: Use Tailwind CSS classes across all components to match the application's design system.
