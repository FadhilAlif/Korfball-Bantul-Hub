# API Reference

Base URL: `http://localhost:3001/api`

Interactive documentation (Swagger UI): `http://localhost:3001/api/docs`

## Authentication

All protected endpoints require a valid access token sent automatically via httpOnly cookie.
Tokens are set by `/api/auth/login` and rotated by `/api/auth/refresh`.

| Cookie | Value | Lifetime |
|--------|-------|----------|
| `access_token` | JWT | 15 minutes |
| `refresh_token` | JWT | 7 days |

When the access token expires, the frontend axios interceptor automatically calls
`POST /api/auth/refresh` and retries the original request.

---

## Auth Endpoints

### POST /api/auth/register

Register a new user account. Account is inactive until email is verified.

**Request:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": null
}
```

**Errors:** `400` validation error, `409` email already registered

---

### POST /api/auth/login

Authenticate and receive access + refresh token cookies.

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "jane@example.com",
      "fullName": "Jane Doe",
      "isActive": true,
      "roles": ["admin"]
    }
  }
}
```

Sets `accessToken` and `refreshToken` httpOnly cookies.

**Errors:** `401` invalid credentials, `403` account inactive/unverified, `429` rate limited

---

### POST /api/auth/logout

Revoke the current refresh token and clear cookies.

**Auth required:** Yes

**Response 200:**
```json
{ "success": true, "message": "Logged out successfully", "data": null }
```

---

### POST /api/auth/refresh

Rotate the refresh token and issue a new access token.

**Auth required:** refreshToken cookie

**Response 200:**
```json
{ "success": true, "message": "Token refreshed", "data": null }
```

Sets new `accessToken` cookie.

**Errors:** `401` invalid or expired refresh token

---

### GET /api/auth/me

Get the currently authenticated user's profile with roles and permissions.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "isActive": true,
    "emailVerifiedAt": "2026-06-01T10:00:00.000Z",
    "roles": [
      {
        "id": 1,
        "name": "admin",
        "permissions": ["users:read", "users:create", "roles:read"]
      }
    ]
  }
}
```

---

### PATCH /api/auth/me

Update the authenticated user's profile.

**Auth required:** Yes

**Request:**
```json
{ "fullName": "Jane Smith" }
```

**Response 200:**
```json
{ "success": true, "message": "Profile updated", "data": { "fullName": "Jane Smith" } }
```

---

### POST /api/auth/change-password

Change password for the authenticated user.

**Auth required:** Yes

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Response 200:**
```json
{ "success": true, "message": "Password changed successfully", "data": null }
```

---

### POST /api/auth/forgot-password

Request a password reset email.

**Request:**
```json
{ "email": "jane@example.com" }
```

**Response 200:** Always returns success (prevents email enumeration)
```json
{ "success": true, "message": "If that email exists, a reset link has been sent.", "data": null }
```

---

### POST /api/auth/reset-password

Reset password using the token from the email link.

**Request:**
```json
{
  "token": "abc123...",
  "password": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Response 200:**
```json
{ "success": true, "message": "Password reset successful", "data": null }
```

**Errors:** `400` invalid or expired token

---

### POST /api/auth/verify-email

Verify email address using the token from the verification email.

**Request:**
```json
{ "token": "abc123..." }
```

**Response 200:**
```json
{ "success": true, "message": "Email verified successfully", "data": null }
```

---

### POST /api/auth/resend-verification

Resend the email verification link.

**Request:**
```json
{ "email": "jane@example.com" }
```

**Response 200:** Always returns success
```json
{ "success": true, "message": "Verification email sent if account exists", "data": null }
```

---

## User Endpoints

### GET /api/users

List all users with pagination.

**Auth required:** Yes | **Permission:** `users:read`

**Query params:** `page` (default: 1), `limit` (default: 10), `search` (filter by name or email)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@example.com",
        "fullName": "Admin User",
        "isActive": true,
        "roles": ["admin"],
        "createdAt": "2026-06-01T00:00:00.000Z",
        "updatedAt": "2026-06-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

### GET /api/users/export

Export users as Excel (.xlsx) file.

**Auth required:** Yes | **Permission:** `users:read`

**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

### GET /api/users/:id

Get a single user by ID.

**Auth required:** Yes | **Permission:** `users:read`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "fullName": "Admin User",
    "isActive": true,
    "roles": [{ "id": 1, "name": "admin" }],
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
}
```

**Errors:** `404` user not found

---

### POST /api/users

Create a new user.

**Auth required:** Yes | **Permission:** `users:create`

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "roleIds": [1]
}
```

**Response 201:**
```json
{ "success": true, "message": "User created", "data": { "id": 2, "email": "john@example.com" } }
```

**Errors:** `409` email already exists

---

### PATCH /api/users/:id

Update a user's details.

**Auth required:** Yes | **Permission:** `users:update`

**Request (partial):**
```json
{ "fullName": "John Smith", "isActive": false }
```

**Response 200:**
```json
{ "success": true, "message": "User updated", "data": { "id": 2, "fullName": "John Smith" } }
```

---

### DELETE /api/users/:id

Soft-delete a user (sets `deletedAt`, anonymizes email).

**Auth required:** Yes | **Permission:** `users:delete`

**Response 200:**
```json
{ "success": true, "message": "User deleted", "data": null }
```

---

### PUT /api/users/:id/roles

Replace all roles for a user.

**Auth required:** Yes | **Permission:** `users:update`

**Request:**
```json
{ "roleIds": [1, 2] }
```

**Response 200:**
```json
{ "success": true, "message": "Roles assigned", "data": null }
```

---

### DELETE /api/users/:id/roles/:roleId

Remove a specific role from a user.

**Auth required:** Yes | **Permission:** `users:update`

**Response 200:**
```json
{ "success": true, "message": "Role removed", "data": null }
```

---

## Role Endpoints

### GET /api/roles

List all roles.

**Auth required:** Yes | **Permission:** `roles:read` (or `users:read`, `users:update`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "roles": [
      { "id": 1, "name": "admin", "description": "Full access", "permissionCount": 13 }
    ],
    "total": 2
  }
}
```

---

### GET /api/roles/export

Export roles as Excel (.xlsx) file.

**Auth required:** Yes | **Permission:** `roles:read`

---

### GET /api/roles/:id

Get role with its permissions.

**Auth required:** Yes | **Permission:** `roles:read`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "admin",
    "description": "Full access",
    "permissions": [{ "id": 1, "name": "users:read" }]
  }
}
```

---

### POST /api/roles

Create a new role.

**Auth required:** Yes | **Permission:** `roles:create`

**Request:**
```json
{ "name": "moderator", "description": "Can read and update users" }
```

**Response 201:**
```json
{ "success": true, "data": { "id": 3, "name": "moderator" } }
```

---

### PATCH /api/roles/:id

Update a role's name or description.

**Auth required:** Yes | **Permission:** `roles:update`

**Request:**
```json
{ "description": "Can read, update, and delete users" }
```

**Response 200:**
```json
{ "success": true, "message": "Role updated", "data": null }
```

---

### DELETE /api/roles/:id

Delete a role.

**Auth required:** Yes | **Permission:** `roles:delete`

**Response 200:**
```json
{ "success": true, "message": "Role deleted", "data": null }
```

---

### POST /api/roles/:id/permissions

Add a single permission to a role.

**Auth required:** Yes | **Permission:** `roles:update`

**Request:**
```json
{ "permissionId": 5 }
```

**Response 200:**
```json
{ "success": true, "message": "Permission added", "data": null }
```

---

### PUT /api/roles/:id/permissions

Replace all permissions for a role.

**Auth required:** Yes | **Permission:** `roles:update`

**Request:**
```json
{ "permissionIds": [1, 2, 3] }
```

**Response 200:**
```json
{ "success": true, "message": "Permissions updated", "data": null }
```

---

### DELETE /api/roles/:id/permissions/:permissionId

Remove a specific permission from a role.

**Auth required:** Yes | **Permission:** `roles:update`

**Response 200:**
```json
{ "success": true, "message": "Permission removed", "data": null }
```

---

## Permission Endpoints

### GET /api/permissions

List all permissions.

**Auth required:** Yes | **Permission:** `permissions:read`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      { "id": 1, "name": "users:read", "description": "View user list" }
    ],
    "total": 13
  }
}
```

---

### GET /api/permissions/export

Export permissions as Excel (.xlsx) file.

**Auth required:** Yes | **Permission:** `permissions:read`

---

### GET /api/permissions/:id

Get a single permission.

**Auth required:** Yes | **Permission:** `permissions:read`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "name": "users:read", "description": "View user list" }
}
```

---

### POST /api/permissions

Create a permission. Use `resource:action` format.

**Auth required:** Yes | **Permission:** `permissions:create`

**Request:**
```json
{ "name": "reports:read", "description": "View reports" }
```

**Response 201:**
```json
{ "success": true, "data": { "id": 14, "name": "reports:read" } }
```

---

### PATCH /api/permissions/:id

Update a permission.

**Auth required:** Yes | **Permission:** `permissions:update`

**Request:**
```json
{ "description": "View and export reports" }
```

**Response 200:**
```json
{ "success": true, "message": "Permission updated", "data": null }
```

---

### DELETE /api/permissions/:id

Delete a permission.

**Auth required:** Yes | **Permission:** `permissions:delete`

**Response 200:**
```json
{ "success": true, "message": "Permission deleted", "data": null }
```

---

## Audit Log Endpoints

### GET /api/audit-logs

List audit logs with filters.

**Auth required:** Yes | **Permission:** `audit_logs:read`

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `userId` — filter by user ID
- `action` — filter by action string (e.g. `login`, `create_user`)
- `resourceType` — filter by resource (e.g. `user`, `role`)
- `startDate` — ISO 8601 date
- `endDate` — ISO 8601 date

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 1,
        "userEmail": "admin@example.com",
        "action": "login",
        "resourceType": "auth",
        "resourceId": null,
        "details": {},
        "ipAddress": "127.0.0.1",
        "createdAt": "2026-06-01T10:00:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

---

## Dashboard Endpoints

### GET /api/dashboard/stats

Get summary statistics.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 10,
    "activeUsers": 8,
    "totalRoles": 2,
    "totalPermissions": 13
  }
}
```

---

### GET /api/dashboard/role-distribution

Get user count per role.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "role": "admin", "count": 2 },
    { "role": "user", "count": 8 }
  ]
}
```

---

### GET /api/dashboard/export

Export dashboard data as Excel (.xlsx) file.

**Auth required:** Yes

---

## Notification Endpoints

### GET /api/notifications/stream

SSE stream for real-time notifications.

**Auth required:** Yes

**Response:** `text/event-stream`

Each event is a JSON-encoded notification object.

---

### GET /api/notifications

List notifications for the authenticated user.

**Auth required:** Yes

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Welcome",
      "message": "Your account has been created",
      "target_roles": ["admin"],
      "read_at": null,
      "created_at": "2026-06-01T00:00:00.000Z",
      "creator_name": "System"
    }
  ]
}
```

---

### POST /api/notifications (or POST /api/notifications/broadcast)

Broadcast a notification to specific roles or all roles (`notifications:create` permission required).

**Auth required:** Yes | **Permission:** `notifications:create`

**Request:**
```json
{
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday 2am.",
  "targetRoleIds": [1, 2]
}
```

**Response 201:**
```json
{ "success": true, "message": "Notification broadcasted successfully.", "data": { "id": 1, "title": "System Maintenance" } }
```

---

### PATCH /api/notifications/read-all

Mark all notifications as read for the authenticated user.

**Auth required:** Yes

**Response 200:**
```json
{ "success": true, "message": "Notification marked as read", "data": null }
```

---

## Korfball Hub Domain Endpoints

### Teams Endpoints

Base path: `/api/teams`

#### GET /api/teams
List teams with filtering and pagination.
- **Permission:** `teams:read`
- **Query params:** `page`, `limit`, `search`, `isInternal`
- **Response 200:** List of teams with metadata.

#### POST /api/teams
Create a new team.
- **Permission:** `teams:create`
- **Request:** `{ "name": "Kab. Sleman", "shortName": "Sleman", "isInternal": false, "region": "Sleman", "color": "#0ea5e9" }`

#### GET /api/teams/:id
Get team details by ID.
- **Permission:** `teams:read`

#### PATCH /api/teams/:id
Update team details.
- **Permission:** `teams:update`

#### DELETE /api/teams/:id
Soft-delete team (protected if team has associated athletes or matches).
- **Permission:** `teams:delete`

---

### Athletes Endpoints

Base path: `/api/athletes`

#### GET /api/athletes
List athletes with filtering (team, sex, status, search) and pagination.
- **Permission:** `athletes:read`

#### POST /api/athletes
Create a new athlete profile.
- **Permission:** `athletes:create`
- **Request:**
```json
{
  "teamId": 1,
  "fullName": "Budi Santoso",
  "nickname": "Budi",
  "sex": "MALE",
  "jerseyNumber": 10,
  "status": "ACTIVE"
}
```

#### GET /api/athletes/:id
Get athlete details by ID including linked user account if any.
- **Permission:** `athletes:read`

#### PATCH /api/athletes/:id
Update athlete profile.
- **Permission:** `athletes:update`

#### DELETE /api/athletes/:id
Soft-delete athlete (protected if athlete has attendance or match participation).
- **Permission:** `athletes:delete`

#### PUT /api/athletes/:id/user
Link an athlete profile to a registered user account (1:1 link).
- **Permission:** `athletes:update`
- **Request:** `{ "userId": 42 }`

#### DELETE /api/athletes/:id/user
Unlink athlete profile from user account.
- **Permission:** `athletes:update`

---

### Sessions & Attendance Endpoints

#### GET /api/sessions
List training and match sessions with date and status filters.
- **Permission:** `sessions:read`

#### POST /api/sessions
Create a training or match session. Auto-generates a 6-character alphanumeric check-in code and optionally stores GPS geofence coordinates (`latitude`, `longitude`) and `radiusMeters` (default `100`).
- **Permission:** `sessions:create`
- **Request:**
```json
{
  "teamId": 1,
  "type": "TRAINING",
  "title": "Latihan Rutin Selasa",
  "startsAt": "2026-10-20T18:00:00+07:00",
  "endsAt": "2026-10-20T20:00:00+07:00",
  "venue": "GOR Stadion Sultan Agung Bantul",
  "latitude": -7.8753,
  "longitude": 110.3519,
  "radiusMeters": 100,
  "lateToleranceMinutes": 15
}
```

#### POST /api/sessions/generate-routine
Batch generate routine sessions for Tuesday (18:00–20:00 WIB) and Saturday (19:00–21:00 WIB) within a date range (including default or custom GPS venue coordinates & radius).
- **Permission:** `sessions:create`
- **Request:** `{ "startDate": "2026-11-01", "weeks": 4, "venue": "GOR Stadion Sultan Agung Bantul", "latitude": -7.8753, "longitude": 110.3519, "radiusMeters": 100 }`

#### POST /api/sessions/:id/checkin-code
Regenerate a new 6-character check-in code for an active session.
- **Permission:** `attendance:record`

#### POST /api/sessions/:id/cancel
Cancel a scheduled session.
- **Permission:** `sessions:update`

#### GET /api/sessions/:id/attendance
Get attendance sheet for a session with all active roster athletes and their check-in status.
- **Permission:** `attendance:read`

#### PUT /api/sessions/:id/attendance
Bulk upsert attendance records by Official or Coach.
- **Permission:** `attendance:record`
- **Request:**
```json
{
  "records": [
    { "athleteId": 1, "status": "PRESENT" },
    { "athleteId": 2, "status": "LATE", "note": "Macet di jalan" },
    { "athleteId": 3, "status": "EXCUSED", "note": "Sakit" }
  ]
}
```

#### POST /api/sessions/:id/finalize
Finalize attendance sheet for a session. Automatically marks any active roster athlete without a record as `ABSENT` (BR-07).
- **Permission:** `attendance:record`

#### POST /api/attendance/check-in
Athlete hybrid self check-in: supports either **GPS Geofence Location** (`{ sessionId, latitude, longitude }`) or **6-Character Session Code Fallback** (`{ code }`).
Automatically verifies time window (`startsAt - 30m` to `endsAt`), determines `PRESENT` vs `LATE` based on server time and `lateToleranceMinutes` (BR-10), and for GPS mode calculates great-circle distance via Haversine formula to enforce `distanceMeters <= session.radiusMeters` (BR-34). Code mode is rate-limited to 5 incorrect attempts per 10 minutes (BR-15).
- **Permission:** `attendance:self`
- **Request (Mode 1 — GPS Geofence):**
```json
{
  "sessionId": 12,
  "latitude": -7.87515,
  "longitude": 110.35201
}
```
- **Request (Mode 2 — 6-Char Code Fallback):**
```json
{
  "code": "KB8821"
}
```
- **Response 200:**
```json
{
  "success": true,
  "message": "Check-in berhasil (Hadir Tepat Waktu).",
  "data": {
    "sessionTitle": "Latihan Rutin Selasa",
    "status": "PRESENT",
    "checkedInAt": "2026-10-20T10:52:00.000Z",
    "distanceMeters": 24,
    "message": "Check-in berhasil (Hadir Tepat Waktu)."
  }
}
```

#### POST /api/sessions/:id/excuse
Athlete submits an absence excuse with reason.
- **Permission:** `attendance:self`
- **Request:** `{ "reason": "Kuliah praktikum lapangan" }`

#### DELETE /api/sessions/:id/excuse
Athlete cancels previously submitted excuse.
- **Permission:** `attendance:self`

#### GET /api/attendance/me
Athlete retrieves personal attendance history, session list, and attendance rate.
- **Permission:** `attendance:self`

#### GET /api/attendance/summary
Official/Staff summary report of attendance across sessions and roster athletes.
- **Permission:** `attendance:read`

#### GET /api/attendance/summary/export
Export attendance summary matrix to Excel workbook (.xlsx).
- **Permission:** `attendance:export`

---

### Matches & Live Recorder Endpoints

#### GET /api/matches
List matches with filtering by status, competition, team, and date.
- **Permission:** `matches:read`

#### POST /api/matches
Create a new match fixture.
- **Permission:** `matches:create`
- **Request:**
```json
{
  "type": "OFFICIAL",
  "format": "K8",
  "homeTeamId": 1,
  "awayTeamId": 2,
  "competition": "Kejurda Korfball DIY 2026",
  "scheduledAt": "2026-10-25T14:00:00+07:00",
  "periodCount": 2,
  "periodDurationMinutes": 25,
  "trackShotZone": true
}
```

#### PUT /api/matches/:id/lineup
Set Home and Away lineup roster (starters and bench). Validates 4 Male + 4 Female starters for K8 format (BR-18).
- **Permission:** `matches:update`

#### POST /api/matches/:id/start
Start match (transitions from `SCHEDULED` to `LIVE`).
- **Permission:** `matches:record`

#### POST /api/matches/:id/periods/:period/start
Start a specific period.
- **Permission:** `matches:record`

#### POST /api/matches/:id/periods/:period/end
End a specific period.
- **Permission:** `matches:record`

#### PATCH /api/matches/:id/clock
Synchronize running clock seconds between client and server.
- **Permission:** `matches:record`
- **Request:** `{ "remainingSeconds": 945, "isRunning": true }`

#### POST /api/matches/:id/finish
Finish and lock match (transitions to `FINISHED`).
- **Permission:** `matches:record`

#### POST /api/matches/:id/reopen
Reopen a finished match for corrections. SuperAdmin only.
- **Permission:** `matches:reopen`

#### POST /api/matches/:id/events/batch
Idempotent batch ingestion of match events from client offline outbox.
- **Permission:** `matches:record`
- **Request:**
```json
{
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "side": "HOME",
      "type": "SHOT_MADE",
      "matchPlayerId": 105,
      "period": 1,
      "clockSeconds": 600,
      "shotSector": 3,
      "shotDistanceZone": 2
    }
  ]
}
```

#### PATCH /api/matches/:id/events/:eventId
Edit a recorded event (change player, action type, or zone).
- **Permission:** `matches:record`

#### DELETE /api/matches/:id/events/:eventId
Soft-delete a recorded event (triggers automatic score recalculation).
- **Permission:** `matches:record`

#### GET /api/matches/:id/events
Get chronological stream of match events with optional `afterSeq` cursor for incremental sync.
- **Permission:** `matches:read`

#### GET /api/matches/:id/box-score
Get full computed box score (individual player stats, team totals, period scores, running score, and substitution logs).
- **Permission:** `matches:read`

#### GET /api/matches/:id/report/export
Export official match report to formatted multi-sheet Excel workbook (.xlsx).
- **Permission:** `stats:export`

---

### Statistics Endpoints

#### GET /api/stats/players
Aggregate player leaderboard across all completed matches.
- **Permission:** `stats:read`
- **Query params:** `teamId`, `from`, `to`, `types`, `minGp`, `sort`, `direction`, `page`, `limit`
- **Metrics returned:** GP, PTS, PPG, SM, SA, %FGS, RIM, RIA, %FGR, PM, PA, %P, %FG, TOT, RPG, D, AS, APG, IT, TOV, F, YC, RC, EFF, EPG.

#### GET /api/stats/players/export
Export player leaderboard to formatted Excel workbook (.xlsx).
- **Permission:** `stats:export`

#### GET /api/stats/players/:athleteId
Get individual athlete career summary, match-by-match game logs, and chronological EFF & PTS trend.
- **Permission:** `stats:read` (or `stats:read_own` if viewing own profile; HTTP 403 Forbidden for other athletes' profiles).

#### GET /api/stats/me
Get authenticated athlete's personal career statistics and game logs.
- **Permission:** `stats:read_own`

#### GET /api/stats/team
Aggregate team performance metrics (W-L-D record, win rate, goals for/against, shooting accuracy percentages, action totals).
- **Permission:** `stats:read`

---

### Dashboard Endpoints

#### GET /api/dashboard/summary
Role-aware dashboard summary payload.
- **Auth required:** Yes
- **Staff View:** Today's session with quick check-in code copy, upcoming sessions (5), active live match, 30-day team attendance rate, 90-day team record, recent matches.
- **Athlete View:** Today's session with personal check-in state, upcoming sessions, personal 30-day attendance rate, personal career stats (GP, PTS, %FG, avg EFF), recent matches.

---

## Error Response Format

All errors follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "fieldName": ["Specific validation error"]
  }
}
```

Common HTTP status codes:
- `400` — Validation error (missing or invalid fields)
- `401` — Not authenticated (missing or expired access token)
- `403` — Forbidden (missing permission or inactive/unverified account)
- `404` — Resource not found
- `409` — Conflict (duplicate email, unique constraint violation)
- `429` — Rate limited (Global: 60 req/min; Auth endpoints: 5 req/min; Resend verification: 3 req/min)
- `500` — Internal server error
