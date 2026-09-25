import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Timesheet } from '../models/timesheet';
import { CurrentUserService } from './current-user.service';

export interface Contractor { id: number; fullName: string; }

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private http = inject(HttpClient);
  private currentUser = inject(CurrentUserService);

  private url = 'http://localhost:3000/api/timesheets';

  private get options() {
    return {
      headers: new HttpHeaders({
        'X-Contractor-Id': String(this.currentUser.contractorId())
      })
    };
  }

  getContractors() {
    return this.http.get<Contractor[]>('http://localhost:3000/api/contractors');
  }

  getAll() { return this.http.get<Timesheet[]>(this.url, this.options); }
  getById(id: number) { return this.http.get<Timesheet>(`${this.url}/${id}`, this.options); }
  create(body: any) { return this.http.post<Timesheet>(this.url, body, this.options); }
  update(id: number, body: any) { return this.http.put<Timesheet>(`${this.url}/${id}`, body, this.options); }
  submit(id: number) { return this.http.post<Timesheet>(`${this.url}/${id}/submit`, {}, this.options); }
}