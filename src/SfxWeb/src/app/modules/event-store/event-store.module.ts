import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStoreComponent } from './event-store/event-store.component';
import { EventStoreTimelineComponent } from './event-store-timeline/event-store-timeline.component';
import { EventStoreTableComponent } from './event-store-table/event-store-table.component';
import { DoubleSliderComponent } from './double-slider/double-slider.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { FullDescriptionComponent } from './full-description/full-description.component';
import { RowDisplayComponent } from './row-display/row-display.component';
import { FormsModule } from '@angular/forms';
import { NgbButtonsModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [EventStoreComponent, EventStoreTimelineComponent, EventStoreTableComponent, DoubleSliderComponent, FullDescriptionComponent, RowDisplayComponent],
  imports: [
    CommonModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbButtonsModule,
    SharedModule
  ],
  exports: [EventStoreComponent, FullDescriptionComponent, RowDisplayComponent],
  entryComponents: [FullDescriptionComponent, RowDisplayComponent]
})
export class EventStoreModule { }
