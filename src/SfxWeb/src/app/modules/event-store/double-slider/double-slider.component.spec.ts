import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DoubleSliderComponent } from './double-slider.component';

describe('DoubleSliderComponent', () => {
  let component: DoubleSliderComponent;
  let fixture: ComponentFixture<DoubleSliderComponent>;

  beforeEach(async(() => {
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
