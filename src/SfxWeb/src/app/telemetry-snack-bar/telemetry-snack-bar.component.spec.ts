import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TelemetrySnackBarComponent } from './telemetry-snack-bar.component';

describe('TelemetrySnackBarComponent', () => {
  let component: TelemetrySnackBarComponent;
  let fixture: ComponentFixture<TelemetrySnackBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TelemetrySnackBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TelemetrySnackBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
