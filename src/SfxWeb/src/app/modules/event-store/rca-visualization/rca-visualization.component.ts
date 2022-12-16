import { Component, Input } from '@angular/core';
import { IRCAItem, getSimultaneousEventsForEvent, IConcurrentEvents } from 'src/app/Models/eventstore/rcaEngine';
import { RelatedEventsConfigs } from 'src/app/Models/eventstore/RelatedEventsConfigs';
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
  }

  public update() {
    this.getConcurrentEventsData();
  }

}
