import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeseriesItemComponent } from './timeseries-item.component';

describe('TimeseriesItemComponent', () => {
  let component: TimeseriesItemComponent;
  let fixture: ComponentFixture<TimeseriesItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeseriesItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeseriesItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
