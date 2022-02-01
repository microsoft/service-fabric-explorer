import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InfrastructureJobsComponent as InfrastructureJobsComponent } from './infrastructurejobs.component';

describe('InfrastructureJobsComponent', () => {
  let component: InfrastructureJobsComponent;
  let fixture: ComponentFixture<InfrastructureJobsComponent>;

  beforeEach(waitForAsync( () => {
     TestBed.configureTestingModule({
      declarations: [ InfrastructureJobsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfrastructureJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
