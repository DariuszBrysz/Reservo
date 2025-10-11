# Reservo

A web-based application designed to streamline the process of reserving sports facilities, replacing traditional manual tracking systems with an automated, user-friendly platform.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Reservo solves the challenges of manual sports facility reservations. Facility managers face time-consuming tasks of recording bookings and handling conflicts, while users deal with inconvenient phone calls and no real-time visibility into availability.

This application provides a centralized, automated system that supports two primary roles:
-   **Users**: Can view facility availability, and make, edit, and cancel their own reservations.
-   **Administrators**: Can oversee and manage all reservations across the platform.

## Tech Stack

### Frontend
-   **Astro 5**: Core framework for building fast, content-focused websites.
-   **React 19**: Used for creating interactive UI components.
-   **TypeScript 5**: For static type-checking and improved code quality.
-   **Tailwind 4**: A utility-first CSS framework for styling.
-   **Shadcn/ui**: A library of accessible and reusable React components.

### Backend
-   **Supabase**: A comprehensive open-source backend solution providing:
    -   PostgreSQL Database
    -   Backend-as-a-Service (BaaS) SDK
    -   User Authentication

### CI/CD & Hosting
-   **GitHub Actions**: For automating CI/CD pipelines.
-   **DigitalOcean**: For application hosting.

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/DariuszBrysz/Reservo.git
    cd Reservo
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Supabase project credentials.

    ```env
    SUPABASE_URL="your-supabase-url"
    SUPABASE_KEY="your-supabase-key"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

In the project directory, you can run the following commands:

| Script             | Description                                        |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Runs the app in development mode.                  |
| `npm run build`    | Builds the app for production.                     |
| `npm run preview`  | Serves the production build locally for preview.   |
| `npm run lint`     | Lints the codebase for potential errors.           |
| `npm run lint:fix` | Lints the codebase and automatically fixes issues. |
| `npm run format`   | Formats the code using Prettier.                   |

## Project Scope

### Facility Viewing:
-   View a list of facilities and their schedule.
### Reservation Management:
-   Book a slot up to one week in advance.
-   The system prevents double-bookings.
-   Users can view, edit, and cancel their own upcoming reservations.
-   Export reservations to an `.ics` file.
### Administrator Capabilities:
-   View all reservations for any facility and day.
-   Cancel any user's reservation at any time, with an optional reason.

## Project Status

This project is currently in the **MVP development phase**.

## License

This project is licensed under the MIT License.