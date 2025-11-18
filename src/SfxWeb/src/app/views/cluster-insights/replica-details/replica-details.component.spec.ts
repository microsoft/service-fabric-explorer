import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaDetailsComponent } from './replica-details.component';

describe('ReplicaDetailsComponent', () => {
  let component: ReplicaDetailsComponent;
  let fixture: ComponentFixture<ReplicaDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplicaDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
