import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStoreComponent } from './event-store/event-store.component';
import { DoubleSliderComponent } from './double-slider/double-slider.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { FullDescriptionComponent } from './full-description/full-description.component';
import { RowDisplayComponent } from './row-display/row-display.component';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { OptionPickerComponent } from './option-picker/option-picker.component';
import { ConcurrentEventsVisualizationModule } from '../concurrent-events-visualization/concurrent-events-visualization.module';

@NgModule({
  declarations: [EventStoreComponent, DoubleSliderComponent, FullDescriptionComponent, RowDisplayComponent, OptionPickerComponent],
  imports: [
    CommonModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbDropdownModule,
    SharedModule,
    NgbModule,
    NgbTooltipModule,
    ConcurrentEventsVisualizationModule
  ],
  exports: [EventStoreComponent, FullDescriptionComponent, RowDisplayComponent, OptionPickerComponent],
})
export class EventStoreModule { }
