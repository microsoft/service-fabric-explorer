import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaStatusComponent } from './replica-status.component';

describe('ReplicaStatusComponent', () => {
  let component: ReplicaStatusComponent;
  let fixture: ComponentFixture<ReplicaStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplicaStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
