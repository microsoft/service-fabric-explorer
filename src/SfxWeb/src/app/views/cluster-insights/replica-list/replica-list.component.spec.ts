import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaListComponent } from './replica-list.component';

describe('ReplicaListComponent', () => {
  let component: ReplicaListComponent;
  let fixture: ComponentFixture<ReplicaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplicaListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
