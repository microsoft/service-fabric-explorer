// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IOnDateChange } from '../double-slider/double-slider.component';

export interface IQuickDates {
  display: string;
  hours: number;
}

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit, OnDestroy {

  @Input() dateMin: Date;
  @Input() dateMax: Date;

  @Input() startDate: Date;
  @Input() endDate: Date;

  @Output() dateChange = new EventEmitter<IOnDateChange>(); 
    
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

  ngOnInit(): void {
    this.setDefaultDateValues();

    this.debouncerHandlerSubscription = this.debounceHandler
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(dates => {
        this.startDate = new Date(dates.startDate);
        this.endDate = new Date(dates.endDate);
        this.dateChange.emit({endDate: this.endDate, startDate: this.startDate})
      });
  }

  ngOnDestroy() {
    this.debouncerHandlerSubscription.unsubscribe();
  }

  private setDefaultDateValues(): void {

    const todaysDate = new Date();
    
    if (!this.dateMin) {
      this.dateMin = TimeUtils.AddDays(todaysDate, -30);
    }
    
    if (!this.dateMax) {
      this.dateMax = todaysDate;
    }
    
    if (!this.endDate) {
      this.endDate = this.dateMax; 
    }
    
    if (!this.startDate) {
      this.startDate = TimeUtils.AddDays(this.dateMax, -7);
      if (this.startDate < this.dateMin) {
        this.startDate = new Date(this.dateMin);
      }
    }

    this.dateChange.emit({endDate: this.endDate, startDate: this.startDate})
  }

  public setDate(date: IQuickDates) {
    this.setNewDates({
      endDate: new Date(this.endDate),
      startDate: TimeUtils.AddHours(this.endDate, -1 * date.hours)
    });
  }

  setNewDates(dates: IOnDateChange) {
    this.debounceHandler.next(dates);
  }

}
