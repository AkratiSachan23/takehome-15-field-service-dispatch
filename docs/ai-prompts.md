# AI Prompts & Engineering Log

This log documents the prompts used during the development of the Field Service Dispatch system, grouped by problem area, along with notes on what the model produced, where it failed, and what was corrected.

---

## 1. Project Scaffolding & Relational Schema Design

### Prompt
> "I am building a field service dispatch system with Next.js 15, React 19, and better-sqlite3. Design an embedded SQLite schema with tables for `users` (DISPATCHER, TECHNICIAN), `jobs` (customer, address, description, priority, scheduled_date YYYY-MM-DD, start_time HH:MM, estimated_duration minutes, status, is_archived, completion details), `job_assignments` (supporting many-to-many assignments), `parts_used` (part_name, positive quantity, recorded_by), `job_timeline` (immutable append-only event log), `job_notes`, and `dismissed_alerts` (keyed by job ID and schedule window fingerprint). Include foreign keys, check constraints, and performance indexes."

### What was produced
- Created `src/lib/db.ts` with schema definition, `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;`, and table constraints.
- Seed runner script `scripts/seed.mjs` and domain types in `src/lib/types.ts`.

---

## 2. Double-Booking Overlap Validation & Rescheduling Logic

### Prompt
> "Write a scheduling validation engine in TypeScript. Given a target job with date `YYYY-MM-DD`, start time `HH:MM`, and duration in minutes:
> 1. Calculate the exact `[start, end)` time window.
> 2. Implement `doWindowsOverlap(windowA, windowB)` using half-open intervals so back-to-back jobs (e.g., 09:00–10:00 and 10:00–11:00) do NOT conflict.
> 3. Implement `findTechnicianConflicts(technicianId, scheduledDate, startTime, durationMinutes, excludeJobId)` that queries all active, non-completed, non-archived jobs assigned to the technician and flags any overlap with a human-readable conflict message."

### What was produced
- Created `src/lib/scheduling.ts` and conflict query in `src/lib/jobs.ts`.

---

## 3. SQL Query Join Bug (Flawed AI Output & Correction)

### Prompt
> "Write the SQL query inside `findTechnicianConflicts` in `src/lib/jobs.ts` to fetch all active assigned jobs for a technician."

### What the AI produced (Flawed)
```sql
SELECT j.*, u.name as created_by_name
FROM jobs j
JOIN job_assignments ja ON j.id = ja.job_id
WHERE ja.user_id = ? 
  AND j.status != 'COMPLETED'
  AND j.is_archived = 0
```

### What was wrong & How it was detected
- **Detection**: When running the test suite (`npm test`), multiple tests crashed with `SqliteError: no such column: u.name`.
- **Root cause**: The query selected `u.name as created_by_name` but forgot the `LEFT JOIN users u ON j.created_by = u.id` clause.

### Correction applied
- Added the missing `LEFT JOIN users u ON j.created_by = u.id` in `src/lib/jobs.ts`:
```sql
SELECT j.*, u.name as created_by_name
FROM jobs j
JOIN job_assignments ja ON j.id = ja.job_id
LEFT JOIN users u ON j.created_by = u.id
WHERE ja.user_id = ? 
  AND j.status != 'COMPLETED'
  AND j.is_archived = 0
```
- Re-ran tests, confirming the error was resolved.

---

## 4. Bulk Assignment & Granular Error Reporting Strategy

### Prompt
> "Implement `bulkAssignJobs(jobIds, technicianId, user)` in `src/lib/jobs.ts`. Only dispatchers can call this. A dispatcher selects multiple unassigned jobs for a day to assign to one technician. Some assignments may conflict with the technician's existing schedule or with earlier jobs in the same batch. Rather than failing the entire batch atomically, return a structured result reporting per job what succeeded and what was refused and why."

### What was produced
- Implemented sequential validation loop in `src/lib/jobs.ts` returning `{ totalRequested, successCount, failureCount, results: [{ jobId, customerName, success, error }] }`.

---

## 5. Running-Late Alerts & Window Fingerprint Reactivation

### Prompt
> "Implement running-late alert detection and dismissal in `src/lib/jobs.ts` and `src/lib/scheduling.ts`. A job counts as running late if it is not completed and the current time is past its scheduled window end time. A dispatcher can dismiss the alert. However, if the job's scheduled window changes (date, time, or duration) and passes again while still not completed, the alert must reappear. How should this be modeled?"

### What was produced
- Implemented `getWindowFingerprint(scheduledDate, startTime, durationMinutes)` producing `${scheduledDate}_${startTime}_${durationMinutes}`.
- Dismissals are stored in `dismissed_alerts(job_id, window_fingerprint)`. If the job is rescheduled, its fingerprint changes, allowing the late alert to trigger again once the new window expires.

---

## 6. Server-Side Filtering, Searching, Sorting, and Pagination

### Prompt
> "Write `listJobs(params, user)` in `src/lib/jobs.ts` using parameterized SQLite queries. Support text search over customer_name and site_address, filters for status, technician, scheduledDate, includeArchived, sorting by scheduled_date, priority, status, or created_at, and pagination with `page`, `pageSize`, `total`, and `totalPages`. Ensure technicians are strictly scoped to their assigned jobs on the server."

### What was produced
- Dynamic SQL query builder with parameterized bindings in `src/lib/jobs.ts` and route handler in `src/app/api/jobs/route.ts`.

---

## 7. Vitest Automated Acceptance Test Suite

### Prompt
> "Create a Vitest test suite in `tests/dispatch.test.ts` testing the entire business logic against an isolated in-memory SQLite database. Include tests for:
> 1. Role enforcement: Dispatchers can create/archive/assign; Technicians cannot.
> 2. Double-booking overlap rejection and back-to-back allowance.
> 3. Strict lifecycle state machine (`Unassigned -> Assigned -> En Route -> On Site -> Completed`).
> 4. Completion prerequisites: mandatory note + at least one part used.
> 5. Multi-technician assignment to a single job.
> 6. Bulk assignment partial success/conflict reporting.
> 7. Dismissed late alert reappearance after rescheduling.
> 8. Daily CSV dispatch sheet generation."

### What was produced
- 17 unit/integration tests in `tests/dispatch.test.ts` verifying all 10 core requirements from `README.md`.
