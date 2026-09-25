import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TimesheetService } from '../services/timesheet.service';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-timesheet-form',
  styleUrl: './timesheet-form.css',
  templateUrl: './timesheet-form.html',
})
export class TimesheetForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TimesheetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  id: number | null = null;
  status = signal<string>('Draft');
  errorMessage = signal('');
  saving = signal(false);
  total = signal(0);

  days = DAYS;

  

  form = this.fb.group({
    weekEndingDate: ['', Validators.required],
    comment: [''],
    monday:    [0, [Validators.required, Validators.min(0), Validators.max(24)]],
    tuesday:   [0, [Validators.required, Validators.min(0), Validators.max(24)]],
    wednesday: [0, [Validators.required, Validators.min(0), Validators.max(24)]],
    thursday:  [0, [Validators.required, Validators.min(0), Validators.max(24)]],
    friday:    [0, [Validators.required, Validators.min(0), Validators.max(24)]],
    saturday:  [0, [Validators.required, Validators.min(0), Validators.max(24)]],
    sunday:    [0, [Validators.required, Validators.min(0), Validators.max(24)]],
  });

  
  ngOnInit() {
    this.form.valueChanges.subscribe(() => this.recalcTotal());
    this.recalcTotal();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.service.getById(this.id).subscribe({
        next: t => {
          this.status.set(t.status);
          this.form.patchValue({
            weekEndingDate: t.weekEndingDate,
            comment: t.comment ?? '',
          });
          (t.entries ?? []).forEach((e, i) =>
            this.form.get(DAYS[i])!.setValue(e.hours)
          );
          if (this.isReadOnly) this.form.disable();
          this.recalcTotal();
        },
        error: () => this.errorMessage.set('Could not load this timesheet.'),
      });
    }
  }

  get isReadOnly(): boolean {
    return this.status() === 'Submitted' || this.status() === 'Approved';
  }

  private recalcTotal() {
    const v: any = this.form.getRawValue();
    this.total.set(DAYS.reduce((sum, d) => sum + (Number(v[d]) || 0), 0));
  }

  private buildBody() {
    const v: any = this.form.getRawValue();
    const end = new Date(v.weekEndingDate + 'T00:00:00');
    const entries = DAYS.map((name, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (6 - i));
      return { workDate: d.toISOString().slice(0, 10), hours: Number(v[name]) };
    });
    return { weekEndingDate: v.weekEndingDate, comment: v.comment || undefined, entries };
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMessage.set('');

    const body = this.buildBody();
    const call = this.id ? this.service.update(this.id, body) : this.service.create(body);

    call.subscribe({
      next: () => this.router.navigate(['/timesheets']),
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  submit() {
    if (!confirm('Submit this timesheet? You will not be able to edit it afterwards.')) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMessage.set('');

    const body = this.buildBody();
    const save = this.id ? this.service.update(this.id, body) : this.service.create(body);

    save.subscribe({
      next: (t) => {
        const id = this.id ?? t.id;
        this.service.submit(id).subscribe({
          next: () => this.router.navigate(['/timesheets']),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  private handleError(err: HttpErrorResponse) {
    this.saving.set(false);
    if (err.status === 0) {
      this.errorMessage.set('Cannot reach the server. Is the API running?');
    } else {
      this.errorMessage.set(err.error?.message ?? 'Something went wrong. Please try again.');
    }
  }

  cancel() { this.router.navigate(['/timesheets']); }
}