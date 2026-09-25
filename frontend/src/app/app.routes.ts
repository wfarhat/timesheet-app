import { Routes } from '@angular/router';
import { TimesheetList } from './timesheet-list/timesheet-list';
import { TimesheetForm } from './timesheet-form/timesheet-form';

export const routes: Routes = [
  { path: '', redirectTo: 'timesheets', pathMatch: 'full' },
  { path: 'timesheets', component: TimesheetList },
  { path: 'timesheets/new', component: TimesheetForm },
  { path: 'timesheets/:id', component: TimesheetForm },
];