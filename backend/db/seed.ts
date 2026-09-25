import { db } from '../src/db';

// Clear all
db.exec('DELETE FROM timesheet_entries');
db.exec('DELETE FROM timesheets');
db.exec('DELETE FROM contractors');

const insertContractor = db.prepare(
  'INSERT INTO contractors (full_name, email) VALUES (?, ?)'
);

const johnId = Number(
  insertContractor.run('John M', 'john.m@example.com').lastInsertRowid
);
const adamId = Number(
  insertContractor.run('Adam X', 'adam.x@example.com').lastInsertRowid
);

const insertTimesheet = db.prepare(`
  INSERT INTO timesheets (contractor_id, week_ending_date, status, comment, submitted_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertEntry = db.prepare(`
  INSERT INTO timesheet_entries (timesheet_id, work_date, hours)
  VALUES (?, ?, ?)
`);

// Given a Sunday, return the seven dates Monday..Sunday of that week.
function weekDates(sunday: string): string[] {
  const end = new Date(sunday + 'T00:00:00');
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function seedWeek(
  contractorId: number,
  sunday: string,
  status: string,
  hours: number[],
  comment: string | null
) {
  const submittedAt = status === 'Submitted' ? new Date().toISOString() : null;
  const info = insertTimesheet.run(contractorId, sunday, status, comment, submittedAt);
  weekDates(sunday).forEach((d, i) =>
    insertEntry.run(info.lastInsertRowid, d, hours[i])
  );
}

// John has two timesheets
seedWeek(johnId, '2026-09-13', 'Submitted', [7.5, 8, 8, 8, 6, 0, 0], 'Client site all week');
seedWeek(johnId, '2026-09-20', 'Draft',     [8, 8, 7.5, 0, 0, 0, 0], null);

// Adam has no timesheets
console.log('Seed complete');