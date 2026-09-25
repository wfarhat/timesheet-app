import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetList } from './timesheet-list';

describe('TimesheetList', () => {
  let component: TimesheetList;
  let fixture: ComponentFixture<TimesheetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetList],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
