import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClickableReplicaIdComponent } from './clickable-replica-id.component';

describe('ClickableReplicaIdComponent', () => {
  let component: ClickableReplicaIdComponent;
  let fixture: ComponentFixture<ClickableReplicaIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClickableReplicaIdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClickableReplicaIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
