import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BugReportDialogComponent } from './bug-report-dialog.component';

describe('BugReportDialogComponent', () => {
  let component: BugReportDialogComponent;
  let fixture: ComponentFixture<BugReportDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BugReportDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BugReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
