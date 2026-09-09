import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStoreComponent } from './event-store/event-store.component';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { RowDisplayComponent } from './row-display/row-display.component';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { OptionPickerComponent } from './option-picker/option-picker.component';
import { ConcurrentEventsVisualizationModule } from '../concurrent-events-visualization/concurrent-events-visualization.module';
import { TimelineComponent } from './timeline/timeline.component';
import { TimePickerModule } from '../time-picker/time-picker.module';
import { VisualizationDirective } from './visualization.directive';
import { RcaVisualizationComponent } from './rca-visualization/rca-visualization.component';
import { EventNavigatorComponent } from './event-navigator/event-navigator.component';
import { EventQueryBarComponent } from './event-query-bar/event-query-bar.component';
import { EventResultsComponent } from './event-results/event-results.component';
import { EventAnalysisComponent } from './event-analysis/event-analysis.component';

@NgModule({
  declarations: [EventStoreComponent, RowDisplayComponent, OptionPickerComponent, TimelineComponent, VisualizationDirective, RcaVisualizationComponent],
  imports: [
    EventNavigatorComponent,
    EventQueryBarComponent,
    EventResultsComponent,
    EventAnalysisComponent,
    CommonModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbDropdownModule,
    SharedModule,
    NgbModule,
    NgbTooltipModule,
    ConcurrentEventsVisualizationModule,
    TimePickerModule
  ],
  exports: [EventStoreComponent, RowDisplayComponent, OptionPickerComponent, TimelineComponent],
})
export class EventStoreModule { }
