import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStoreComponent } from './event-store/event-store.component';
import { EventStoreTimelineComponent } from './event-store-timeline/event-store-timeline.component';
import { DoubleSliderComponent } from './double-slider/double-slider.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { FullDescriptionComponent } from './full-description/full-description.component';
import { RowDisplayComponent } from './row-display/row-display.component';
import { FormsModule } from '@angular/forms';
import { NgbButtonsModule, NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { OptionPickerComponent } from './option-picker/option-picker.component';


@NgModule({
  declarations: [EventStoreComponent, EventStoreTimelineComponent, DoubleSliderComponent, FullDescriptionComponent, RowDisplayComponent, OptionPickerComponent],
  imports: [
    CommonModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbButtonsModule,
    NgbDropdownModule,
    SharedModule,
    NgbModule
  ],
  exports: [EventStoreComponent, FullDescriptionComponent, RowDisplayComponent, EventStoreTimelineComponent, OptionPickerComponent],
})
export class EventStoreModule { }
