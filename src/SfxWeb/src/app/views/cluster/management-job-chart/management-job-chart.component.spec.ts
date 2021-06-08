import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementJobChartComponent } from './management-job-chart.component';

describe('ManagementJobChartComponent', () => {
  let component: ManagementJobChartComponent;
  let fixture: ComponentFixture<ManagementJobChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManagementJobChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagementJobChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
