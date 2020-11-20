import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StatusWarningsComponent } from './status-warnings.component';

describe('StatusWarningsComponent', () => {
  let component: StatusWarningsComponent;
  let fixture: ComponentFixture<StatusWarningsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StatusWarningsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusWarningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
