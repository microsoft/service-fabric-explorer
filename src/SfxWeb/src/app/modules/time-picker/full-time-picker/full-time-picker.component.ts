import { Component, OnInit, Input, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';

export interface IQuickDates {
  display: string;
  hours: number;
}

@Component({
  selector: 'app-full-time-picker',
  templateUrl: './full-time-picker.component.html',
  styleUrls: ['./full-time-picker.component.scss']
})
export class FullTimePickerComponent implements OnInit, OnDestroy {

  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() startDateMin: Date;
  @Input() startDateMax: Date;

  @Output() datesChanged = new EventEmitter<IOnDateChange>();

  public quickDates = [
    { display: 'Last 1 Hour', hours: 1 },
    { display: 'Last 3 Hours', hours: 3 },
    { display: 'Last 6 Hours', hours: 6 },
    { display: 'Last 1 Day', hours: 24 },
    { display: 'Last 7 Days', hours: 168 }
  ];

  private debounceHandler: Subject<IOnDateChange> = new Subject<IOnDateChange>();
  private debouncerHandlerSubscription: Subscription;

  constructor() { }

  setNewDates(dates: IOnDateChange) {
    this.debounceHandler.next(dates);
  }

  public setDate(date: IQuickDates) {
    this.setNewDates({
      endDate: new Date(this.endDate),
      startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
    });
  }

  ngOnInit(): void {
    this.debouncerHandlerSubscription = this.debounceHandler
    .pipe(debounceTime(400), distinctUntilChanged())
    .subscribe(dates => {
      this.startDate = new Date(dates.startDate);
      this.endDate = new Date(dates.endDate);
      this.datesChanged.emit(dates);
    });
  }

  ngOnDestroy() {
    this.debouncerHandlerSubscription.unsubscribe();
  }

}
