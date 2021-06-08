import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InfrastructureJobViewComponent } from './infrastructure-task-view.component';

describe('InfrastructureJobViewComponent', () => {
  let component: InfrastructureJobViewComponent;
  let fixture: ComponentFixture<InfrastructureJobViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InfrastructureJobViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfrastructureJobViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
