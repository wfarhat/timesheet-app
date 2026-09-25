# Contractor Timesheet App

A small full-stack application that lets a contractor record weekly hours, save them as a draft, and submit them for review.

---

## Tech stack

| Layer    | Choice                                   | Version      |
| -------- | ---------------------------------------- | ------------ |
| Frontend | Angular                                  | CLI 22.2.0   |
| Backend  | Node.js + Express                        | Node 24.16.0 |
| Database | SQLite via Node's built-in `node:sqlite` | —            |

### Why this stack

Angular was required, which meant using TypeScript. Rather than adding a second language
for the backend, I used TypeScript on both sides so I could work in one language properly
within the timebox. It also means the `Timesheet` shape is described the same way on the
client and the server.

I chose SQLite so the project runs with no database installation — you can clone this
repository and start it immediately. The trade-off is that SQLite is not suited to concurrent production load;
Postgres or SQL Server would be the choice for a real deployment.

I used raw SQL rather than an ORM. Writing the queries directly keeps the tables, keys and joins visible and
explainable. All queries are parameterised, so this does not compromise safety. In a larger
codebase I would use an ORM with managed migrations.

---

## Setup and running

### Prerequisites

- Node.js 22.5 or later (developed on 24.16.0)
- npm
- Angular CLI: `npm install -g @angular/cli`

### 1. Clone the repository

```bash
git clone https://github.com/wfarhat/timesheet-app.git
cd timesheet-app
```

### 2. Backend

```bash
cd backend
npm install
npm run seed     # creates timesheets.db and inserts sample data
npm run dev      # starts the API on http://localhost:3000
```

The database file and tables are created automatically on first run.

You can check that the API is up: <http://localhost:3000/api/health> should return `{"ok":true}`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
ng serve         # starts the app on http://localhost:4200
```

Open <http://localhost:4200>. Both servers must be running.

### Resetting the database

Delete `backend/timesheets.db` and run `npm run seed` again.

---

## Sample data and switching users

`npm run seed` creates two contractors:

| Contractor | Timesheets                                              |
| ---------- | ------------------------------------------------------- |
| John M     | One **Submitted** timesheet and one **Draft** timesheet |
| Adam X     | None (shows the empty state)                            |

Use the **Viewing as** dropdown at the top of the list page to switch between them. The
selection is stored in `localStorage`, so it persists across page reloads.

---

## Architecture

```
timesheet-app/
├── backend/
│   ├── db/
│   │   ├── schema.sql          table definitions and constraints
│   │   └── seed.ts             sample data
│   ├── src/
│   │   ├── server.ts           Express app, middleware, all routes
│   │   ├── db.ts               opens SQLite, applies the schema
│   │   ├── validation.ts       Zod schema plus date rules
│   │   └── services/
│   │       └── timesheets.ts   business rules and SQL
│   └── requests.http           manual API tests (VS Code REST Client)
└── frontend/
    └── src/app/
        ├── app.config.ts       providers (router, HttpClient)
        ├── app.routes.ts       route definitions
        ├── models/             TypeScript interfaces
        ├── services/           all HTTP calls, current-user state
        ├── timesheet-list/     list page
        └── timesheet-form/     create, edit and submit
```

Routes in `server.ts` handle HTTP concerns only — reading the request and choosing a status
code. Business rules and SQL live in `services/timesheets.ts`, keeping the rules independent
of HTTP. On the frontend, components handle display and `TimesheetService` owns every HTTP
call, so the API URL exists in one place.

---

## API

All timesheet endpoints read the active contractor from an `X-Contractor-Id` header and
scope every query by it.

| Method | Path                         | Purpose                           | Status codes       |
| ------ | ---------------------------- | --------------------------------- | ------------------ |
| GET    | `/api/health`                | Liveness check                    | 200                |
| GET    | `/api/contractors`           | List contractors for the selector | 200                |
| GET    | `/api/timesheets`            | Current contractor's timesheets   | 200                |
| GET    | `/api/timesheets/:id`        | One timesheet with its entries    | 200, 404           |
| POST   | `/api/timesheets`            | Create a draft                    | 201, 400, 409      |
| PUT    | `/api/timesheets/:id`        | Update a draft                    | 200, 400, 404, 409 |
| POST   | `/api/timesheets/:id/submit` | Submit for review                 | 200, 404, 409      |

---

## Data model

```
contractors (1) ──< timesheets (many) ──< timesheet_entries (many)
```

**contractors** — `id`, `full_name`, `email` (unique), `created_at`

**timesheets** — `id`, `contractor_id` (FK), `week_ending_date`, `status`, `comment`,
`submitted_at`, `reviewer_comment`, `created_at`, `updated_at`

**timesheet_entries** — `id`, `timesheet_id` (FK), `work_date`, `hours`

### Constraints and what they enforce

| Constraint                                 | Business rule                                        |
| ------------------------------------------ | ---------------------------------------------------- |
| `UNIQUE (contractor_id, week_ending_date)` | One timesheet per contractor per week                |
| `CHECK (hours >= 0 AND hours <= 24)`       | No negative or impossible hours                      |
| `CHECK (status IN (...))`                  | Only the four valid statuses can exist               |
| `UNIQUE (timesheet_id, work_date)`         | One entry per day per timesheet                      |
| `ON DELETE CASCADE`                        | Deleting a timesheet removes its entries; no orphans |
| `REFERENCES contractors(id)`               | A timesheet must belong to a real contractor         |

---

## Assumptions

- A week runs Monday to Sunday, and the week-ending date is the Sunday.
- A timesheet always has exactly seven daily entries; days not worked are recorded as zero.
- Hours are entered in quarter-hour steps.
- The week-ending date cannot be changed after creation.
- One contractor is "logged in" at a time, chosen from the dropdown.

---

## Known limitations

- **No real authentication.** The contractor id is sent in a header the client controls.
- **No concurrency control.** If two clients edited the same timesheet, the last write would
  win silently.
- **SQLite** is not suited to concurrent production load.
- **The approver workflow is not implemented.**
- **No automated tests.** Endpoints were verified manually via `requests.http`.
- **Validation logic is duplicated** between the create and update routes; it should be
  extracted into a shared helper or middleware.
- **Configuration is hardcoded** — the API port and the frontend's API URL would move to
  environment configuration before any deployment.

---

## What I would do next

1. **Real authentication and authorisation**, replacing the header.
2. **An audit table** recording every status change with who made it and when.
3. **The approver workflow.**
4. **Email or text notifications** on submission and review.

---

## Resources and AI assistance

Documentation used:

- Angular documentation — standalone components, signals, Reactive Forms
- Express and Zod documentation
- Node `node:sqlite` documentation — prepared statements, transactions, the foreign-keys pragma
- MDN — `Date` handling and HTTP status codes

**AI assistance (Claude).** This was my first Angular project, and I used an AI assistant to:

- explain concepts I had not met before (signals,
  Reactive Forms, Observables)
- draft code which I then read and adjusted
- help with the visual design of the app
- diagnose the bugs that came up
- improve the clarity of this README

I reviewed every line before keeping it, and I have not included code I cannot explain.
