import { Component, OnInit, Input } from '@angular/core';
import { ITimelineData, ITimelineDataGenerator, TimeLineGeneratorBase, parseEventsGenerically } from 'src/app/Models/eventstore/timelineGenerators';
import { EventListBase } from 'src/app/Models/DataModels/collections/Collections';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit {

    debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
    debouncerHandlerSubscription: Subscription;
  
  //TODO add a button that will set to current time

  @Input() eventsList: EventListBase<any>;
  @Input() timelineGenerator: TimeLineGeneratorBase<FabricEventBase>;

  constructor(public dataService: DataService) { }

  ngOnInit() {
    //   this.dataService.isAdvancedModeEnabled()
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

  public static MaxWindowInDays: number = 7;
  public startDateMin: Date;
  public endDateMin: Date;
  public startDateMax: Date;
  public endDateMax: Date;
  public endDateInit: Date;
  public isResetEnabled: boolean = false;
  public timeLineEventsData: ITimelineData;

  public transformText: string = "Category,Kind";

  private _showAllEvents: boolean = false;

  public startDate: Date;
  public endDate: Date;

  public get showAllEvents() { return this._showAllEvents; };
  public set showAllEvents(state: boolean) {
      this._showAllEvents = state;
      this.setTimelineData();
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
      this.startDateMax = this.endDateMax = new Date(); //Today
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

  private setTimelineData(): void {
    this.eventsList.ensureInitialized().subscribe( () => {
        try {
            if (this._showAllEvents) {
                const d = parseEventsGenerically(this.eventsList.collection.map(event => event.raw), this.transformText);

                this.timeLineEventsData = {
                    groups: d.groups,
                    items: d.items,
                    start: this.startDate,
                    end: this.endDate
                };

                console.log(this.timeLineEventsData)
            }else if (this.timelineGenerator) {
                const d = this.timelineGenerator.generateTimeLineData(this.eventsList.collection.map(event => event.raw), this.startDate, this.endDate);

                this.timeLineEventsData = {
                    groups: d.groups,
                    items: d.items,
                    start: this.startDate,
                    end: this.endDate
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
