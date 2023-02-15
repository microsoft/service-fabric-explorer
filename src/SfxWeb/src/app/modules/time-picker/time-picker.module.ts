import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimePickerComponent } from './time-picker/time-picker.component';
import { DoubleSliderComponent } from './double-slider/double-slider.component';
import { FullTimePickerComponent } from './full-time-picker/full-time-picker.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [DoubleSliderComponent, FullTimePickerComponent, TimePickerComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    NgbDropdownModule
  ],
  exports: [
    DoubleSliderComponent,
    FullTimePickerComponent,
    TimePickerComponent
  ]
})
export class TimePickerModule { }
