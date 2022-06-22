import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase, parseEventsGenerically, ITimelineDataGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, subscribeOn } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';
import { hostViewClassName } from '@angular/compiler';
import { DataGroup, DataItem, DataSet } from 'vis-timeline/standalone/esm';
import { DataModelCollectionBase } from 'src/app/Models/DataModels/collections/CollectionBase';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { RelatedEventsConfigs } from '../../../Models/eventstore/RelatedEventsConfigs';

export interface IQuickDates {
    display: string;
    hours: number;
}

export interface IPropertyMapping {
    sourceProperty: string;
    targetProperty: string;
}

export interface IRelevantEventsConfig {
    eventType: string;
    propertyMappings: IPropertyMapping[];
}

export interface IConcurrentEventsConfig {
    eventType: string; // the event type we are investigating
    relevantEventsType: IRelevantEventsConfig[]; // possible causes we are considering  
}

export interface IConcurrentEvents extends DataItem {
    related: IConcurrentEvents[] // possibly related events now this could be recursive, i.e a node is down but that node down concurrent event would have its own info on whether it was due to a restart or a cluster upgrade
}

export interface IEventStoreData<T extends DataModelCollectionBase<any>, S> {
    eventsList: T;
    timelineGenerator?: TimeLineGeneratorBase<S>;
    timelineData?: ITimelineData;
    displayName: string;
    listSettings?: ListSettings;
    getEvents?(): S[];
    setDateWindow?(startDate: Date, endDate: Date): boolean;
}

@Component({
    selector: 'app-event-store',
    templateUrl: './event-store.component.html',
    styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit, OnDestroy {

  constructor(public dataService: DataService, private telemService: TelemetryService) { }

  public get showAllEvents() { return this.pshowAllEvents; }
  public set showAllEvents(state: boolean) {
      this.pshowAllEvents = state;
      this.timeLineEventsData = this.getTimelineData();
  }

  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;

  public quickDates = [
      { display: 'Last 1 Hour', hours: 1 },
      { display: 'Last 3 Hours', hours: 3 },
      { display: 'Last 6 Hours', hours: 6 },
      { display: 'Last 1 Day', hours: 24 },
      { display: 'Last 7 Days', hours: 168 }
  ];

  @Input() listEventStoreData: IEventStoreData<any, any>[];
  @Input() optionsConfig: IOptionConfig;
  public startDateMin: Date;
  public startDateMax: Date;
  public failedRefresh = false;
  public timeLineEventsData: ITimelineData;

  public transformText = 'Category,Kind';

  private pshowAllEvents = false;
  public showCorrelatedBtn = false;

  public startDate: Date;
  public endDate: Date;

  public simulEvents: IConcurrentEvents[];

  ngOnInit() {
      this.pshowAllEvents = this.checkAllOption();
      this.showCorrelatedBtn = !this.pshowAllEvents;
      this.resetSelectionProperties();
      this.setTimelineData();
      this.debouncerHandlerSubscription = this.debounceHandler
          .pipe(debounceTime(400), distinctUntilChanged())
          .subscribe(dates => {
              this.startDate = new Date(dates.startDate);
              this.endDate = new Date(dates.endDate);
              this.setNewDateWindow();
          });
  }

  ngOnDestroy() {
      this.debouncerHandlerSubscription.unsubscribe();
  }

  public checkAllOption(): boolean {
      return this.listEventStoreData.some(data => !data.timelineGenerator);
  }

  private resetSelectionProperties(): void {
      const todaysDate = new Date();
      this.startDate = TimeUtils.AddDays(todaysDate, -7);
      this.endDate = this.startDateMax = todaysDate;
      this.startDateMin = TimeUtils.AddDays(todaysDate, -30);
  }

  public setDate(date: IQuickDates) {
      this.setNewDates({
          endDate: new Date(this.endDate),
          startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
      });
  }

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

  public mergeTimelineData(combinedData: ITimelineData, data: ITimelineData): void {
      data.items.forEach(item => combinedData.items.add(item));

      data.groups.forEach(group => combinedData.groups.add(group));

      combinedData.potentiallyMissingEvents =
          combinedData.potentiallyMissingEvents || data.potentiallyMissingEvents;
  }

  private initializeTimelineData(): ITimelineData {
      return {
          start: this.startDate,
          end: this.endDate,
          groups: new DataSet<DataGroup>(),
          items: new DataSet<DataItem>()
      };
  }

  private getTimelineData(): ITimelineData{
      let rawEventlist = [];
      let combinedTimelineData = this.initializeTimelineData();
      this.failedRefresh = false;
      const addNestedGroups = this.listEventStoreData.length > 1;

      // only emit metrics when more than 1 event type is added
      if (this.listEventStoreData.length > 1) {
        const names = this.listEventStoreData.map(item => item.displayName).sort();
        this.telemService.trackActionEvent(TelemetryEventNames.CombinedEventStore, {value: names.toString()}, names.toString());
      }
      for (const data of this.listEventStoreData) {
          if (data.eventsList.lastRefreshWasSuccessful){
              try {
                  if (this.pshowAllEvents) {
                      if (data.setDateWindow){
                          rawEventlist = rawEventlist.concat(data.getEvents());
                      }

                  } else if (data.timelineGenerator) {
                      // If we have more than one element in the timeline the events get grouped by the displayName of the element.
                      data.timelineData = data.timelineGenerator.generateTimeLineData(data.getEvents(), this.startDate, this.endDate, addNestedGroups ? data.displayName : null);

                      this.mergeTimelineData(combinedTimelineData, data.timelineData);
                  }
              } catch (e) {
                  console.error(e);
              }
          }
          else {
              this.failedRefresh = true;
          }
      }

      if (this.pshowAllEvents) {
          const d = parseEventsGenerically(rawEventlist, this.transformText);

          combinedTimelineData = {
              start: this.startDate,
              end: this.endDate,
              items: d.items,
              groups: d.groups
          };
      }

      return combinedTimelineData;
  }

  private testEvent(parsedEvents : DataItem[]) : void {
    /*
        Section here is to test a random IConcurrentEventsConfig with three inputted random events and see
        which events happen concurrently with these random events.
    */

    let inputEvents : DataItem[] = [];
    parsedEvents.forEach(event => {
        if (event.kind == "NodeDown" && event.eventInstanceId == "0209c2ec-e9f8-425d-a332-7b4e65097134") {
            inputEvents.push(event);
        }
    });    

    this.simulEvents = this.listEventStoreData[0].timelineGenerator.getSimultaneousEventsForEvent(RelatedEventsConfigs, inputEvents, parsedEvents);
  }

  private getConcurrentEventsData(): DataSet<DataItem> {
    /*
        Grabs all the concurrent events data based on specific IConcurrentEventsConfig objects.
    */
    let parsedEvents : DataItem[] = [];
    for (const data of this.listEventStoreData) {
        if (data.eventsList.lastRefreshWasSuccessful) {
            if (data.timelineGenerator) {
                data.getEvents().forEach(event => parsedEvents.push(event));
            }
        }
    }

    // testing purposes    
    this.testEvent(parsedEvents);
  }

  public setTimelineData(): void {
      const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());            
      forkJoin(timelineEventSubs).subscribe(() => {
          this.timeLineEventsData = this.getTimelineData();
      });

      forkJoin(timelineEventSubs).subscribe(() => {
          let concurrentEvents = this.getConcurrentEventsData();
          console.log(concurrentEvents);
      })
  }

  processData(option: IOptionData){
    if (option.addToList){
      this.listEventStoreData.push(option.data);
    }
    else{
      this.listEventStoreData = this.listEventStoreData.filter(item => item.displayName !== option.data.displayName);
    }
    this.setNewDateWindow(true);
  }

  setNewDates(dates: IOnDateChange) {
      this.debounceHandler.next(dates);
  }
}
