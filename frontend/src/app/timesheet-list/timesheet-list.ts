import { Component, OnInit, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TimesheetService, Contractor } from '../services/timesheet.service';
import { CurrentUserService } from '../services/current-user.service';
import { Timesheet } from '../models/timesheet';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-timesheet-list',
  styleUrl: './timesheet-list.css',
  templateUrl: './timesheet-list.html',
})
export class TimesheetList implements OnInit {
  private service = inject(TimesheetService);
  currentUser = inject(CurrentUserService);

  timesheets = signal<Timesheet[]>([]);
  contractors = signal<Contractor[]>([]);
  errorMessage = signal('');
  loading = signal(true);

  ngOnInit() {
    this.service.getContractors().subscribe({
      next: c => this.contractors.set(c),
      error: () => {},
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.service.getAll().subscribe({
      next: data => { this.timesheets.set(data); this.loading.set(false); },
      error: () => { this.errorMessage.set('Could not load timesheets.'); this.loading.set(false); },
    });
  }

  onContractorChange(event: Event) {
    this.currentUser.set(Number((event.target as HTMLSelectElement).value));
    this.load();
  }
}