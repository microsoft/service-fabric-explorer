import { Component, Input, OnChanges, ViewChildren, QueryList, AfterViewInit, Type } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase } from 'src/app/Models/eventstore/timelineGenerators';
import { IOnDateChange } from '../../time-picker/double-slider/double-slider.component';
import { DataService } from 'src/app/services/data.service';
import { ListColumnSettingWithEmbeddedVisTool, ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { RelatedEventsConfigs } from '../../../Models/eventstore/RelatedEventsConfigs';
import { ListColumnSettingWithCustomComponent } from 'src/app/Models/ListSettings';
import { VisualizationToolComponent } from '../../concurrent-events-visualization/visualization-tool/visualization-tool.component';
import { VisualizationLogoComponent } from '../../concurrent-events-visualization/visualization-logo/visualization-logo.component';
import { getSimultaneousEventsForEvent, IConcurrentEvents, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';
import { TimelineComponent } from '../timeline/timeline.component';
import { forkJoin } from 'rxjs';
import { VisualizationDirective } from '../visualization.directive';
import { VisualizationComponent } from '../visualizationComponents';
import { RcaVisualizationComponent } from '../rca-visualization/rca-visualization.component';

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
export class EventStoreComponent implements OnChanges, AfterViewInit {

  constructor(public dataService: DataService) { }

  @ViewChildren(VisualizationDirective) vizDirs: QueryList<VisualizationDirective>;
  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;

  public failedRefresh = false;
  public simulEvents: IConcurrentEvents[] = [];
  public activeTab: string;

  public startDate: Date;
  public endDate: Date;

  private visualizations: VisualizationComponent[] = [];
  private vizRefs: Type<any>[] = [TimelineComponent, RcaVisualizationComponent];
  
  ngAfterViewInit() {
    this.setVisualizations();
  }

  ngOnChanges(): void {
    this.update();
  }

  private setVisualizations(): void {
    this.vizDirs.forEach((dir, i) => {
      const componentRef = dir.viewContainerRef.createComponent<VisualizationComponent>(this.vizRefs[i]);
      const instance = componentRef.instance;
      
      instance.listEventStoreData = this.listEventStoreData;
      
      if (instance.startDate) {
        instance.startDate = this.startDate;
      }

      if (instance.endDate) {
        instance.endDate = this.endDate;
      }
      
      if (instance.selectEvent) {
        instance.selectEvent.subscribe((id) => this.setSearch(id));
      }

      this.visualizations.push(instance);
    })

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
    console.log(id);
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

    forkJoin(timelineEventSubs).subscribe((refreshList) => {
      this.failedRefresh = refreshList.some(e => !e);
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
  }

}
