# Submission

## Links

- **GitHub repository:** https://github.com/AkratiSachan23/takehome-15-field-service-dispatch
- **Live application:** http://localhost:3000 (or deployed URL)

## Notes for the reviewer

- The database auto-seeds on initial startup with realistic HVAC, plumbing, and electrical service jobs, past completion history, active running-late alerts, and pre-configured demo users.
- A 1-click **Quick Switch** selector is available in the top navigation bar and on the login page to seamlessly test both Dispatcher and Technician roles without manually re-typing credentials.
- All 15 automated business rule tests can be run instantly via `npm test`.

## Demo credentials

| Role | Email | Password | Name | Notes |
|------|-------|----------|------|-------|
| Dispatcher (Lead) | `dispatcher@example.com` | `dispatch123` | Sarah Jenkins | Full dispatch queue control, assignment, bulk actions, CSV export, alerts |
| Dispatcher | `dave@example.com` | `dispatch123` | Dave Martinez | Dispatcher operations |
| Technician | `alex@example.com` | `tech123` | Alex Rivera | Assigned jobs, status lifecycle (En Route, On Site), parts recording |
| Technician | `jordan@example.com` | `tech123` | Jordan Lee | Plumbing specialist |
| Technician | `taylor@example.com` | `tech123` | Taylor Smith | Appliance technician |
| Technician | `casey@example.com` | `tech123` | Casey Patel | Master plumber |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React 19 / Next.js 15 App Router | Fast, modern client components with reactive state, responsive modals, and KPI charts |
| Backend | Next.js API Routes & TypeScript | Type-safe server endpoints enforcing server-side RBAC, conflict checks, and state transitions |
| Database | SQLite via `better-sqlite3` | Zero-configuration embedded relational DB with WAL mode, foreign keys, and ACID transactions |
| Styling | Vanilla CSS Tokens & Glassmorphic UI | High-performance, responsive design system with clear role badges and accessible typography |
| Testing | Vitest | Sub-second test execution with in-memory SQLite isolation |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Server-side role enforcement via JWT session cookie and API middleware. Technicians cannot create, archive, or assign jobs. |
| 2 | Jobs CRUD & Archiving | Done | Full job creation, updating, archiving, and restoration. Schedule edits check conflicts for assigned technicians. |
| 3 | Parts used | Done | Parts belong to exactly one job, carry part name, positive quantity, recorded by user. Visible in job detail and technician view. |
| 4 | Job lifecycle with rules | Done | Strict state machine (`Unassigned -> Assigned -> En Route -> On Site -> Completed`). Rejects illegal jumps. Completion requires note and >=1 part. |
| 5 | Assignment & Double-booking prevention | Done | Many-to-many assignments. Server calculates time windows `[start, end)` and refuses overlapping assignments. Back-to-back jobs allowed. |
| 6 | Finding jobs (Search, Filter, Sort, Pagination) | Done | 100% server-side parameterized SQL search across customer and address, with status, technician, and date filters, sorting, and pagination. |
| 7 | Acting on many jobs at once (Bulk Assign & CSV) | Done | Bulk assign reports per-job success and conflict refusal details. Daily dispatch sheet export generates RFC 4180 CSV file. |
| 8 | Dashboard | Done | Headline KPIs (Scheduled Today, Completed Today, Running Late, Unassigned), status pipeline breakdown, technician workload table, 14-day completion chart. |
| 9 | History you cannot rewrite (Immutable Timeline) | Done | Dedicated append-only `job_timeline` table recording creations, assignments, status changes, parts, notes, and completions with actor metadata. No mutation endpoints. |
| 10 | Running-late alerts | Done | Real-time calculation of jobs past scheduled window. Navigation count badge. Dismissals tracked by window fingerprint; reactivates if rescheduled window expires again. |

## How much time did you actually spend?

Approximately 9.5 hours total, distributed across schema design, domain conflict logic, server-side API routes, automated testing, responsive UI views, and thorough documentation.

## What would you do next, with another 12 hours?

1. **Map-Based Route Optimization**: Integrate Mapbox / Leaflet to visualize daily technician routes and calculate travel time buffers between job locations.
2. **Push Notifications / WebSockets**: Replace polling with server-sent events (SSE) for instant real-time updates when technicians change status in the field.
3. **Inventory Stock Tracking**: Connect parts used to a warehouse stock catalog that decrements available stock and alerts when parts need replenishment.
4. **Customer SMS Handover**: Automated SMS dispatch notifications with estimated arrival times when a technician marks a job as "En Route".

## What are you least happy with in this codebase, and why?

While the SQLite single-file database architecture is exceptionally fast, zero-dependency, and perfect for a team of a dozen technicians, scaling to hundreds of concurrent technician GPS updates would require moving to PostgreSQL to leverage row-level table locks on technician schedules rather than SQLite's file-level write lock.
