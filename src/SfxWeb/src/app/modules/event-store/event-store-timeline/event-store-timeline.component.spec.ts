import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventStoreTimelineComponent } from './event-store-timeline.component';

describe('EventStoreTimelineComponent', () => {
  let component: EventStoreTimelineComponent;
  let fixture: ComponentFixture<EventStoreTimelineComponent>;

  beforeEach(async(() => {
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
