import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadEventsComponent } from './load-events.component';

describe('LoadEventsComponent', () => {
  let component: LoadEventsComponent;
  let fixture: ComponentFixture<LoadEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadEventsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
