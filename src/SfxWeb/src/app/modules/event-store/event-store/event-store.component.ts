import { Component, OnInit, Input } from '@angular/core';
import { ITimelineData, ITimelineDataGenerator } from 'src/app/Models/eventstore/timelineGenerators';
import { EventListBase } from 'src/app/Models/DataModels/collections/Collections';
import { FabricEventBase } from 'src/app/Models/eventstore/Events';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-event-store',
  templateUrl: './event-store.component.html',
  styleUrls: ['./event-store.component.scss']
})
export class EventStoreComponent implements OnInit {

  //TODO add a button that will set to current time

  @Input() eventsList: EventListBase<any>;
  @Input() timelineGenerator: ITimelineDataGenerator<FabricEventBase>;

  constructor() { }

  ngOnInit() {
    this.resetSelectionProperties();
    this.setTimelineData();
  }
  public static MaxWindowInDays: number = 7;
  public startDateMin: Date;
  public endDateMin: Date;
  public startDateMax: Date;
  public endDateMax: Date;
  public startDateInit: Date;
  public endDateInit: Date;
  public isResetEnabled: boolean = false;
  public timeLineEventsData: ITimelineData;
  private isStartSelected: boolean;
  private isEndSelected: boolean;
  private _startDate: Date = null;
  private _endDate: Date = null;

  public get startDate() { return this._startDate; }
  public get endDate() { return this._endDate; }
  public set startDate(value: Date) {
      this._startDate = value;
      if (!this.isEndSelected) {
          this.endDateMin = this._startDate;
          this.endDateMax = TimeUtils.AddDays(
              this._startDate,
              DateWindowSelector.MaxWindowInDays);
          if (this.endDateMax > new Date()) {
              this.endDateMax = new Date();
          }
          this.endDateInit = this._startDate;
          this.isStartSelected = true;
      }
          this.setNewDateWindow();
  }
  public set endDate(value: Date) {
      this._endDate = value;
      if (!this.isStartSelected) {
          this.startDateMax = this._endDate;
          this.startDateMin = TimeUtils.AddDays(
              this._endDate,
              (-7 * DateWindowSelector.MaxWindowInDays));
          this.startDateInit = this._endDate;
          this.isEndSelected = true;
      }
          this.setNewDateWindow();
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
      this._startDate = this.eventsList.startDate;
      this._endDate = this.eventsList.endDate;
      this.startDateMin = this.endDateMin = TimeUtils.AddDays(new Date(), -30);
      this.startDateMax = this.endDateMax = new Date(); //Today
      this.startDateInit = this.endDateInit = new Date(); //Today
      this.isStartSelected = this.isEndSelected = false;
  }

  private setNewDateWindow(): void {
      if (this.eventsList.setDateWindow(this._startDate, this._endDate)) {
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
      if (this.timelineGenerator) {
          this.eventsList.ensureInitialized().subscribe( () => {
              try {
                  const d = this.timelineGenerator.consume(this.eventsList.collection.map(event => event.raw), this.startDate, this.endDate);
                  this.timeLineEventsData = {
                      groups: d.groups,
                      items: d.items,
                      start: this.startDate,
                      end: this.endDate
                  };
              }catch (e) {
                  console.error(e);
              }
          });
      }
  }
}
