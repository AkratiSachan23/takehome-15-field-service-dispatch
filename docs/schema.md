# Database Schema & Data Integrity

## Table-by-Table Data Dictionary

### 1. `users`
Stores user accounts for Dispatchers and Technicians.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Unique user ID |
| `email` | `TEXT` | No | `UNIQUE COLLATE NOCASE` | User email used for authentication |
| `password_hash` | `TEXT` | No | None | Bcrypt password hash |
| `name` | `TEXT` | No | None | Full display name |
| `role` | `TEXT` | No | `CHECK (role IN ('DISPATCHER', 'TECHNICIAN'))` | Role-based authorization type |
| `created_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Account creation timestamp (UTC) |

---

### 2. `jobs`
Stores field service job details, schedule windows, status, and completion records.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Unique job ID |
| `customer_name` | `TEXT` | No | None | Customer or business name |
| `site_address` | `TEXT` | No | None | Job physical location / address |
| `description` | `TEXT` | No | None | Description of work or symptoms |
| `priority` | `TEXT` | No | `CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))` | Dispatch urgency |
| `scheduled_date` | `TEXT` | No | None | Date in `YYYY-MM-DD` format |
| `start_time` | `TEXT` | No | None | 24-hour time in `HH:MM` format |
| `estimated_duration`| `INTEGER` | No | `CHECK (estimated_duration > 0)` | Duration in minutes (e.g. 60, 90) |
| `status` | `TEXT` | No | `CHECK (status IN ('UNASSIGNED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED'))` | Job lifecycle status |
| `is_archived` | `INTEGER` | No | `DEFAULT 0 CHECK (is_archived IN (0, 1))` | 0 = active in queue, 1 = archived |
| `completion_note` | `TEXT` | Yes | None | Summary of work done upon completion |
| `completed_at` | `TEXT` | Yes | None | Timestamp when marked completed |
| `created_by` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | Dispatcher who created the job |
| `created_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Creation timestamp |
| `updated_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Last modified timestamp |

---

### 3. `job_assignments`
Join table supporting many-to-many assignments between jobs and technicians.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Unique assignment record ID |
| `job_id` | `INTEGER` | No | `REFERENCES jobs(id) ON DELETE CASCADE` | Assigned job ID |
| `user_id` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | Assigned technician ID |
| `assigned_by` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | Dispatcher who made assignment |
| `assigned_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Timestamp of assignment |
| *Composite* | | | `UNIQUE(job_id, user_id)` | Prevents duplicate technician assignment |

---

### 4. `parts_used`
Records parts, materials, and quantities consumed during a job.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Unique part record ID |
| `job_id` | `INTEGER` | No | `REFERENCES jobs(id) ON DELETE CASCADE` | Associated job ID |
| `part_name` | `TEXT` | No | None | Part description or SKU |
| `quantity` | `INTEGER` | No | `CHECK (quantity > 0)` | Quantity consumed (must be positive) |
| `recorded_by` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | User who logged the part |
| `recorded_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Timestamp recorded |

---

### 5. `job_timeline` (Immutable Audit Log)
Append-only log of every lifecycle and operational event on a job.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Unique event ID |
| `job_id` | `INTEGER` | No | `REFERENCES jobs(id) ON DELETE CASCADE` | Target job ID |
| `event_type` | `TEXT` | No | `CHECK (event_type IN ('CREATED', 'STATUS_CHANGE', 'ASSIGNED', 'UNASSIGNED', 'PART_ADDED', 'NOTE_ADDED', 'COMPLETED', 'ARCHIVED', 'RESTORED', 'EDITED'))` | Event category |
| `actor_id` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | User who initiated action |
| `details` | `TEXT` | No | None | JSON payload with diff / context |
| `created_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Timestamp of event |

---

### 6. `job_notes`
Internal technician and dispatcher notes recorded on a job.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Unique note ID |
| `job_id` | `INTEGER` | No | `REFERENCES jobs(id) ON DELETE CASCADE` | Associated job ID |
| `author_id` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | Author user ID |
| `note` | `TEXT` | No | None | Note text content |
| `created_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Note creation timestamp |

---

### 7. `dismissed_alerts`
Tracks dismissed running-late alerts keyed by job and exact scheduled window fingerprint.

| Column | Type | Nullable | Key / Constraints | Description |
|---|---|---|---|---|
| `id` | `INTEGER` | No | `PRIMARY KEY AUTOINCREMENT` | Record ID |
| `job_id` | `INTEGER` | No | `REFERENCES jobs(id) ON DELETE CASCADE` | Job ID |
| `window_fingerprint`| `TEXT` | No | None | E.g. `2026-09-01_08:00_60` |
| `dismissed_by` | `INTEGER` | No | `REFERENCES users(id) ON DELETE RESTRICT` | Dispatcher who dismissed alert |
| `dismissed_at` | `TEXT` | No | `DEFAULT (datetime('now'))` | Dismissal timestamp |
| *Composite* | | | `UNIQUE(job_id, window_fingerprint)` | Prevents duplicate dismissal records |

---

## Entity Relationships

- **Users → Jobs (Created By)**: `One-to-Many`. One dispatcher creates many jobs.
- **Jobs ↔ Technicians (Assignments)**: `Many-to-Many`. Handled via `job_assignments`. Multiple technicians can collaborate on a single job, and a technician can be assigned to multiple non-overlapping jobs.
- **Jobs → Parts Used**: `One-to-Many`. Every part used line belongs to exactly one job.
- **Jobs → Timeline Events**: `One-to-Many`. An immutable append-only history of events for each job.
- **Jobs → Job Notes**: `One-to-Many`. Freeform commentary from dispatchers or assigned technicians.
- **Jobs → Dismissed Alerts**: `One-to-Many`. Tracks dismissals per schedule window fingerprint.

---

## Database vs. Application Constraints

### Enforced by the Database:
1. **Foreign Key Integrity**: `PRAGMA foreign_keys = ON;` ensures orphaned assignments, parts, and notes cannot exist.
2. **Column Constraints**: `CHECK` constraints on valid statuses, priorities, positive quantities, positive durations, and allowed user roles.
3. **Uniqueness**: `UNIQUE(job_id, user_id)` in `job_assignments` guarantees a technician cannot be assigned to the same job twice. `UNIQUE(email)` ensures distinct accounts.

### Enforced by the Application:
1. **Schedule Conflict / Double-Booking Prevention**: Calculating dynamic time intervals `[start, end)` from date, time, and duration across concurrent technician assignments requires interval comparison (`startA < endB && endA > startB`), which is executed in the domain service (`findTechnicianConflicts`).
2. **Sequential State Transitions**: Enforcing that a job must move strictly through `Unassigned -> Assigned -> En Route -> On Site -> Completed` is managed by `updateJobStatus()`.
3. **Completion Prerequisites**: Enforcing that completing a job requires both a completion note and at least one recorded part used is validated in business logic.
4. **Alert Reappearance on Window Change**: Comparing the job's active window fingerprint against `dismissed_alerts` dynamically resurrects dismissed alerts when a job is rescheduled.

---

## Deliberate Denormalization

- **`jobs.status`**: While job status could theoretically be inferred by scanning assignment and timeline logs, storing `status` directly on the `jobs` table enables high-speed B-Tree indexed queries (`idx_jobs_status`) for dashboard KPI aggregations and queue filtering without multi-table table scans.
- **`jobs.completion_note` and `jobs.completed_at`**: Denormalized directly onto `jobs` for immediate retrieval on dispatch sheets and queue overviews, while also being immutably recorded in `job_timeline`.

---

## What Would Break First at 100x Scale?

At 100x scale (~50,000 jobs and 1,200 technicians):
1. **Technician Conflict Check Query**: `findTechnicianConflicts` queries all active jobs assigned to a technician on the target date. At 100x scale, adding a composite index on `job_assignments(user_id)` and `jobs(scheduled_date, status)` becomes essential to prevent full table scans.
2. **SQLite Write Concurrency (WAL Lock)**: SQLite supports unlimited concurrent readers, but only one active writer transaction at a time. At 100x write volume (hundreds of technicians concurrently posting GPS status updates and parts), write transaction contention would occur. Moving the storage backend to PostgreSQL with Row-Level Locking (`FOR UPDATE`) on technician schedules would be the primary migration step.
