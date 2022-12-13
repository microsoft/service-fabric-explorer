import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase, parseEventsGenerically, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone/esm';
import { ListColumnSetting, ListColumnSettingWithEmbeddedVisTool, ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { RelatedEventsConfigs } from '../../../Models/eventstore/RelatedEventsConfigs';
import { Utils } from 'src/app/Utils/Utils';
import { ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { VisualizationToolComponent } from '../../concurrent-events-visualization/visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from '../../concurrent-events-visualization/visualization-logo/visualization-logo.component';
import { getSimultaneousEventsForEvent, IConcurrentEvents, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';
export interface IEventStoreData<IVisPresentEvent, S> {
  eventsList: IVisPresentEvent;
  timelineGenerator?: TimeLineGeneratorBase<S>;
  timelineData?: ITimelineData;
  displayName: string;
  listSettings?: ListSettings;
  getEvents?(): S[];
  setDateWindow?(startDate: Date, endDate: Date): boolean;
  timelineResolver?(id: string): boolean; //used to determine if the data contains a given event;
}

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit, OnChanges {

  constructor(public dataService: DataService, private telemService: TelemetryService) { }

  // public get showAllEvents() { return this.pshowAllEvents; }
  // public set showAllEvents(state: boolean) {
  //   this.pshowAllEvents = state;
  //   this.timeLineEventsData = this.getTimelineData();
  // }


  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;

  public failedRefresh = false;
  // public timeLineEventsData: ITimelineData;

  // public transformText = 'Category,Kind';

  // private pshowAllEvents = false;
  // public showCorrelatedBtn = false;

  public simulEvents: IConcurrentEvents[] = [];
  public activeTab: string;

  private startDate: Date;
  private endDate: Date;

  ngOnInit() {
    // this.pshowAllEvents = this.checkAllOption();
    // this.showCorrelatedBtn = !this.pshowAllEvents;
    // this.setTimelineData();
    
  }

  ngOnChanges(): void {
    this.setTimelineData();
  }

  /* date determines the data */
  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    this.setTimelineData();
  }
  
  /* initiated from timeline, but affect the list*/
  public setSearch(search?: string) {
    if (search) {
      const item = this.timeLineEventsData.items.get(search);
      const id = (item.id as string).split('---')[1];
      this.listEventStoreData.forEach((list, i) => {
        if (list.timelineResolver(id)) {
          this.activeTab = list.displayName
          setTimeout(() =>
            list.listSettings.search = id, 1)
        }
      })
    }
  }

  /* linked to correlated/all button */
  // public checkAllOption(): boolean {
  //   return this.listEventStoreData.some(data => !data.timelineGenerator);
  // }

  /* work w/ processData to check if update needed */
  private setNewDateWindow(forceRefresh: boolean = false): void {
    // If the data interface has that function implemented, we call it. If it doesn't we discard it by returning false.
    let refreshData = false;

    this.listEventStoreData.forEach(data => {
      if (data.setDateWindow) {
        if (data.setDateWindow(this.startDate, this.endDate)) {
          refreshData = true;
        }
      }
    });

    if (refreshData || forceRefresh) {
      this.setTimelineData();
    }
  }

  // public mergeTimelineData(combinedData: ITimelineData, data: ITimelineData): void {
  //   data.items.forEach(item => combinedData.items.add(item));

  //   data.groups.forEach(group => combinedData.groups.add(group));

  //   combinedData.potentiallyMissingEvents =
  //     combinedData.potentiallyMissingEvents || data.potentiallyMissingEvents;
  // }

  // private initializeTimelineData(): ITimelineData {
  //   return {
  //     start: this.startDate,
  //     end: this.endDate,
  //     groups: new DataSet<DataGroup>(),
  //     items: new DataSet<ITimelineItem>()
  //   };
  // }

  // private getTimelineData(): ITimelineData {
  //   let rawEventlist = [];
  //   let combinedTimelineData = this.initializeTimelineData();
  //   this.failedRefresh = false;
  //   const addNestedGroups = this.listEventStoreData.length > 1;

  //   // only emit metrics when more than 1 event type is added
  //   if (this.listEventStoreData.length > 1) {
  //     const names = this.listEventStoreData.map(item => item.displayName).sort();
  //     this.telemService.trackActionEvent(TelemetryEventNames.CombinedEventStore, { value: names.toString() }, names.toString());
  //   }
  //   for (const data of this.listEventStoreData) {
  //     if (data.eventsList.lastRefreshWasSuccessful) {
  //       try {
  //         if (this.pshowAllEvents) {
  //           if (data.setDateWindow) {
  //             rawEventlist = rawEventlist.concat(data.getEvents());
  //           }

  //         } else if (data.timelineGenerator) {
  //           // If we have more than one element in the timeline the events get grouped by the displayName of the element.
  //           data.timelineData = data.timelineGenerator.generateTimeLineData(data.getEvents(), this.startDate, this.endDate, addNestedGroups ? data.displayName : null);

  //           this.mergeTimelineData(combinedTimelineData, data.timelineData);
  //         }
  //       } catch (e) {
  //         console.error(e);
  //       }
  //     }
  //     else {
  //       this.failedRefresh = true;
  //     }
  //   }

  //   if (this.pshowAllEvents) {
  //     const d = parseEventsGenerically(rawEventlist, this.transformText);

  //     combinedTimelineData = {
  //       start: this.startDate,
  //       end: this.endDate,
  //       items: d.items,
  //       groups: d.groups
  //     };
  //   }

  //   return combinedTimelineData;
  // }


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
          this,
          {
            enableFilter: false,
            colspan: 3
          }
        ));
      }
    }
  }

  /* potential new starting point for calling updates on all visualizations*/
  // public setTimelineData(): void {
  //   const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
  //   forkJoin(timelineEventSubs).subscribe(() => {
  //     this.timeLineEventsData = this.getTimelineData();
  //     this.getConcurrentEventsData();
  //   });
  // }

  /* filter event types; then update everything */
  processData(option: IOptionData) {
    if (option.addToList) {
      this.listEventStoreData.push(option.data);
    }
    else {
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
    this.getConcurrentEventsData();
  }

}
