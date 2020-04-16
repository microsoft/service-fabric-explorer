import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaStatusContainerComponent } from './replica-status-container.component';

describe('ReplicaStatusContainerComponent', () => {
  let component: ReplicaStatusContainerComponent;
  let fixture: ComponentFixture<ReplicaStatusContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplicaStatusContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaStatusContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
