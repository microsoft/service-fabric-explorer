import { Component, OnInit, Input, OnDestroy, OnChanges, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
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
import { Visualization } from '../visualization';
import { TimelineComponent } from '../timeline/timeline.component';
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
export class EventStoreComponent implements  OnChanges, AfterViewInit {

  constructor(public dataService: DataService) { }

  @ViewChildren(TimelineComponent) visualizations: QueryList<Visualization>;
  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;

  public failedRefresh = false;
  public simulEvents: IConcurrentEvents[] = [];
  public activeTab: string;

  public startDate: Date;
  public endDate: Date;

  ngAfterViewInit() {
    this.update();
  }

  ngOnChanges(): void {
    this.update();
  }

  /* date determines the data */
  public setDate(newDate: IOnDateChange) {
    this.endDate = newDate.endDate;
    this.startDate = newDate.startDate;
    this.setNewDateWindow(true);
  }
  
  /* initiated from timeline, but affect the list*/
  public setSearch(id: string) {
    this.listEventStoreData.forEach((list, i) => {
      if (list.timelineResolver(id)) {
        this.activeTab = list.displayName
        setTimeout(() =>
          list.listSettings.search = id, 1)
      }
    })
  }

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
      this.update();
    }
  }

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
  public update(): void {
    const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
    forkJoin(timelineEventSubs).subscribe(() => {
      // this.timeLineEventsData = this.getTimelineData();
      this.visualizations.forEach(e => e.update())
      this.getConcurrentEventsData();
    });
  }

  /* filter event types; then update everything */
  processData(option: IOptionData) {
    if (option.addToList) {
      this.listEventStoreData.push(option.data);
    }
    else {
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
    // this.getConcurrentEventsData();
  }

}
