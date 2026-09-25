import { db, transaction } from '../db';

export function listContractors() {
  return db.prepare('SELECT id, full_name AS fullName FROM contractors ORDER BY id').all();
}

export function listTimesheets(contractorId: number) {
  return db.prepare(`
    SELECT t.id,
           t.week_ending_date        AS weekEndingDate,
           t.status,
           t.submitted_at            AS submittedAt,
           COALESCE(SUM(e.hours), 0) AS totalHours
    FROM timesheets t
    LEFT JOIN timesheet_entries e ON e.timesheet_id = t.id
    WHERE t.contractor_id = ?
    GROUP BY t.id
    ORDER BY t.week_ending_date DESC
  `).all(contractorId);
}

export function getTimesheet(contractorId: number, id: number) {
  const sheet: any = db.prepare(`
    SELECT id, week_ending_date AS weekEndingDate, status,
           submitted_at AS submittedAt, comment
    FROM timesheets WHERE id = ? AND contractor_id = ?
  `).get(id, contractorId);

  if (!sheet) return null;

  const entries: any[] = db.prepare(`
    SELECT work_date AS workDate, hours
    FROM timesheet_entries WHERE timesheet_id = ? ORDER BY work_date
  `).all(id);

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  return { ...sheet, entries, totalHours };
}


export function createTimesheet(contractorId: number, data: any) {
  return transaction(() => {
    const info = db.prepare(`
      INSERT INTO timesheets (contractor_id, week_ending_date, comment)
      VALUES (?, ?, ?)
    `).run(contractorId, data.weekEndingDate, data.comment ?? null);

    const insertEntry = db.prepare(`
      INSERT INTO timesheet_entries (timesheet_id, work_date, hours) VALUES (?, ?, ?)
    `);
    for (const e of data.entries) {
      insertEntry.run(info.lastInsertRowid, e.workDate, e.hours);
    }
    return Number(info.lastInsertRowid);
  });
}

const EDITABLE = ['Draft', 'Rejected'];

export function updateTimesheet(contractorId: number, id: number, data: any) {
  const sheet: any = db.prepare(
    'SELECT status FROM timesheets WHERE id = ? AND contractor_id = ?'
  ).get(id, contractorId);

  if (!sheet) return { error: 'notfound' };
  if (!EDITABLE.includes(sheet.status)) return { error: 'locked' };

  transaction(() => {
    db.prepare(`UPDATE timesheets SET comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`).run(data.comment ?? null, id);
    db.prepare('DELETE FROM timesheet_entries WHERE timesheet_id = ?').run(id);
    const insert = db.prepare(`INSERT INTO timesheet_entries
      (timesheet_id, work_date, hours) VALUES (?, ?, ?)`);
    for (const e of data.entries) insert.run(id, e.workDate, e.hours);
  });

  return { ok: true };
}

export function submitTimesheet(contractorId: number, id: number) {
  const sheet: any = db.prepare(
    'SELECT status FROM timesheets WHERE id = ? AND contractor_id = ?'
  ).get(id, contractorId);

  if (!sheet) return { error: 'notfound' };
  if (!EDITABLE.includes(sheet.status)) return { error: 'locked' };

  db.prepare(`UPDATE timesheets SET status = 'Submitted',
              submitted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  return { ok: true };
}