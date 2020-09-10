import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ITimelineData, TimeLineGeneratorBase, parseEventsGenerically } from 'src/app/Models/eventstore/timelineGenerators';
import { EventListBase } from 'src/app/Models/DataModels/collections/Collections';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';

export interface IQuickDates {
    display: string;
    hours: number;
}
@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit, OnDestroy {

  constructor(public dataService: DataService) { }

  public get showAllEvents() { return this._showAllEvents; }
  public set showAllEvents(state: boolean) {
      this._showAllEvents = state;
      this.setTimelineData();
  }

  public static MaxWindowInDays = 7;

  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;

  public quickDates = [
    { display: '1 hours', hours: 1},
    { display: '3 hours', hours: 3},
    { display: '6 hours', hours: 6},
    { display: '1 day', hours: 24},
    { display: '7 days', hours: 168 }
  ];

  @Input() eventsList: EventListBase<any>;
  @Input() timelineGenerator: TimeLineGeneratorBase<FabricEventBase>;
  public startDateMin: Date;
  public endDateMin: Date;
  public startDateMax: Date;
  public endDateMax: Date;
  public endDateInit: Date;
  public isResetEnabled = false;
  public timeLineEventsData: ITimelineData;

  public transformText = 'Category,Kind';

  private _showAllEvents = false;

  public startDate: Date;
  public endDate: Date;

  ngOnInit() {
    this._showAllEvents = !this.timelineGenerator;
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

  public reset(): void {
      this.isResetEnabled = false;
      if (this.eventsList.resetDateWindow()) {
          this.resetSelectionProperties();
          this.eventsList.reload().subscribe( data => {
              this.setTimelineData();
          });
      } else {
          this.resetSelectionProperties();
      }
  }

  private resetSelectionProperties(): void {
      this.startDate = this.eventsList.startDate;
      this.endDate = this.eventsList.endDate;
      this.startDateMin = this.endDateMin = TimeUtils.AddDays(new Date(), -30);
      this.startDateMax = this.endDateMax = new Date(); // Today
  }

  public setDate(date: IQuickDates) {
      this.setNewDates({
        endDate: new Date(this.eventsList.endDate),
        startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
      });
  }

  private setNewDateWindow(): void {
      if (this.eventsList.setDateWindow(this.startDate, this.endDate)) {
          this.resetSelectionProperties();
          this.isResetEnabled = true;
          this.eventsList.reload().subscribe( data => {
              this.setTimelineData();
          });
      } else {
          this.resetSelectionProperties();
      }
  }

  public setTimelineData(): void {
    this.eventsList.ensureInitialized().subscribe( () => {
        try {
            if (this._showAllEvents) {
                const d = parseEventsGenerically(this.eventsList.collection.map(event => event.raw), this.transformText);

                this.timeLineEventsData = {
                    groups: d.groups,
                    items: d.items,
                    start: this.startDate,
                    end: this.endDate,
                    potentiallyMissingEvents: d.potentiallyMissingEvents
                };

            }else if (this.timelineGenerator) {
                const d = this.timelineGenerator.generateTimeLineData(this.eventsList.collection.map(event => event.raw), this.startDate, this.endDate);

                this.timeLineEventsData = {
                    groups: d.groups,
                    items: d.items,
                    start: this.startDate,
                    end: this.endDate,
                    potentiallyMissingEvents: d.potentiallyMissingEvents
                };
            }
        }catch (e) {
            console.error(e);
        }
    });
    }

    setNewDates(dates: IOnDateChange) {
        this.debounceHandler.next(dates);
    }
}
