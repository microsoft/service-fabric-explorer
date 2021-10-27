import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RefreshRateComponent } from './refresh-rate.component';

describe('RefreshRateComponent', () => {
  let component: RefreshRateComponent;
  let fixture: ComponentFixture<RefreshRateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RefreshRateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RefreshRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
