# Engineering Decisions

## Decision 1: Conflict Detection via Interval Overlap Math vs. Fixed Time-Slot Bucketing

- **Chose:** Dynamic start/end timestamp interval calculation `[start, end)` using the interval overlap condition `startA < endB && endA > startB`.
- **Rejected:** Discretizing the day into fixed 30-minute or 15-minute slot buckets in the database.
- **Why:** Home-service jobs have variable durations (e.g. 45 min, 75 min, 120 min) and arbitrary start times. Discretized slot tables create complex multi-row locking and boundary fragmentation. Dynamic interval comparison handles arbitrary durations accurately and enables back-to-back jobs (where Job 1 ends at 10:00 and Job 2 starts at 10:00) without false-positive conflict errors.

---

## Decision 2: Server-Side SQL Filtering & Pagination vs. Client-Side State Filtering

- **Chose:** Performing all text searches, status filters, technician filters, sorting, and pagination on the server using parameterized SQLite queries (`LIMIT` / `OFFSET`).
- **Rejected:** Returning all jobs in a single `/api/jobs` payload and filtering in the browser.
- **Why:** Requirement #6 specifically mandates server-side operations. In real-world dispatch queues with thousands of historical jobs, shipping the full dataset to the browser degrades memory, increases initial payload latency, and makes pagination inaccurate. Server-side SQL ensures sub-5ms query times and constant payload sizes.

---

## Decision 3: Alert Dismissal Tracking via Schedule Window Fingerprinting

- **Chose:** Keying dismissed running-late alerts by a composite window fingerprint `${scheduled_date}_${start_time}_${estimated_duration}` in `dismissed_alerts`.
- **Rejected:** Adding a boolean `is_dismissed` flag directly onto the `jobs` table.
- **Why:** Requirement #10 requires: *"A dispatcher can dismiss the alert. If the job's scheduled window later changes and then passes again with the job still short of Completed, the alert returns."* A simple boolean `is_dismissed = 1` would permanently silence alerts even if the dispatcher rescheduled the job to a new time. By binding the dismissal to the specific window fingerprint, changing the schedule generates a new fingerprint, automatically restoring the late alert when the new window passes.

---

## Decision 4: Immutable Audit Timeline Log Modeling

- **Chose:** A dedicated append-only `job_timeline` table storing structured JSON details and actor metadata, without providing any update or delete API endpoints.
- **Rejected:** Storing status history inside an array column or relying on general database row audit triggers.
- **Why:** Requirement #9 explicitly states that job history cannot be rewritten or deleted, even by dispatchers. An explicit relational append-only table ensures audit integrity, is easily queryable, and allows rich context diffs (e.g., status changes, technician assignments, recorded parts, completion notes).

---

## Decision 5: Bulk Assignment Transaction Strategy

- **Chose:** Sequential per-job assignment validation with granular success/failure collection (`results: [{ jobId, customerName, success, error }]`).
- **Rejected:** Wrapping the entire bulk assignment batch in an all-or-nothing single atomic transaction that rolls back the entire batch if one job conflicts.
- **Why:** Requirement #7 explicitly specifies: *"Because some of those assignments will conflict with a technician's existing overlapping window, the result reports per job what succeeded and what was refused and why, not just fail the whole batch."*
- **Later reversed:** Initially, we considered implementing bulk assignment as a single SQL transaction for maximum atomicity. However, after carefully re-evaluating the assignment specification, we reversed this to process each job in sequence within the batch, checking conflict state against both the technician's existing assignments and previously accepted jobs in the current batch. This allows dispatchers to assign multiple jobs at once while receiving clear per-job feedback on any individual conflicts.
