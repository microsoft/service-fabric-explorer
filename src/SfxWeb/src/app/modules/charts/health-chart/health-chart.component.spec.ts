import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthChartComponent } from './health-chart.component';

describe('HealthChartComponent', () => {
  let component: HealthChartComponent;
  let fixture: ComponentFixture<HealthChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HealthChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
