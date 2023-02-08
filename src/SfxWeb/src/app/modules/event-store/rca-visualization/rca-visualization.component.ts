import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { getSimultaneousEventsForEvent, IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { ListColumnSettingWithEmbeddedVis } from 'src/app/Models/ListSettings';
import { VisualizationLogoComponent } from '../../concurrent-events-visualization/visualization-logo/visualization-logo.component';
import { VisualizationToolComponent } from '../../concurrent-events-visualization/visualization-tool/visualization-tool.component';
import { IEventStoreData } from '../event-store/event-store.component';
import { EventColumnUpdate, VisualizationComponent, VisUpdateData } from '../visualizationComponents';

@Component({
  selector: 'app-rca-visualization',
  templateUrl: './rca-visualization.component.html',
  styleUrls: ['./rca-visualization.component.scss']
})
export class RcaVisualizationComponent implements VisualizationComponent {

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Output() updateColumn = new EventEmitter<EventColumnUpdate>();

  public simulEvents: Record<string, IConcurrentEvents> = {};
  public simulEventsList: IConcurrentEvents[] = [];

  constructor(public changeDetector: ChangeDetectorRef) { }

  private getConcurrentEventsData() {
    let sourceEvents = [];
    for (const data of this.listEventStoreData) {
      if (data.eventsList.lastRefreshWasSuccessful) {
        sourceEvents = sourceEvents.concat(data.getEvents());
      }
    }

    // refresh vis-event-list
    this.simulEventsList = getSimultaneousEventsForEvent(RelatedEventsConfigs, sourceEvents, sourceEvents);
   
    this.simulEventsList.forEach(event => {
      if (event.reason) {
        this.simulEvents[event.eventInstanceId] = event; 
      }
    })

    for (const data of this.listEventStoreData) {
      
      let newLogoSetting = new ListColumnSettingWithEmbeddedVis(
        VisualizationLogoComponent,
        'visPresent',
        'Visualization',
        this.simulEvents,
        {
          enableFilter: true,
          colspan: 1,
          id: 'visPresent'
        });
      newLogoSetting.fixedWidthPx = 100;
      
      const visTool = new ListColumnSettingWithEmbeddedVis(
        VisualizationToolComponent,
        '',
        '',
        this.simulEvents,
        {
          enableFilter: false,
          colspan: 3,
          id: 'visTool',
        }
      );
     
      this.updateColumn.emit({ columnSetting: newLogoSetting, listName: data.displayName, isSecondRow: false, index: 1});
      this.updateColumn.emit({ columnSetting: visTool, listName: data.displayName, isSecondRow: true });
    }
  }

  public update(data: VisUpdateData) {
    this.listEventStoreData = data.listEventStoreData;

    this.getConcurrentEventsData();
    this.changeDetector.markForCheck();
  }

}
