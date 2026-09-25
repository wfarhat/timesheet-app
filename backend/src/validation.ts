import { z } from 'zod';

export const timesheetSchema = z.object({
  weekEndingDate: z.string().min(1, 'Week-ending date is required'),
  comment: z.string().max(500).optional(),
  entries: z.array(z.object({
    workDate: z.string(),
    hours: z.number()
            .min(0, 'Hours cannot be negative')
            .max(24, 'Hours cannot exceed 24 in a day'),
  })).length(7, 'Exactly seven days are required'),
});

export function checkDates(weekEndingDate: string, entries: {workDate: string}[]) {
  const end = new Date(weekEndingDate + 'T00:00:00');
  if (isNaN(end.getTime())) return 'Week-ending date is not valid.';
  if (end.getDay() !== 0) return 'Week-ending date must be a Sunday.';

  const expected: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    expected.push(d.toISOString().slice(0, 10));
  }
  const actual = entries.map(e => e.workDate).sort();
  if (expected.sort().join() !== actual.join()) {
    return 'Entries must cover Monday to Sunday of the selected week.';
  }
  return null;
}

export const isQuarterHour = (h: number) => Number.isInteger(h * 4);