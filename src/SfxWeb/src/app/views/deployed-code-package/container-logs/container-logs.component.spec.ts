import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ContainerLogsComponent } from './container-logs.component';

describe('ContainerLogsComponent', () => {
  let component: ContainerLogsComponent;
  let fixture: ComponentFixture<ContainerLogsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
