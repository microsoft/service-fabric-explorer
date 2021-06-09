import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase, parseEventsGenerically } from 'src/app/Models/eventstore/timelineGenerators';
import { EventListBase } from 'src/app/Models/DataModels/collections/Collections';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';
import { hostViewClassName } from '@angular/compiler';
import { DataGroup, DataItem, DataSet } from 'vis-timeline/standalone/esm';

export interface IQuickDates {
    display: string;
    hours: number;
}

export interface IEventStoreData {
    eventsList: EventListBase<any>;
    timelineGenerator?: TimeLineGeneratorBase<FabricEventBase>;
    timelineData?: ITimelineData;
    displayName: string;
}

@Component({
    selector: 'app-event-store',
    templateUrl: './event-store.component.html',
    styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit, OnDestroy {

  constructor(public dataService: DataService) { }

  public get showAllEvents() { return this.pshowAllEvents; }
  public set showAllEvents(state: boolean) {
      this.pshowAllEvents = state;
      this.setTimelineData();
  }

  public static MaxWindowInDays = 7;

  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;

  public quickDates = [
      { display: '1 hours', hours: 1 },
      { display: '3 hours', hours: 3 },
      { display: '6 hours', hours: 6 },
      { display: '1 day', hours: 24 },
      { display: '7 days', hours: 168 }
  ];

  @Input() listEventStoreData: IEventStoreData[];
  public startDateMin: Date;
  public endDateMin: Date;
  public startDateMax: Date;
  public endDateMax: Date;
  public endDateInit: Date;
  public isResetEnabled = false;
  public timeLineEventsData: ITimelineData;

  public transformText = 'Category,Kind';

  private pshowAllEvents = false;
  public showCorrelatedBtn = false;

  public startDate: Date;
  public endDate: Date;

  ngOnInit() {
      this.pshowAllEvents = this.checkAllOption();
      this.showCorrelatedBtn = !this.pshowAllEvents;
      this.resetSelectionProperties();
      this.setTimelineData();
      this.debouncerHandlerSubscription = this.debounceHandler
          .pipe(debounceTime(400), distinctUntilChanged())
          .subscribe(dates => {
              this.startDate = dates.startDate;
              this.endDate = dates.endDate;
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
      this.startDate = this.listEventStoreData[0].eventsList.startDate;
      this.endDate = this.listEventStoreData[0].eventsList.endDate;
      this.startDateMin = this.endDateMin = TimeUtils.AddDays(new Date(), -30);
      this.startDateMax = this.endDateMax = new Date(); // Today
  }

  public setDate(date: IQuickDates) {
      this.setNewDates({
          endDate: new Date(this.listEventStoreData[0].eventsList.endDate),
          startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
      });
  }

  private setNewDateWindow(): void {
      const subs = this.listEventStoreData.filter(data => data.eventsList.setDateWindow(this.startDate, this.endDate))
      .map((data) => {
          this.resetSelectionProperties();
          this.isResetEnabled = true;
          return data.eventsList.reload();
      });

      if (subs.length > 0) {
          forkJoin(subs).subscribe(() => this.setTimelineData());
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

  public setTimelineData(): void {
      let rawEventlist = [];
      const combinedTimelineData = this.initializeTimelineData();

      const subs = this.listEventStoreData.map(data => data.eventsList.ensureInitialized());

      forkJoin(subs).subscribe(() => {
          for (const data of this.listEventStoreData) {
              try {
                  if (this.pshowAllEvents) {
                      rawEventlist = rawEventlist.concat(data.eventsList.collection.map(event => event.raw));

                  } else if (data.timelineGenerator) {
                      data.timelineData = data.timelineGenerator.generateTimeLineData(data.eventsList.collection.map(event => event.raw), this.startDate, this.endDate);

                      this.mergeTimelineData(combinedTimelineData, data.timelineData);
                  }
              } catch (e) {
                  console.error(e);
              }
          }

          if (this.pshowAllEvents) {
              const d = parseEventsGenerically(rawEventlist, this.transformText);

              this.timeLineEventsData = {
                  start: this.startDate,
                  end: this.endDate,
                  items: d.items,
                  groups: d.groups
              };
          }
          else {
              this.timeLineEventsData = combinedTimelineData;
          }
      });
  }

  setNewDates(dates: IOnDateChange) {
      this.debounceHandler.next(dates);
  }
}
