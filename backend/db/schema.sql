-- Contractor Timesheet App - schema (SQLite)
-- Run with: sqlite3 timesheets.db < schema.sql
-- Note: SQLite enforces foreign keys only when enabled per connection.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS contractors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name   TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timesheets (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    contractor_id     INTEGER NOT NULL REFERENCES contractors(id),
    week_ending_date  TEXT    NOT NULL,                 -- ISO date (YYYY-MM-DD), a Sunday
    status            TEXT    NOT NULL DEFAULT 'Draft'
                      CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
    comment           TEXT,
    submitted_at      TEXT,                             -- NULL until submitted
    reviewer_comment  TEXT,                             -- stretch: approver feedback
    created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_contractor_week UNIQUE (contractor_id, week_ending_date)
);

CREATE TABLE IF NOT EXISTS timesheet_entries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    timesheet_id  INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    work_date     TEXT    NOT NULL,
    hours         NUMERIC NOT NULL DEFAULT 0 CHECK (hours >= 0 AND hours <= 24),

    CONSTRAINT uq_timesheet_day UNIQUE (timesheet_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_timesheets_contractor ON timesheets (contractor_id);
