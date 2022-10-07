import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoubleSliderComponent } from './double-slider/double-slider.component';



@NgModule({
  declarations: [DoubleSliderComponent],
  imports: [
    CommonModule
  ],
  exports: [
    DoubleSliderComponent
  ]
})
export class TimePickerModule { }
