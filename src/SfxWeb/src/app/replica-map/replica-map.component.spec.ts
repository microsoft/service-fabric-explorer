import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaMapComponent } from './replica-map.component';

describe('ReplicaMapComponent', () => {
  let component: ReplicaMapComponent;
  let fixture: ComponentFixture<ReplicaMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplicaMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
