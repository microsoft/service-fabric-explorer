import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyChecksComponent } from './safety-checks.component';

describe('SafetyChecksComponent', () => {
  let component: SafetyChecksComponent;
  let fixture: ComponentFixture<SafetyChecksComponent>;

  beforeEach(async(() => {
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
