# Reservo - Authentication Module Technical Specification

## 1. Introduction

This document outlines the technical architecture for implementing user registration, login, logout, and password recovery functionalities in the Reservo application. The design is based on the requirements specified in the Product Requirements Document (PRD) under user stories US-001, US-002, and US-012, and aligns with the established tech stack (Astro, React, Supabase).

## 2. User Interface Architecture

The frontend will be extended with dedicated authentication pages and components. Logic will be separated between static Astro pages for layout and routing, and dynamic React components for interactive forms.

### 2.1. New Pages (Astro)

New pages will be created under `src/pages/` to handle authentication flows.

-   **`src/pages/login.astro`**:
    -   **Purpose**: Provides the user interface for logging in.
    -   **Content**: Renders the main `Layout.astro` and embeds the client-side `LoginForm.tsx` React component.
    -   **Logic**: If a user with an active session visits this page, they will be redirected to the homepage (`/`).

-   **`src/pages/register.astro`**:
    -   **Purpose**: Provides the user interface for new user registration.
    -   **Content**: Renders `Layout.astro` and embeds the `RegisterForm.tsx` React component.
    -   **Logic**: If a user with an active session visits this page, they will be redirected to the homepage (`/`).

-   **`src/pages/forgot-password.astro`**:
    -   **Purpose**: Allows users to initiate the password recovery process.
    -   **Content**: Renders `Layout.astro` and embeds the `ForgotPasswordForm.tsx` React component.

-   **`src/pages/update-password.astro`**:
    -   **Purpose**: Allows users to set a new password after clicking the recovery link from their email. This page is required by the Supabase password recovery flow.
    -   **Content**: Renders `Layout.astro` and embeds the `UpdatePasswordForm.tsx` React component.

### 2.2. New Components (React)

Interactive forms will be built as React components in `src/components/auth/`.

-   **`src/components/auth/LoginForm.tsx`**:
    -   **Responsibility**: Manages login form state (email, password), performs client-side validation, handles form submission to the backend API, and displays success or error messages.
    -   **Fields**: Email, Password.
    -   **Validation**:
        -   Email: Must be a valid email format.
        -   Password: Must not be empty.
    -   **Error Handling**: Displays messages like "Invalid credentials" or "An unexpected error occurred." returned from the API.

-   **`src/components/auth/RegisterForm.tsx`**:
    -   **Responsibility**: Manages registration form state (email, password, confirm password), performs client-side validation, and handles submission.
    -   **Fields**: Email, Password, Confirm Password.
    -   **Validation**:
        -   Email: Must be a valid email format.
        -   Password: Minimum length of 8 characters.
        -   Confirm Password: Must match the Password field.
    -   **Error Handling**: Displays messages like "User already exists" or "Password must be at least 8 characters long."

-   **`src/components/auth/ForgotPasswordForm.tsx`**:
    -   **Responsibility**: Manages state for the password recovery request form.
    -   **Fields**: Email.
    -   **Logic**: Upon submission, it will show a confirmation message, "If an account with this email exists, a password reset link has been sent."

### 2.3. Layout and Component Modifications

-   **`src/layouts/Layout.astro`**:
    -   **Change**: The layout will read the user session status from `Astro.locals.session`, which is populated by the middleware.
    -   **Logic**: It will pass the session state to a modified `Header` component.

-   **`src/components/Header.tsx`**:
    -   **Change**: The header will be updated to conditionally render authentication-related UI elements.
    -   **Unauthenticated State**: Displays a "Login" button linking to `/login` and a "Register" button linking to `/register`.
    -   **Authenticated State**: Displays the user's email and a dropdown menu with "My Reservations" and a "Logout" button. The "Logout" button will trigger a POST request to `/api/auth/logout`.

### 2.4. User Flow Scenarios

-   **Protected Routes**: Any attempt to access protected pages like `/my-reservations` or `/facilities/[id]` without an active session will result in an automatic redirect to `/login`.
-   **Login**: A user fills the login form, and upon successful submission to `POST /api/auth/login`, the server sets a session cookie, and the user is redirected to the homepage (`/`).
-   **Registration**: A user fills the registration form. On success, they are shown a message to check their email for verification and are redirected to the login page.

## 3. Backend Logic

Backend logic will be implemented using Astro API routes, which will interface with the Supabase Auth service. This provides a secure Backend-for-Frontend (BFF) pattern.

### 3.1. API Endpoints

New API endpoints will be created under `src/pages/api/auth/`.

-   **`POST /api/auth/login`**:
    -   **Purpose**: Authenticates a user.
    -   **Input**: `{ email, password }`.
    -   **Logic**:
        1.  Validate input using a Zod schema.
        2.  Call `supabase.auth.signInWithPassword()`.
        3.  On success, retrieve the session data from Supabase.
        4.  Set the `access_token` and `refresh_token` in secure, `HttpOnly` cookies.
        5.  Return a 200 OK response.
    -   **Error Handling**: Returns 400 for invalid data, 401 for incorrect credentials.

-   **`POST /api/auth/register`**:
    -   **Purpose**: Creates a new user account.
    -   **Input**: `{ email, password }`.
    -   **Logic**:
        1.  Validate input.
        2.  Call `supabase.auth.signUp()`. Supabase will handle sending a verification email.
        3.  Return a 201 Created response.
    -   **Error Handling**: Returns 400 for invalid data, 409 for a user that already exists.

-   **`POST /api/auth/logout`**:
    -   **Purpose**: Logs the user out.
    -   **Logic**:
        1.  Call `supabase.auth.signOut()`.
        2.  Clear the session cookies.
        3.  Return a 200 OK response and redirect the user to the homepage.

-   **`POST /api/auth/forgot-password`**:
    -   **Purpose**: Initiates the password reset flow.
    -   **Input**: `{ email }`.
    -   **Logic**:
        1.  Validate input.
        2.  Call `supabase.auth.resetPasswordForEmail()`, specifying `redirectTo` to point to `/update-password`.
        3.  Return a 200 OK response, regardless of whether the email exists, to prevent user enumeration.

-   **`GET /api/auth/callback`**:
    -   **Purpose**: Handles the callback from Supabase after a user clicks a magic link or OAuth sign-in link (including the email verification link from registration).
    -   **Logic**:
        1.  Extract the authorization `code` from the URL query parameters.
        2.  If a code is present, exchange it for a session using `supabase.auth.exchangeCodeForSession()`.
        3.  Set the session cookies.
        4.  Redirect the user to the homepage.

### 3.2. Data Validation

-   **Technology**: Zod will be used for schema-based validation on all API endpoints to ensure data integrity before processing.
-   **Schemas**: Separate schemas will be defined for login, registration, and password reset request payloads in a shared file (e.g., `src/lib/validators/auth.ts`).

## 4. Authentication System

The authentication system will be built around Supabase Auth, with Astro middleware acting as the orchestration layer for session management and route protection.

### 4.1. Supabase Integration

-   **Client**: The `@supabase/supabase-js` SDK will be used. A server-side Supabase client is instantiated in `src/db/supabase.client.ts` using environment variables (`SUPABASE_URL`, `SUPABASE_KEY`). This client will be used in API routes and middleware.
-   **Authentication Methods**: The primary method will be email and password. Email verification will be enabled in the Supabase project settings to ensure users confirm their email addresses upon registration.

### 4.2. Session Management & Middleware

-   **File**: `src/middleware/index.ts`.
-   **Mechanism**: Astro middleware will run on every server-side request.
-   **Logic**:
    1.  On each request, the middleware will extract the `access_token` and `refresh_token` from the cookies.
    2.  If tokens are present, it will use them to fetch the user's session from Supabase via `supabase.auth.setSession()` and `supabase.auth.getUser()`.
    3.  The validated user session (or `null` if invalid/non-existent) will be stored in `Astro.locals.session`. This makes the session data available across all server-rendered Astro pages and API routes for the duration of the request.
    4.  It will check if the requested path is in a predefined list of protected routes.
    5.  If the route is protected and `Astro.locals.session` is `null`, it will perform a redirect to `/login`.

### 4.3. Protected Routes Configuration

-   **Public Routes**: `/login`, `/register`, `/forgot-password`, `/update-password`, `/api/*`.
-   **Protected Routes**: `/`, `/facilities/[id]`, `/my-reservations`.
-   **Implementation**: A configuration array within the middleware will define which paths require authentication.
