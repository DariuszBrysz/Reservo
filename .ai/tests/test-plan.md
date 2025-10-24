# Test Plan: Reservo Application

## 1. Introduction and Testing Objectives

### 1.1. Introduction

This document outlines the comprehensive testing strategy for the Reservo application. Reservo is a web-based booking platform built with Astro, React, and Supabase. The purpose of this plan is to ensure the application meets the highest standards of quality, reliability, security, and performance before release.

### 1.2. Testing Objectives

*   **Functional Correctness:** To verify that all features, including user authentication, facility viewing, and reservation management, function as specified.
*   **Reliability & Stability:** To ensure the application is robust and can handle expected loads and edge-case scenarios without crashing.
*   **Security:** To identify and mitigate potential security vulnerabilities, particularly in authentication, authorization, and data handling.
*   **Usability:** To confirm the application is intuitive, responsive, and provides a seamless user experience across various devices and browsers.
*   **Defect Identification:** To find and report bugs early in the development lifecycle, reducing the cost and effort of fixing them.

## 2. Scope of Testing

### 2.1. In-Scope Features

*   User Authentication: Registration, Login, Logout, Password Update, and Session Management.
*   Route Protection: Verifying that only authenticated users can access protected pages and API endpoints.
*   Facility Management: Viewing lists of facilities and their detailed schedules.
*   Reservation Management: Creating, viewing, and canceling reservations.
*   API Testing: Direct testing of all backend endpoints for functionality, performance, and security.
*   UI/UX Testing: Ensuring a consistent and responsive user interface.

### 2.2. Out-of-Scope Features

*   Unit testing of third-party libraries (e.g., Shadcn/ui, React).
*   Infrastructure testing of Supabase or the hosting provider.
*   Extensive load and stress testing beyond baseline performance checks.
*   Browser extension compatibility testing.

## 3. Types of Tests to be Performed

A multi-layered testing approach will be adopted to ensure comprehensive coverage:

*   **Unit Tests:** To test individual functions and logic within the services (`src/lib/services`) and helper utilities. Dependencies like the Supabase client will be mocked.
*   **Component Tests:** To test individual React components (`.tsx` files) in isolation to verify their rendering, state management, and event handling.
*   **Integration Tests:** To test the interactions between different parts of the application, such as the frontend components calling the API, or the API services interacting with the Supabase database.
*   **End-to-End (E2E) Tests:** To simulate complete user workflows in a real browser environment, covering scenarios from registration to booking and cancellation.
*   **API Tests:** To directly test the RESTful endpoints in `src/pages/api` for correct responses, status codes, error handling, and authentication/authorization logic.
*   **Manual Exploratory Testing:** To discover issues that may not be covered by automated tests, focusing on usability and edge cases.
*   **Cross-Browser & Responsiveness Testing:** To ensure the application works correctly and looks good on different browsers and screen sizes.

## 4. Test Scenarios for Key Functionalities

This section outlines high-level test scenarios for the application's core features.

| Feature                 | Scenario ID | Description                                                                                             | Priority |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------- | -------- |
| **User Authentication** | AUTH-001    | A new user can successfully register for an account with valid credentials.                              | Critical |
|                         | AUTH-002    | A registered user can successfully log in and is redirected to the main page.                             | Critical |
|                         | AUTH-003    | An authenticated user can successfully log out.                                                         | Critical |
|                         | AUTH-004    | An unauthenticated user attempting to access a protected route (e.g., `/my-reservations`) is redirected to the login page. | Critical |
|                         | AUTH-005    | A user receives an error message when attempting to log in with invalid credentials.                   | High     |
| **Facility & Schedule** | FAC-001     | A user can view the list of all available facilities on the homepage.                                     | High     |
|                         | FAC-002     | A user can click on a facility to view its detailed schedule of available time slots.                 | High     |
|                         | FAC-003     | The schedule view correctly displays available and booked time slots for a selected date.               | High     |
| **Reservation**         | RES-001     | An authenticated user can successfully book an available time slot for a facility.                        | Critical |
|                         | RES-002     | A user is prevented from booking a time slot that is already reserved by another user.                  | Critical |
|                         | RES-003     | An authenticated user can view a list of their own upcoming reservations on the "My Reservations" page. | Critical |
|                         | RES-004     | A user can successfully cancel one of their upcoming reservations.                                      | Critical |
|                         | RES-005     | A user cannot view or cancel reservations belonging to another user.                                    | Critical |

## 5. Test Environment

| Environment        | Purpose                                            | Details                                                                    |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------------------------- |
| **Local**          | Development & Unit/Component Testing               | Developer machines with Node.js, and a local Supabase instance (or dev project). |
| **Staging/Pre-prod** | E2E Testing, Integration Testing, UAT             | A dedicated environment, mirroring the production setup. Connected to a separate Staging Supabase project. |
| **Production**     | Final release                                      | Live environment for end-users.                                            |

**Supported Browsers:** Latest versions of Chrome, Firefox, Safari, and Edge.
**Supported Devices:** Desktop (1920x1080), Tablet (emulated, 768x1024), Mobile (emulated, 375x667).

## 6. Testing Tools

| Tool                  | Purpose                                |
| --------------------- | -------------------------------------- |
| **Vitest**            | Unit and Component test runner.        |
| **React Testing Library** | Utilities for testing React components. |
| **Playwright**        | End-to-End testing framework.          |
| **Postman / Insomnia**| Manual API testing and exploration.    |
| **GitHub Actions**    | Continuous Integration and test automation. |
| **GitHub Issues**     | Bug tracking and management.           |

## 7. Test Schedule

Testing activities will be integrated into the development lifecycle and will run in parallel with development sprints.

*   **Unit & Component Tests:** Written by developers alongside new feature development.
*   **Integration & E2E Tests:** Developed by QA and run automatically via GitHub Actions on every pull request to the `master` branch.
*   **Manual Testing:** Conducted on the Staging environment before each planned release.
*   **Regression Testing:** A full suite of automated E2E tests will be executed before deploying to production.

## 8. Test Acceptance Criteria

### 8.1. Entry Criteria

*   The code for the feature is complete and deployed to the Staging environment.
*   All unit and integration tests written by developers are passing.

### 8.2. Exit Criteria

*   100% of automated E2E tests for P0 (Critical) and P1 (High) scenarios must pass.
*   Code coverage for critical backend services (`/src/lib/services`) must be above 85%.
*   No open "Blocker" or "Critical" severity bugs.
*   All major functionality has been signed off by the Product Owner.

## 9. Roles and Responsibilities

| Role                | Responsibilities                                                                       |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Developers**      | - Write and maintain unit and component tests.<br>- Fix bugs assigned to them.<br>- Perform code reviews. |
| **QA Engineer**     | - Develop and maintain the automated E2E test suite.<br>- Perform manual exploratory and regression testing.<br>- Report and manage bugs.<br>- Define test strategies and plans. |
| **Product Owner**   | - Define feature requirements and acceptance criteria.<br>- Prioritize bug fixes.<br>- Perform User Acceptance Testing (UAT). |
| **DevOps/Tech Lead**| - Maintain the CI/CD pipeline and test environments.                                     |

## 10. Bug Reporting Procedures

All defects will be tracked using GitHub Issues. Each bug report must follow a standardized template to ensure clarity and reproducibility.

**Bug Report Template:**

*   **Title:** A clear, concise summary of the issue. (e.g., "Error 500 when canceling a reservation")
*   **Description:**
    *   **Steps to Reproduce:** Numbered list of steps to trigger the bug.
    *   **Expected Result:** What should have happened.
    *   **Actual Result:** What actually happened.
*   **Environment:** (e.g., Browser, OS, Device, Staging/Prod)
*   **Severity:**
    *   **Blocker:** Prevents core functionality; no workaround exists.
    *   **Critical:** Crashes the application or causes data loss.
    *   **Major:** A major feature is not functional.
    *   **Minor:** A minor feature is not functional, or UI issue.
    *   **Trivial:** Cosmetic issue.
*   **Attachments:** Screenshots, videos, or logs.
