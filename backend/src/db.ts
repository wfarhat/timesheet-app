import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

export const db = new DatabaseSync('timesheets.db');

db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(
  path.join(__dirname, '../db/schema.sql'),
  'utf8'
);
db.exec(schema);


export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

console.log('Database ready');