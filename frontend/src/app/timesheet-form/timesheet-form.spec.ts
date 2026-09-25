import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetForm } from './timesheet-form';

describe('TimesheetForm', () => {
  let component: TimesheetForm;
  let fixture: ComponentFixture<TimesheetForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
