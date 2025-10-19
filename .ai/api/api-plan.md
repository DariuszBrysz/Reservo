# REST API Plan - Reservo

## 1. Overview

This REST API plan is designed for the Reservo sports facility reservation system. The API follows REST principles and leverages Supabase for authentication and database operations with Row Level Security (RLS) policies for authorization.

### Technology Stack
- **Framework**: Astro 5 API endpoints
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: JWT claims (user_role) + RLS policies

### Key Design Principles
- RESTful resource-based URLs
- JSON for request/response payloads
- HTTP status codes for response status
- JWT Bearer tokens for authentication
- Database-level validation and authorization via RLS policies

## 2. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Facilities | `public.facilities` | Sports facilities available for reservation |
| Reservations | `public.reservations` | Facility reservations made by users |
| Auth | `auth.users` (Supabase managed) | User authentication and profile |

**Note**: `user_roles` and `role_permissions` tables are managed at the database level and not exposed as API resources. Roles are embedded in JWT claims via custom access token hook.

## 3. Endpoints

### 3.1 Facilities

#### GET /api/facilities

**Description**: Retrieve list of all available facilities

**Authentication**: Required

**Query Parameters**: None

**Response Payload** (200 OK):
```json
{
  "facilities": [
    {
      "id": 1,
      "name": "Tennis Court A",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

---

#### GET /api/facilities/{id}

**Description**: Retrieve details of a specific facility

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required): Facility ID

**Response Payload** (200 OK):
```json
{
  "id": 1,
  "name": "Tennis Court A",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Facility does not exist
  ```json
  {
    "error": "Not Found",
    "message": "Facility not found"
  }
  ```

---

#### GET /api/facilities/{id}/schedule

**Description**: Get facility schedule showing reservations and available slots for a specific date

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required): Facility ID

**Query Parameters**:
- `date` (string, required): Date in ISO 8601 format (YYYY-MM-DD)

**Response Payload** (200 OK):
```json
{
  "facility": {
    "id": 1,
    "name": "Tennis Court A"
  },
  "date": "2025-10-15",
  "operating_hours": {
    "start": "14:00",
    "end": "22:00"
  },
  "reservations": [
    {
      "id": 100,
      "start_time": "2025-10-15T14:00:00Z",
      "duration": "01:30:00",
      "end_time": "2025-10-15T15:30:00Z",
      "status": "confirmed",
      "user": {
        "email": "user@example.com"
      }
    }
  ]
}
```

**Notes**:
- For regular users, the `user.email` field is only included for their own reservations
- For admin users, `user.email` is included for all reservations
- Only reservations with status "confirmed" affect availability
- Available slots can be calculated client-side from operating hours and existing reservations

**Error Responses**:
- `400 Bad Request`: Invalid date format
  ```json
  {
    "error": "Bad Request",
    "message": "Invalid date format. Expected YYYY-MM-DD"
  }
  ```
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Facility does not exist

---

### 3.2 Reservations

#### POST /api/reservations

**Description**: Create a new reservation

**Authentication**: Required

**Request Payload**:
```json
{
  "facility_id": 1,
  "start_time": "2025-10-15T14:00:00Z",
  "duration": "01:30:00"
}
```

**Validation Rules**:
- `facility_id`: Required, must reference existing facility
- `start_time`: Required, ISO 8601 datetime
  - Must be in the future
  - Must be within next 7 days
  - Time component must be between 14:00 and 22:00
  - Must be aligned to 15-minute intervals (e.g., 14:00, 14:15, 14:30)
- `duration`: Required, ISO 8601 duration format (e.g., "01:30:00" for 1 hour 30 minutes)
  - Minimum: 30 minutes
  - Maximum: 3 hours
  - Must be in 15-minute increments
  - End time (start_time + duration) must not exceed 22:00

**Response Payload** (201 Created):
```json
{
  "id": 100,
  "facility_id": 1,
  "user_id": "uuid",
  "start_time": "2025-10-15T14:00:00Z",
  "duration": "01:30:00",
  "end_time": "2025-10-15T15:30:00Z",
  "status": "confirmed",
  "cancellation_message": null,
  "created_at": "2025-10-12T10:30:00Z",
  "updated_at": "2025-10-12T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": "Bad Request",
    "message": "Reservation duration must be at least 30 minutes"
  }
  ```
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Facility does not exist
- `409 Conflict`: Time slot already reserved (double-booking)
  ```json
  {
    "error": "Conflict",
    "message": "Sorry, this time slot is no longer available. Please select another time."
  }
  ```

**Database-Level Validations** (via trigger):
- Duration >= 30 minutes and <= 3 hours
- Start time >= 14:00 and end time <= 22:00
- No overlapping confirmed reservations for the same facility

---

#### GET /api/reservations

**Description**: Get reservations list

**Authentication**: Required

**Query Parameters**:
- `all` (boolean, optional): Admin only - retrieve all reservations. Default: false
- `status` (string, optional): Filter by status ("confirmed" or "canceled"). Default: all statuses
- `upcoming` (boolean, optional): Filter for upcoming reservations only (start_time > now()). Default: true
- `facility_id` (integer, optional): Filter by facility ID
- `limit` (integer, optional): Number of results per page. Default: 50, Max: 100
- `offset` (integer, optional): Pagination offset. Default: 0

**Response Payload** (200 OK):
```json
{
  "reservations": [
    {
      "id": 100,
      "facility": {
        "id": 1,
        "name": "Tennis Court A"
      },
      "user_id": "uuid",
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

**Notes**:
- By default, returns only the authenticated user's reservations
- Admin users can use `all=true` to view all users' reservations
- RLS policies enforce data access rules at database level

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Non-admin user attempting to use `all=true` parameter
  ```json
  {
    "error": "Forbidden",
    "message": "Insufficient permissions"
  }
  ```

---

#### GET /api/reservations/{id}

**Description**: Get details of a specific reservation

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required): Reservation ID

**Response Payload** (200 OK):
```json
{
  "id": 100,
  "facility": {
    "id": 1,
    "name": "Tennis Court A"
  },
  "user_id": "uuid",
  "start_time": "2025-10-15T14:00:00Z",
  "duration": "01:30:00",
  "end_time": "2025-10-15T15:30:00Z",
  "status": "confirmed",
  "cancellation_message": null,
  "created_at": "2025-10-12T10:30:00Z",
  "updated_at": "2025-10-12T10:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User attempting to access another user's reservation (non-admin)
- `404 Not Found`: Reservation does not exist

---

#### PATCH /api/reservations/{id}

**Description**: Update a reservation (modify duration or cancel with message)

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required): Reservation ID

**Request Payload** (User - Update Duration):
```json
{
  "duration": "02:00:00"
}
```

**Request Payload** (Admin - Cancel with Message):
```json
{
  "status": "canceled",
  "cancellation_message": "Facility maintenance scheduled"
}
```

**Validation Rules**:
- **For regular users**:
  - Can only update `duration` field
  - Reservation must be more than 12 hours in the future
  - New duration must follow same rules as creation (30 min to 3 hours, 15-min increments)
  - New end time must not conflict with other reservations or exceed 22:00
- **For admin users**:
  - Can update `status` to "canceled"
  - Can optionally provide `cancellation_message` (max 500 characters)
  - No time restriction for cancellation

**Response Payload** (200 OK):
```json
{
  "id": 100,
  "facility_id": 1,
  "user_id": "uuid",
  "start_time": "2025-10-15T14:00:00Z",
  "duration": "02:00:00",
  "end_time": "2025-10-15T16:00:00Z",
  "status": "confirmed",
  "cancellation_message": null,
  "created_at": "2025-10-12T10:30:00Z",
  "updated_at": "2025-10-12T10:35:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": "Bad Request",
    "message": "Reservation duration cannot exceed 3 hours"
  }
  ```
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Cannot edit reservation (less than 12 hours before start or not owner)
  ```json
  {
    "error": "Forbidden",
    "message": "Reservations can only be modified more than 12 hours before start time"
  }
  ```
- `404 Not Found`: Reservation does not exist
- `409 Conflict`: New duration conflicts with existing reservation
  ```json
  {
    "error": "Conflict",
    "message": "The updated duration conflicts with another reservation"
  }
  ```

---

#### DELETE /api/reservations/{id}

**Description**: Cancel a reservation (user self-cancellation)

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required): Reservation ID

**Validation Rules**:
- User must own the reservation
- Reservation must be more than 12 hours in the future
- Reservation must have status "confirmed"

**Response Payload** (204 No Content):
No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Cannot cancel reservation (less than 12 hours before start, not owner, or already canceled)
  ```json
  {
    "error": "Forbidden",
    "message": "Reservations can only be canceled more than 12 hours before start time"
  }
  ```
- `404 Not Found`: Reservation does not exist

**Implementation Note**: This performs a soft delete by updating the status to "canceled" in the database. The actual DELETE operation is handled by RLS policies which enforce the business rules.

---

#### GET /api/reservations/{id}/export.ics

**Description**: Export a reservation as an ICS (iCalendar) file

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required): Reservation ID

**Response Headers**:
```
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="reservation-{id}.ics"
```

**Response Body** (200 OK):
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Reservo//Reservation System//EN
BEGIN:VEVENT
UID:reservation-{id}@reservo.app
DTSTAMP:20251012T103000Z
DTSTART:20251015T140000Z
DTEND:20251015T153000Z
SUMMARY:Reservation: Tennis Court A
DESCRIPTION:Facility reservation
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**ICS File Format Requirements**:
- Event title: "Reservation: {Facility Name}"
- Start time: reservation start_time
- End time: start_time + duration
- UID: unique identifier for the event
- Status: CONFIRMED or CANCELLED based on reservation status

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User attempting to export another user's reservation (non-admin)
- `404 Not Found`: Reservation does not exist

---

## 4. Validation and Business Logic

### 4.1 Reservation Validation

#### Duration Constraints
- **Minimum**: 30 minutes
- **Maximum**: 3 hours
- **Increment**: 15 minutes

#### Operating Hours
- **Start time**: 14:00
- **End time**: 22:00

#### Advance Booking Window
- **Maximum**: 7 days in advance
- **Minimum**: Current time

#### Time Slot Granularity
- All start times must align to 15-minute intervals
- All durations must be multiples of 15 minutes

#### Double-Booking Prevention
- No overlapping reservations for the same facility
- Only applies to reservations with status "confirmed"

#### 12-Hour Modification Window
- Users can only edit or cancel reservations more than 12 hours before start time
- Admins exempt from this restriction

### 4.2 Authorization Rules

#### User Permissions (role: 'user')
- **View**: Own reservations only
- **Create**: Reservations for themselves only
- **Update**: Own reservations only (duration field only, within 12-hour window)
- **Cancel**: Own reservations only (within 12-hour window)

#### Admin Permissions (role: 'admin')
- **View**: All reservations (including user email addresses)
- **Create**: Not applicable (admins don't create reservations on behalf of users)
- **Update**: Any reservation (can set status to "canceled" and add cancellation_message)
- **Cancel**: Any reservation (no time restriction)

### 4.3 Field-Level Security

#### Cancellation Message
- **Readable by**: Reservation owner and admins
- **Writable by**: Admins only
- Users cannot set or modify this field

#### Status
- Defaults to "confirmed" on creation
- Users cannot directly change status
- Admins can change status to "canceled"

### 4.4 Error Handling

#### Database-Level Errors
Database triggers and constraints provide meaningful error messages that should be passed through to the API response:

- **Duration too short**: "Reservation duration must be at least 30 minutes"
- **Duration too long**: "Reservation duration cannot exceed 3 hours"
- **Start too early**: "Reservation cannot start before 14:00"
- **End too late**: "Reservation cannot end after 22:00"
- **Double booking**: "This time slot is already reserved"

#### Application-Level Errors
The API should validate and return appropriate errors for:

- **Invalid date format**: "Invalid date format"
- **Booking too far ahead**: "Reservations can only be made up to 7 days in advance"
- **Past date**: "Cannot create reservation in the past"
- **Invalid duration format**: "Invalid duration format"
- **Non-15-minute alignment**: "Start time must align to 15-minute intervals"
- **Unauthorized field update**: "Cannot modify field"

#### Authorization Errors
- **Missing authentication**: "Authentication required"
- **Insufficient permissions**: "Insufficient permissions"
- **12-hour window violation**: "Reservations can only be modified more than 12 hours before start time"

### 4.5 Data Transformation

#### Duration Format
- **Database**: PostgreSQL interval type (e.g., '01:30:00')
- **API Input**: ISO 8601 duration string (e.g., "01:30:00")
- **API Output**: ISO 8601 duration string (e.g., "01:30:00")

#### Timestamps
- **Database**: timestamptz (stored in UTC)
- **API**: ISO 8601 format with timezone (e.g., "2025-10-15T14:00:00Z")
- All times managed in a single fixed timezone at application level

#### Computed Fields
- **end_time**: Not stored in database, calculated as start_time + duration
- Included in API responses for convenience