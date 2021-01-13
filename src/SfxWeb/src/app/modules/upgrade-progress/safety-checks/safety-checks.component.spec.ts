import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SafetyChecksComponent } from './safety-checks.component';

describe('SafetyChecksComponent', () => {
  let component: SafetyChecksComponent;
  let fixture: ComponentFixture<SafetyChecksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SafetyChecksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SafetyChecksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
