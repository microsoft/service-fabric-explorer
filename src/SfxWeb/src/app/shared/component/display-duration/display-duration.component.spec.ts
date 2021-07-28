import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayDurationComponent } from './display-duration.component';

describe('DisplayDurationComponent', () => {
  let component: DisplayDurationComponent;
  let fixture: ComponentFixture<DisplayDurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayDurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
