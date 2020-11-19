import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestLoggingComponent } from './request-logging.component';

describe('RequestLoggingComponent', () => {
  let component: RequestLoggingComponent;
  let fixture: ComponentFixture<RequestLoggingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestLoggingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestLoggingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
