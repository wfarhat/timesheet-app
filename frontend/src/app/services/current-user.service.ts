import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  contractorId = signal<number>(
    Number(localStorage.getItem('contractorId') ?? 1)
  );

  set(id: number) {
    this.contractorId.set(id);
    localStorage.setItem('contractorId', String(id));
  }
}