export interface TimesheetEntry {
  workDate: string;
  hours: number;
}

export interface Timesheet {
  id: number;
  weekEndingDate: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  totalHours: number;
  submittedAt: string | null;
  comment?: string;
  entries?: TimesheetEntry[];
}