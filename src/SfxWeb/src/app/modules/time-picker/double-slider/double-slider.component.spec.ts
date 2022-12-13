import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DoubleSliderComponent } from './double-slider.component';

describe('DoubleSliderComponent', () => {
  let component: DoubleSliderComponent;
  let fixture: ComponentFixture<DoubleSliderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DoubleSliderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DoubleSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
