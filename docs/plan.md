# Development Plan & Implementation History

## Work Breakdown & Sessions

The project was divided into 4 structured stages, following a test-driven, domain-first development workflow:

### Stage 1: Schema Design & Domain Business Rules (Estimated: 2.5h | Actual: 2.0h)
- **What was built**:
  - SQLite schema definition with strict table constraints, foreign keys, and indexes (`src/lib/db.ts`).
  - Scheduling time-window calculations and interval overlap conflict detection logic (`src/lib/scheduling.ts`).
  - Core domain service: Job CRUD, assignments, status lifecycle machine, parts validation, immutable timeline logger, running-late detector, and bulk assignment engine (`src/lib/jobs.ts`).
- **Why this order**: Establishing unambiguous domain invariants (e.g. double-booking prevention, status transitions, completion prerequisites) before building UI layers ensures that business rules are enforced on the server rather than accidentally coupled to frontend state.

### Stage 2: REST API Endpoints & Automated Testing (Estimated: 2.5h | Actual: 2.5h)
- **What was built**:
  - Next.js App Router API routes (`/api/auth/*`, `/api/jobs/*`, `/api/technicians`, `/api/dashboard`, `/api/alerts/*`, `/api/export`).
  - Comprehensive automated test suite (`tests/dispatch.test.ts`) covering 15 distinct test cases for role permissions, double-booking prevention, back-to-back jobs, bulk assignment partial reporting, and alert reactivation.
- **Why this order**: Running automated unit and integration tests against the API routes verified that edge cases (e.g., rescheduling into a conflict, completing without parts) were caught and returned expected HTTP status codes.

### Stage 3: Frontend User Experience & Role Views (Estimated: 4.0h | Actual: 3.5h)
- **What was built**:
  - Global CSS tokens, dark mode design system, glassmorphism panels, and badges (`src/app/globals.css`).
  - Dispatcher Command Center: KPI metrics cards, 14-day completion chart, status pipeline, and technician workload table (`src/components/DashboardView.tsx`).
  - Server-paginated Dispatch Queue with search, multi-filters, sorting, and bulk selection (`src/components/DispatchQueueView.tsx`).
  - Technician Work Queue with step-by-step lifecycle actions (`src/components/TechnicianView.tsx`).
  - Interactive modals: Create/Edit Job, Assign Technician, Bulk Assign with per-job error breakdown, Job Detail with Immutable Timeline, Parts recording, Completion checklist, and Alerts Drawer.
- **Why this order**: Building the UI against already-verified API routes allowed rapid component assembly with zero mock data placeholders.

### Stage 4: Production Build, Seed Data & Final Verification (Estimated: 2.0h | Actual: 1.5h)
- **What was built**:
  - Database seeder with realistic home-services HVAC, plumbing, and electrical jobs (`src/lib/seed.ts`).
  - Production Next.js build compilation (`npm run build`).
  - Documentation files (`docs/*`, `SUBMISSION.md`).

---

## What Took Longer than Expected

- **Schedule Conflict Edge Cases**: Making sure that back-to-back jobs (e.g. Job A ending at 10:00 and Job B starting at 10:00) did *not* trigger a false conflict while overlapping intervals (e.g. Job A 09:00-10:00 and Job B 09:30-10:30) were strictly caught required tuning boundary comparisons (`startA < endB && endA > startB`).
- **Bulk Assignment Reporting Structure**: Rather than a simple atomic all-or-nothing transaction, the requirement specified returning per-job success/failure status cards so dispatchers see exactly which jobs succeeded and which specific conflict blocked the others.

---

## What was Simplified or Cut

- **Optional Stretch Features Cut**: Kept the focus 100% on perfecting all 10 core requirements (bulletproof scheduling, server RBAC, immutable timeline, bulk reporting, alert resurrection) rather than attempting optional stretch goals like map routing or customer SMS notifications.
- **Single-Process SQLite**: Opted for SQLite with WAL mode over an external PostgreSQL server container to guarantee zero-configuration local runs and deterministic automated test execution.
