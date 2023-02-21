import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArmWarningComponent } from './arm-warning.component';

describe('ArmWarningComponent', () => {
  let component: ArmWarningComponent;
  let fixture: ComponentFixture<ArmWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArmWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArmWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
