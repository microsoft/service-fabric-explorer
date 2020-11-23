import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EventStoreComponent } from './event-store.component';

describe('EventStoreComponent', () => {
  let component: EventStoreComponent;
  let fixture: ComponentFixture<EventStoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EventStoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
