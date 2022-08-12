import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EventStoreTimelineComponent } from './event-store-timeline.component';

describe('EventStoreTimelineComponent', () => {
  let component: EventStoreTimelineComponent;
  let fixture: ComponentFixture<EventStoreTimelineComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EventStoreTimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventStoreTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
