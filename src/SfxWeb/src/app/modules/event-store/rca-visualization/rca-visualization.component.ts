import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { IRCAItem, getSimultaneousEventsForEvent, IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
import { ListColumnSettingWithCustomComponent, ListColumnSettingWithEmbeddedVisTool } from 'src/app/Models/ListSettings';
import { VisualizationLogoComponent } from '../../concurrent-events-visualization/visualization-logo/visualization-logo.component';
import { VisualizationToolComponent } from '../../concurrent-events-visualization/visualization-tool/visualization-tool.component';
import { IEventStoreData } from '../event-store/event-store.component';
import { VisualizationComponent } from '../visualizationComponents';

@Component({
  selector: 'app-rca-visualization',
  templateUrl: './rca-visualization.component.html',
  styleUrls: ['./rca-visualization.component.scss']
})
export class RcaVisualizationComponent implements VisualizationComponent {

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  public simulEvents: IConcurrentEvents[] = [];

  constructor(public changeDetector: ChangeDetectorRef) { }

  private getConcurrentEventsData() {
    let allEvents: IRCAItem[] = [];
    let sourceEvents = [];
    for (const data of this.listEventStoreData) {
      if (data.eventsList.lastRefreshWasSuccessful) {
        sourceEvents = sourceEvents.concat(data.getEvents());
        allEvents = allEvents.concat(data.eventsList.collection);
      }
    }

    // refresh vis-event-list
    this.simulEvents = getSimultaneousEventsForEvent(RelatedEventsConfigs, sourceEvents, sourceEvents);
    // grab highcharts data for all events
    for (let parsedEvent of allEvents) {
        let rootEvent = this.simulEvents.find(event => event.eventInstanceId === parsedEvent.eventInstanceId);
        let visPresent = false;
        if (rootEvent.reason) {
            visPresent = true;
        }

        (parsedEvent as any).visPresent = visPresent;

    }

    for (const data of this.listEventStoreData) {
      //add presentation column if not already there
      if (!data.listSettings.columnSettings.some(setting => setting.propertyPath == "visPresent")) {
        let newLogoSetting = new ListColumnSettingWithCustomComponent(
          VisualizationLogoComponent,
          'visPresent',
          'Visualization',
          {
            enableFilter: true,
            colspan: 1
          });
        newLogoSetting.fixedWidthPx = 100;
        data.listSettings.columnSettings.splice(1, 0, newLogoSetting);
        data.listSettings.secondRowColumnSettings.push(new ListColumnSettingWithEmbeddedVisTool(
          VisualizationToolComponent,
          '',
          '',
          this.simulEvents,
          {
            enableFilter: false,
            colspan: 3
          }
        ));
      }
    }
  }

  public update() {
    this.getConcurrentEventsData();
    this.changeDetector.markForCheck();
  }

}
