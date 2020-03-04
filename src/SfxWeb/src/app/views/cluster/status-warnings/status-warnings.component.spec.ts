import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusWarningsComponent } from './status-warnings.component';

describe('StatusWarningsComponent', () => {
  let component: StatusWarningsComponent;
  let fixture: ComponentFixture<StatusWarningsComponent>;

  beforeEach(async(() => {
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
