import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventChipComponent } from './event-chip.component';

describe('EventChipComponent', () => {
  let component: EventChipComponent;
  let fixture: ComponentFixture<EventChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventChipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
