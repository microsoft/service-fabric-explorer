import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase, parseEventsGenerically } from 'src/app/Models/eventstore/timelineGenerators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';
import { DataGroup, DataItem, DataSet } from 'vis-timeline/standalone/esm';
import { DataModelCollectionBase } from 'src/app/Models/DataModels/collections/CollectionBase';
import { ListSettings } from 'src/app/Models/ListSettings';
import { IOptionConfig, IOptionData } from '../option-picker/option-picker.component';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { TelemetryEventNames } from 'src/app/Common/Constants';
import { RelatedEventsConfigs } from '../../../Models/eventstore/RelatedEventsConfigs';
import { Utils } from 'src/app/Utils/Utils';

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
    action? : string; //mainly being used for self referential purposes
}

export interface IConcurrentEventsConfig {
    eventType: string; // the event type we are investigating
    relevantEventsType: IRelevantEventsConfig[]; // possible causes we are considering
    result: string; //resulting property we want to display for events (ex. Repair Jobs action)
}

export interface IConcurrentEvents extends DataItem {
    related: IConcurrentEvents[] // possibly related events now this could be recursive, i.e a node is down but that node down concurrent event would have its own info on whether it was due to a restart or a cluster upgrade
}

export interface IRCAItem extends DataItem, IConcurrentEvents {
    kind: string;
    eventInstanceId: string;
    reasonForEvent: string;    
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

  private testEvent(parsedEvents : IRCAItem[]) : void {
    /*
        Section here is to test a random IConcurrentEventsConfig with three inputted random events and see
        which events happen concurrently with these random events.
    */
    let eventInstanceId = (document.getElementById("eventId") as HTMLInputElement).value;
    let inputEvents : IRCAItem[] = [];
    parsedEvents.forEach(event => {
        if (event.eventInstanceId == eventInstanceId) {
            inputEvents.push(event);
        }
    });    

    this.simulEvents = this.getSimultaneousEventsForEvent(RelatedEventsConfigs, inputEvents, parsedEvents);
  }

  private getSimultaneousEventsForEvent(configs: IConcurrentEventsConfig[], inputEvents: IRCAItem[], events: IRCAItem[]) : IConcurrentEvents[] {
        /*
            Grab the events that occur concurrently with an inputted current event.
        */

        let simulEvents : IConcurrentEvents[] = [];
        let addedEvents : DataItem[] = [];
        let action = "";

        // iterate through all the input events
        inputEvents.forEach(inputEvent => {
            // iterate through all configuration
            configs.forEach(config => {
                if (config.eventType == inputEvent.kind) {                                        
                    // iterate through all events to find relevant ones
                    if(Utils.result(inputEvent, config.result)) {
                        action = "Action: " + Utils.result(inputEvent, config.result) + "<br/><br/>";
                    }
                    inputEvent.reasonForEvent = action; 
                    config.relevantEventsType.forEach(relevantEventType => {
                        if(relevantEventType.eventType == "self") {
                            let propMaps = true;
                            let mappings = relevantEventType.propertyMappings;
                            mappings.forEach(mapping => {     
                                let sourceVal: any;
                                let targetVal: any;   
                                sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
                                targetVal = mapping.targetProperty;
                                if (sourceVal != null && sourceVal != undefined && targetVal != null && targetVal != undefined && sourceVal != targetVal) {
                                    propMaps = false;
                                }
                            });
                            if (propMaps) {
                                action = "Action: " + relevantEventType.action + "<br/><br/>";
                                inputEvent.reasonForEvent = action;
                            }
                        }
                        events.forEach(iterEvent => {
                            if (relevantEventType.eventType == iterEvent.kind) {
                                // see if each property mapping holds true
                                let propMaps = true;
                                let mappings = relevantEventType.propertyMappings;
                                mappings.forEach(mapping => {     
                                    let sourceVal: any;
                                    let targetVal: any;   
                                    if(mapping.sourceProperty == "raw.BatchId") {
                                        sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
                                        sourceVal = sourceVal.substring(sourceVal.indexOf("/") + 1);
                                    } else {
                                        sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
                                    }                           
                                    targetVal = Utils.result(iterEvent, mapping.targetProperty);
                                    if (sourceVal != null && sourceVal != undefined && targetVal != null && targetVal != undefined && sourceVal != targetVal) {
                                        propMaps = false;
                                    }
                                });
                                
                                if (propMaps) {
                                    if (!inputEvent.related) {
                                        inputEvent.related = [];
                                    }
                                    inputEvent.related.push(iterEvent);
                                    addedEvents.push(iterEvent);
                                }
                            }
                        });                        
                    });
                }
            });
            simulEvents.push(inputEvent);
        });

        if (addedEvents.length > 0) this.getSimultaneousEventsForEvent(configs, addedEvents, events);
        return simulEvents;
    }

  private getConcurrentEventsData(): DataSet<DataItem> {
    /*
        Grabs all the concurrent events data based on specific IConcurrentEventsConfig objects.
    */
    let parsedEvents : DataItem[] = [];
    for (const data of this.listEventStoreData) {
        if (data.eventsList.lastRefreshWasSuccessful) {
            data.getEvents().forEach(event => parsedEvents.push(event));            
        }
    }

    // testing purposes    
    this.testEvent(parsedEvents);
  }

  public findConcurrentEvents(): void {
    const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());
    forkJoin(timelineEventSubs).subscribe(() => {
        this.getConcurrentEventsData();
    });
  }

  public setTimelineData(): void {
      const timelineEventSubs = this.listEventStoreData.map(data => data.eventsList.refresh());            
      forkJoin(timelineEventSubs).subscribe(() => {
          this.timeLineEventsData = this.getTimelineData();
      });
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
