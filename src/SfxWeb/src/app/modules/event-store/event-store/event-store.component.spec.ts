import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventStoreComponent } from './event-store.component';

describe('EventStoreComponent', () => {
  let component: EventStoreComponent;
  let fixture: ComponentFixture<EventStoreComponent>;

  beforeEach(async(() => {
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
