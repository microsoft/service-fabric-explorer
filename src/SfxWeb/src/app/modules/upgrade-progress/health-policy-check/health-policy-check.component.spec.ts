import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthPolicyCheckComponent } from './health-policy-check.component';

describe('HealthPolicyCheckComponent', () => {
  let component: HealthPolicyCheckComponent;
  let fixture: ComponentFixture<HealthPolicyCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HealthPolicyCheckComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthPolicyCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
