import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicatorStatusComponent } from './replicator-status.component';

describe('ReplicatorStatusComponent', () => {
  let component: ReplicatorStatusComponent;
  let fixture: ComponentFixture<ReplicatorStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplicatorStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicatorStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
