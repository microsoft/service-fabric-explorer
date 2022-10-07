import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimePickerComponent } from './time-picker/time-picker.component';
import { DoubleSliderComponent } from './double-slider/double-slider.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    TimePickerComponent,
    DoubleSliderComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgbDropdownModule
  ],
  exports: [
    TimePickerComponent,
    DoubleSliderComponent
  ]
})
export class TimePickerModule { }
