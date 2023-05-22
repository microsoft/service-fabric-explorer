import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullTimePickerComponent } from './full-time-picker.component';

describe('FullTimePickerComponent', () => {
  let component: FullTimePickerComponent;
  let fixture: ComponentFixture<FullTimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FullTimePickerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FullTimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
