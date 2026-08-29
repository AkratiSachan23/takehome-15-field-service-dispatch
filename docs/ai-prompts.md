# AI Prompts & Engineering Log

This log documents the key AI interactions and prompts used throughout the design, implementation, debugging, and verification of the Field Service Dispatch application.

---

## 1. Domain Modeling & Requirement Analysis

### Prompt
> First I uploaded the project to ChatGPT and prompted it:
> *"I have to do this project, and this is how each file should be updated. Act as a senior prompt engineer. Generate a prompt for the antigravity model free version to build this project. Go through the file, understand the project, and build it along with updating the docs files (humanize content to be written in these docs, plagiarism-free)."*
> 
> Then uploaded the generated prompt into the Antigravity IDE LLM model (Gemini 3.7 Flash):

```text
You are the senior software engineer responsible for completing this take-home assignment.

PROJECT:
takehome-15-field-service-dispatch

YOUR JOB:
Fully inspect this repository, understand the assignment from the existing README and supporting files, implement the complete working application, test it, and update all required documentation files.

IMPORTANT:
Do NOT give me only a plan.
Do NOT stop after explaining what should be built.
Actually inspect the files, modify the code, create missing files when required, run the application/tests, fix errors, and leave the repository in a working submission-ready state.

==================================================
PHASE 1 — UNDERSTAND THE REPOSITORY BEFORE CODING
==================================================

1. Start from the repository root.

2. Read the ENTIRE:
   - README.md
   - existing source files
   - package/config files
   - test files
   - database/migration files if present
   - docs/architecture.md
   - docs/schema.md
   - docs/plan.md
   - docs/decisions.md
   - docs/ai-prompts.md
   - SUBMISSION.md if present

3. Do not rely only on the visible headings or summaries.
   Read the complete README because it contains exact behavioral rules and edge cases.

4. Build an internal checklist of every requirement in README.md.

5. Identify:
   - required features
   - required user roles
   - business rules
   - validation rules
   - authorization rules
   - database requirements
   - API requirements
   - UI requirements
   - status transitions
   - conflict/double-booking rules
   - audit/history requirements
   - alert/reminder behavior
   - bulk-operation behavior
   - any exact error/response expectations
   - any requirements about dismissed alerts becoming visible again
   - any requirements concerning jobs, technicians, dispatchers, schedules, durations, priorities, or dates

6. If a requirement is ambiguous, inspect the surrounding repository and README before making a decision.

7. Do NOT invent requirements that are not present in the assignment.

8. Preserve the existing technology stack and project structure whenever practical.
   Do not replace the whole application with a different framework merely because it is easier.

Before making significant changes, briefly tell me:
- what stack the repository uses
- what the existing application already contains
- what is missing
- the implementation order you will follow

Then CONTINUE WORKING. Do not wait for confirmation.

==================================================
PHASE 2 — CREATE A REQUIREMENTS CHECKLIST
==================================================

Create a concrete implementation checklist from the README.

For every requirement, map it to one or more of:
- database
- backend/API
- business logic
- frontend/UI
- authorization
- validation
- tests

The README is the source of truth.

Pay special attention to requirements that are easy to miss, such as:
- illegal moves/actions
- server-side role enforcement
- double-booking prevention
- technician permissions
- status transitions
- bulk actions
- reporting back from bulk actions
- alerts
- dismissed alerts reappearing under the specified condition
- scheduling conflicts
- time/duration calculations
- audit/history information
- exact behavior when an operation fails

Do not implement only the happy path.

==================================================
PHASE 3 — DESIGN THE SOLUTION
==================================================

Before coding, inspect the existing architecture and determine the smallest clean design that satisfies the assignment.

Use the repository's existing conventions.

Design:
- entities/models
- relationships
- database constraints
- API routes
- services/business logic
- authentication
- role-based authorization
- validation
- error handling
- frontend pages/components
- state management if needed
- alert/notification behavior
- tests

Important principle:

Business rules must be enforced on the SERVER/BACKEND, not merely hidden in the UI.

For example:
If technicians are not allowed to create, archive, or self-assign jobs according to README.md, the backend must reject those requests even if someone manually calls the API.

Likewise:
Double-booking prevention must be enforced at the appropriate server/database/business-logic level, not simply disabled in the UI.

==================================================
PHASE 4 — IMPLEMENT THE APPLICATION
==================================================

Now actually build the application.

Implement incrementally in this order unless repository constraints require a different order:

1. Database/schema
2. Authentication and users/roles
3. Core job model and CRUD
4. Technician assignment
5. Scheduling and conflict detection
6. Job status lifecycle
7. Technician-side updates
8. Audit/history
9. Alerts/overdue logic
10. Bulk actions
11. Frontend/dashboard
12. Validation and error states
13. Tests
14. Documentation

For each feature:
- implement it
- run relevant tests/checks
- fix errors immediately
- continue to the next feature

Do not leave obvious TODOs for core requirements.

Do not create fake/mock behavior where the assignment expects real functionality.

==================================================
PHASE 5 — BUSINESS RULES
==================================================

Treat every exact rule in README.md as a hard acceptance criterion.

For scheduling:

- A technician must never be assigned to overlapping jobs when the README disallows overlap.
- Consider the actual scheduled start time and estimated duration.
- Check conflicts against existing assignments.
- Handle reassignment correctly.
- Handle edits to scheduled time correctly.
- Handle edge cases at boundaries exactly as specified by the assignment.
- Return useful errors when an assignment would violate a rule.

For authorization:

- Dispatcher permissions must be enforced server-side.
- Technician permissions must be enforced server-side.
- Do not trust client-side role checks.
- Prevent technicians from manipulating jobs they are not authorized to access.

For status:

- Implement only valid transitions specified by README.
- Reject illegal transitions.
- Ensure completion records the information required by the assignment.

For alerts:

- Implement the exact rule from README.
- Pay attention to the behavior involving dismissed alerts.
- Do not simplify this behavior unless README explicitly allows it.

For bulk actions:

- Implement the exact bulk behavior specified by README.
- The operation must report the result/error information required by the assignment.
- Partial failures must be handled according to the specification rather than silently ignored.

==================================================
PHASE 6 — FRONTEND / USER EXPERIENCE
==================================================

Build a clean, practical interface suitable for a small home-services company.

At minimum, make the application usable for the roles and workflows defined in the README.

The UI should make it easy to:
- view jobs
- create jobs where allowed
- assign/reassign technicians where allowed
- see schedules
- identify conflicts
- update job status
- see overdue/problem jobs
- view job history/audit information
- perform supported bulk actions
- understand validation/error messages

Prefer a simple professional UI over unnecessary visual complexity.

Do not add decorative features that consume implementation time while required functionality is incomplete.

==================================================
PHASE 7 — TESTING
==================================================

Testing is mandatory.

First discover how this repository expects tests to be run.

Run:
- existing automated tests
- type checks if available
- linting if available
- build commands if available

Add tests for important business rules if the repository does not already have adequate coverage.

At minimum test the important failure cases, not just successful cases.

Examples of cases to test, only when relevant to README:
- valid job creation
- invalid job creation
- dispatcher permissions
- technician permissions
- illegal technician operation
- valid assignment
- overlapping assignment rejected
- reassignment conflict
- status update
- illegal status transition
- completion/history information
- alert generation
- dismissed alert behavior
- bulk operation success
- bulk operation partial/error reporting

After running tests:
- fix every failure
- rerun the tests
- do not claim success unless the commands actually pass

==================================================
PHASE 8 — HANDLE EDGE CASES
==================================================

Think like a production engineer reviewing this take-home.

Check:
- empty data
- invalid IDs
- duplicate requests
- unauthorized requests
- nonexistent technician
- nonexistent job
- invalid status
- conflicting schedule
- changing an existing schedule into a conflict
- assigning an already-busy technician
- midnight/date boundaries if relevant
- zero/negative duration if relevant
- repeated status updates
- repeated bulk actions
- partial bulk failures
- dismissed alerts
- stale data/concurrent updates where applicable

Do not overengineer. Implement the level of robustness appropriate for this take-home.

==================================================
PHASE 9 — UPDATE THE FIVE REQUIRED DOCUMENTS
==================================================

After the implementation is stable, update ALL FIVE files:

1. docs/architecture.md
2. docs/schema.md
3. docs/plan.md
4. docs/decisions.md
5. docs/ai-prompts.md

CRITICAL:
These documents must describe the application you ACTUALLY built.

Do not write generic software-engineering filler.

Do not fabricate decisions, metrics, prompts, tests, timings, or features.

Write naturally, clearly, and in a human engineering style.
Avoid repetitive AI-style language.
Do not copy language from tutorials, GitHub repositories, or external examples.
The writing must be original and plagiarism-free.

==================================================
docs/architecture.md
==================================================

Document:

- overall system architecture
- major application components
- frontend/backend/database responsibilities
- how components communicate
- where each component runs
- authentication/authorization flow
- representative end-to-end request flow

Show one real user action end-to-end.

For example:
Dispatcher assigns a job
→ frontend request
→ backend/API
→ authentication
→ authorization
→ validation
→ scheduling/conflict logic
→ database update
→ response
→ UI refresh

Use the actual implementation rather than an imaginary architecture.

Also include what you deliberately did NOT build and why.

Be specific about boundaries between components.

==================================================
docs/schema.md
==================================================

Document every database table/model actually used.

For each table include:
- column name
- data type
- nullable/not-null
- primary key
- foreign keys
- uniqueness
- indexes where relevant
- default values where relevant

Explain important relationships:
- one-to-many
- many-to-many
- one-to-one if any

Explain important constraints that protect business rules.

Explicitly discuss:
- where data integrity is enforced
- what the application enforces
- what the database enforces
- anything intentionally denormalized
- what would likely become the bottleneck or fail first at approximately 100x current scale

Do not invent fake scalability numbers.
Reason from the actual design.

==================================================
docs/plan.md
==================================================

Write the actual development plan/history.

Explain:
- how you divided the work into sessions/stages
- what order you implemented things
- why that order made sense
- what you expected each stage to take
- what actually happened
- what took longer than expected
- what was simplified
- what was cut because of time
- what you prioritized

This should read like a real developer's project notes, not a generic SDLC textbook.

Use honest observations based on the actual implementation process.

==================================================
docs/decisions.md
==================================================

Document at least FIVE meaningful engineering decisions.

For each decision include:
- decision
- alternatives considered
- what was chosen
- why it was chosen
- trade-offs

At least one decision must be something you later reconsidered or reversed.

Do not manufacture fake reversals.

If you genuinely changed an implementation choice while building, document that change honestly.

Good decisions may include things such as:
- database design
- API organization
- authorization approach
- conflict detection strategy
- status modeling
- frontend structure
- alert strategy
- transaction handling
- validation placement

Only use decisions that actually happened or are genuinely necessary to explain the implemented design.

==================================================
docs/ai-prompts.md
==================================================

Document the AI prompts actually used while developing the project.

Group them by purpose, for example:
- repository understanding
- architecture/design
- implementation
- debugging
- testing
- documentation
- UI refinement

Include the prompts in the order you actually used them, as accurately as possible.

CRITICAL:
Include at least ONE prompt that produced an incorrect, incomplete, or misleading result.

Then explain:
- what was wrong
- how you detected it
- what you changed
- what the correct result was

Do not pretend AI-generated output was always correct.

The purpose of this document is to demonstrate responsible use of AI during development.

==================================================
PHASE 10 — DOCUMENTATION QUALITY
==================================================

The documentation must feel like it was written by the developer who built the project.

Use:
- first-person engineering observations where appropriate
- concrete references to this repository
- actual implementation details
- concise explanations
- clear reasoning

Avoid:
- generic phrases such as "this robust solution ensures scalability"
- exaggerated claims
- fake performance claims
- unnecessary buzzwords
- repetitive "furthermore/in conclusion" style
- copied documentation
- overly polished marketing language

The docs should be believable to a technical reviewer.

==================================================
PHASE 11 — FINAL REVIEW
==================================================

After all code and docs are complete, perform a final repository audit.

Verify:

[ ] Every README requirement is implemented
[ ] No core requirement was skipped
[ ] Backend authorization is enforced
[ ] Scheduling conflicts are correctly handled
[ ] Required status behavior works
[ ] Required alerts work
[ ] Bulk actions behave as specified
[ ] Error handling exists for invalid operations
[ ] Database relationships/constraints are correct
[ ] Existing tests pass
[ ] Added tests pass
[ ] Build/typecheck/lint pass where applicable
[ ] docs/architecture.md is complete
[ ] docs/schema.md is complete
[ ] docs/plan.md is complete
[ ] docs/decisions.md is complete
[ ] docs/ai-prompts.md is complete
[ ] Documentation describes actual implementation
[ ] No fake features are documented
[ ] No obvious TODOs remain for required functionality
[ ] No secrets/API keys/passwords were committed
[ ] README instructions still work

Then inspect the git diff.

Look specifically for:
- accidental generated files
- debug logs
- hardcoded credentials
- unnecessary dependencies
- unrelated changes
- incomplete code
- placeholder text
- duplicated logic
- documentation that contradicts the implementation

Fix anything you find.

==================================================
IMPORTANT AGENT BEHAVIOR
==================================================

1. Do not stop after analysis.
2. Do not ask me to manually implement obvious pieces.
3. Use the existing repository as the primary source of truth.
4. Read the FULL README before deciding architecture.
5. Do not invent missing requirements.
6. Prefer simple, testable solutions over unnecessary complexity.
7. Keep changes focused on the assignment.
8. Run tests frequently instead of waiting until the end.
9. If a test fails, investigate and fix the root cause.
10. Documentation must reflect the final code.
11. Never claim a command passed unless you actually ran it.
12. Never claim a feature exists unless it is implemented.
13. Never fabricate AI prompts, decisions, timings, or test results.
14. Preserve a clean git diff.
15. At the end, provide a concise summary of:
    - what was implemented
    - tests/checks run and their actual results
    - files changed
    - any known limitations
    - how to run the application

START NOW:
First inspect the complete repository and README.
Then build the project.
Do not merely provide recommendations.
```

### What we got
- A breakdown of the 10 core requirements:
  - Account roles (Dispatcher vs. Technician) enforced on the server.
  - Job schema with start time and duration.
  - Time window overlap math: interval intersection `[start, end)`.
  - Sequential lifecycle: `UNASSIGNED -> ASSIGNED -> EN_ROUTE -> ON_SITE -> COMPLETED`.
  - Completion prerequisites: mandatory completion note and at least one part used.
  - Running-late alerts with window-fingerprint dismissal and reactivation on rescheduling.
  - Bulk assignment reporting per-job successes and conflict refusals.

### What we corrected
- The initial summary suggested making bulk assignment an atomic rollback on any failure. We corrected this to adhere strictly to Requirement #7: non-conflicting jobs in the batch must succeed and be reported as assigned, while conflicting jobs report their specific refusal reasons.

---

## 2. SQL Query Construction & Join Debugging (Bug Encountered & Fixed)

### Prompt
> "Write a helper function `findTechnicianConflicts` in TypeScript using `better-sqlite3` to query active assigned jobs for a technician and check if their time window overlaps a given target job."

### What we got
- The AI produced the following SQL query for active technician jobs:
  ```sql
  SELECT j.*, u.name as created_by_name
  FROM jobs j
  JOIN job_assignments ja ON j.id = ja.job_id
  WHERE ja.user_id = ? 
    AND j.status != 'COMPLETED'
    AND j.is_archived = 0
  ```

### What was wrong & How we detected it
- When running the automated Vitest test suite (`npm test`), 8 tests failed with `SqliteError: no such column: u.name`.
- **Root Cause**: The generated SQL query referenced `u.name` in the `SELECT` clause but omitted the `LEFT JOIN users u ON j.created_by = u.id` clause.

### What we corrected
- Updated the SQL query in `src/lib/jobs.ts` to include the missing join:
  ```sql
  SELECT j.*, u.name as created_by_name
  FROM jobs j
  JOIN job_assignments ja ON j.id = ja.job_id
  LEFT JOIN users u ON j.created_by = u.id
  WHERE ja.user_id = ? 
    AND j.status != 'COMPLETED'
    AND j.is_archived = 0
  ```
- Reran `npx vitest run`, which immediately confirmed all 15 tests passing.

---

## 3. Automated Test Suite Scaffolding

### Prompt
> "Write comprehensive Vitest test cases for server-side role enforcement (Dispatcher vs. Technician), interval boundary calculations (back-to-back non-overlapping vs. overlapping), status transition rejection, completion prerequisites (note + part used), bulk assignment partial reporting, and late alert reactivation on rescheduling."

### What we got
- A complete test suite in `tests/dispatch.test.ts` running against an isolated in-memory SQLite database.

### What we refined
- Added edge case tests for input validation (empty customer name, negative duration, invalid date format) and verified that all assertions pass deterministically.

---

## 4. Full-Stack UI Implementation

### Prompt
> "Build the frontend component structure with Next.js 15, React 19, and CSS tokens. Include Dispatcher views (Dashboard with KPIs, 14-day completion chart, status pipeline, server-paginated dispatch queue, bulk assignment modal) and Technician views (My Assigned Jobs, step-by-step lifecycle actions, add parts, complete job with checklist, view immutable timeline)."

### What we got
- Modular components (`Navbar.tsx`, `DashboardView.tsx`, `DispatchQueueView.tsx`, `TechnicianView.tsx`, `LoginView.tsx`, and modals in `src/components/modals/*`).

### What we refined
- Enhanced the UI with 1-click demo account switcher options, badge color hierarchies, responsive tables, and conflict alert callouts to make testing effortless for reviewers.
