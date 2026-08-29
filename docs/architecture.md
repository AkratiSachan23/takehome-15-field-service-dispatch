# Architecture

## System Overview & Moving Pieces

The application is architected as a modular, unified full-stack web service built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **SQLite (via `better-sqlite3`)**. 

The system consists of four primary tiers:

```
+-----------------------------------------------------------------------------------+
| Browser Client (React 19 UI)                                                      |
| - Dispatcher Command Center (Dashboard, Paginated Queue, Bulk Assignment, Alerts)  |
| - Technician Field Work Queue (Step-by-Step Execution, Parts Used, Notes)         |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP / JSON API (Cookie-authenticated)
                                          v
+-----------------------------------------------------------------------------------+
| Next.js App Router API Routes & Middleware (/api/*)                               |
| - Authentication & RBAC Enforcement (JWT Session Cookies)                         |
| - Request Validation & Parameter Parsing                                          |
+-----------------------------------------+-----------------------------------------+
                                          | Synchronous In-Process Function Calls
                                          v
+-----------------------------------------------------------------------------------+
| Domain & Business Logic Services (src/lib/*)                                      |
| - Conflict Engine: Time window overlap calculations & double-booking prevention   |
| - Lifecycle Engine: Strict status state machine & completion validation           |
| - Alerts Engine: Running-late evaluation & window fingerprint tracking             |
| - Audit Service: Append-only immutable timeline logging                           |
+-----------------------------------------+-----------------------------------------+
                                          | SQLite C-bindings (ACID Transactions)
                                          v
+-----------------------------------------------------------------------------------+
| Database Storage Engine (SQLite WAL Mode)                                         |
| - Relational schema with Foreign Keys, Check Constraints, & B-tree Indexes        |
+-----------------------------------------------------------------------------------+
```

### Component Responsibilities

1. **Client Tier (`src/components/*`)**:
   - Manages role-based interactive interfaces for Dispatchers and Technicians.
   - Dispatches authenticated REST requests and renders state changes (KPIs, queue filters, step-by-step field pipeline, modals, timeline logs).
   - Enforces responsive UX feedback (e.g. displaying double-booking conflict explanations returned by the backend).

2. **API & Route Handlers (`src/app/api/*`)**:
   - Acts as the secure boundary for all incoming requests.
   - Extracts and verifies HTTP-only JWT session tokens (`dispatch_session`).
   - Rejects unauthorized actions at the server layer (e.g. returning `403 Forbidden` if a technician attempts to create/archive jobs or assign technicians).

3. **Business Logic Layer (`src/lib/jobs.ts`, `src/lib/scheduling.ts`, `src/lib/auth.ts`)**:
   - Enforces domain invariants:
     - **Time Window Calculation**: Translates `scheduled_date`, `start_time`, and `estimated_duration` into exact UTC timestamps `[start, end)`.
     - **Conflict Detection**: Verifies that assigning a technician or rescheduling a job never creates overlapping active windows (`startA < endB && endA > startB`).
     - **Lifecycle Transitions**: Enforces `UNASSIGNED -> ASSIGNED -> EN_ROUTE -> ON_SITE -> COMPLETED`. Requires completion summary notes and at least one recorded part before allowing completion.
     - **Alert Fingerprinting**: Tracks dismissed alerts by `${scheduled_date}_${start_time}_${duration}`; resurrects alerts if a rescheduled window passes again.
     - **Immutable Audit Logging**: Emits append-only timeline events for every significant mutation.

4. **Persistence Layer (`src/lib/db.ts`)**:
   - Embedded SQLite database configured with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`), foreign key constraints (`PRAGMA foreign_keys = ON;`), and targeted indexes on search and filter columns.

---

## Where Each Piece Runs

- **Browser Client**: Runs client-side in the user's browser (Chrome, Firefox, Safari, Edge, mobile browsers).
- **Application Server**: Runs in Node.js (v20+) runtime environment (hosted on Render/Node container or local environment).
- **Database Engine**: Embedded directly in the application process via native C SQLite bindings (`better-sqlite3`), reading/writing to the local persistent filesystem (`data/dispatch.db` or in-memory during test suites).

---

## End-to-End Request Flow: Dispatcher Assigns a Technician

To demonstrate how the moving pieces interact end-to-end, consider a Dispatcher assigning technician **Alex Rivera** to **Job #12**:

1. **User Action**: The Dispatcher clicks "Assign" on Job #12 in the Dispatch Queue, selects "Alex Rivera" from the modal dropdown, and clicks "Assign".
2. **HTTP Request**: The browser sends `POST /api/jobs/12/assign` with payload `{"technicianId": 2}` and the `dispatch_session` cookie.
3. **Authentication & Role Check**:
   - `/api/jobs/[id]/assign/route.ts` reads the cookie and verifies the JWT via `jose`.
   - Confirms `user.role === 'DISPATCHER'`. If not, returns `403 Forbidden`.
4. **Domain Validation & Conflict Check**:
   - Calls `assignTechnicianToJob(12, 2, user)`.
   - Retrieves Job #12 details and calculates its time window `[2026-09-01T09:00:00, 2026-09-01T10:30:00)`.
   - Calls `findTechnicianConflicts(2, '2026-09-01', '09:00', 90, 12)`.
   - Queries all other active non-completed jobs assigned to Alex Rivera.
   - Evaluates interval overlap formula: `windowA.start < windowB.end && windowA.end > windowB.start`.
   - If an overlap is detected, throws a detailed error (e.g., *"Alex Rivera is already assigned to Job #8 (Metroplex Cinema) from 08:00 to 09:30 on 2026-09-01"*), which the route returns as `400 Bad Request`.
5. **Database Transaction Execution**:
   - If no conflict exists, initiates an ACID transaction in SQLite:
     - `INSERT INTO job_assignments (job_id, user_id, assigned_by) VALUES (12, 2, 1);`
     - If Job #12 was `UNASSIGNED`, executes `UPDATE jobs SET status = 'ASSIGNED' WHERE id = 12;`.
     - Inserts immutable timeline record into `job_timeline` with event type `ASSIGNED` and actor metadata.
6. **HTTP Response**: The handler returns `200 OK` with the updated Job object including assigned technicians and new status.
7. **UI State Update**: The React client receives the payload, closes the assignment modal, updates the job row in the queue, and refreshes the live dashboard counters and alert badges.

---

## What We Deliberately Decided NOT to Build and Why

1. **Separate Microservices Architecture**:
   - *Decision*: Kept as a cohesive modular monolith.
   - *Rationale*: A team managing a dozen technicians does not require distributed network boundaries, gRPC overhead, or eventual consistency synchronization problems. A modular monolith provides sub-millisecond in-process conflict calculations and atomic ACID guarantees.

2. **Heavy Distributed Cache (Redis / Memcached)**:
   - *Decision*: Relied on SQLite's embedded memory cache and WAL mode instead of Redis.
   - *Rationale*: `better-sqlite3` queries run in <0.2ms locally. Introducing an external cache would create cache invalidation bugs when schedules or assignments change frequently.

3. **Client-Side Filtering / Sorting**:
   - *Decision*: Implemented full server-side SQL pagination, filtering, and sorting (`/api/jobs`).
   - *Rationale*: Client-side filtering fails as job records grow. By keeping search, status filters, and pagination on the server, response payloads remain constant (~10KB) regardless of database volume.
