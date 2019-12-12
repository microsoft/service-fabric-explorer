import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventStoreTableComponent } from './event-store-table.component';

describe('EventStoreTableComponent', () => {
  let component: EventStoreTableComponent;
  let fixture: ComponentFixture<EventStoreTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventStoreTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventStoreTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
