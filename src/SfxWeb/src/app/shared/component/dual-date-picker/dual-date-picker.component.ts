import { Component, OnInit, Input, OnChanges, SimpleChanges, SimpleChange, Output, EventEmitter } from '@angular/core';
import { NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dual-date-picker',
  templateUrl: './dual-date-picker.component.html',
  styleUrls: ['./dual-date-picker.component.scss']
})
export class DualDatePickerComponent implements OnInit, OnChanges {

  @Input() minDate: Date;
  @Input() maxDate: Date;

  @Input() currentStartDate: Date;
  @Input() currentEndDate: Date;

  @Output() dateChanged = new EventEmitter<{endDate: Date, startDate: Date}>();

  private internalMinDate: NgbDateStruct;
  private internalMaxDate: NgbDateStruct;

  hoveredDate: NgbDate;

  fromDate: NgbDate;
  toDate: NgbDate;
  currentStartTime: string;
  currentEndTime: string;

  constructor(public calendar: NgbCalendar, public formatter: NgbDateParserFormatter) {

  }

  ngOnChanges(simple: SimpleChanges) {
    this.toDate = this.dateToNgbDate(this.currentEndDate);
    this.fromDate = this.dateToNgbDate(this.currentStartDate);
    this.currentStartTime = this.currentStartDate.toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", hour12: false });
    this.currentEndTime = this.currentEndDate.toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", hour12: false });
  }

  ngOnInit(){
    this.internalMaxDate = this.dateToNgbDate(this.maxDate);
    this.internalMinDate = this.dateToNgbDate(this.minDate);
  }

  dateToNgbDate(date: Date): NgbDate {
    return NgbDate.from({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    });
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && !date.before(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
    if (this.fromDate && this.toDate){
      this.emitState();
    }
  }

  onTimeSelection(date: string, isStartTime: boolean) {
    const timeToBeUpdated = isStartTime ? this.currentStartDate : this.currentEndDate; let newTime = date.split(":"); 
    let hour = parseInt(newTime[0]); let minute = parseInt(newTime[1]); timeToBeUpdated.setHours(hour); timeToBeUpdated .setMinutes(minute);
    this.emitState();
  }

  emitState() {
    this.currentStartDate.setFullYear(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day);
    this.currentEndDate.setFullYear(this.toDate.year, this.toDate.month - 1, this.toDate.day);
    this.dateChanged.emit({
      endDate: this.currentEndDate,
      startDate: this.currentStartDate
    });
  }

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }

  isInside(date: NgbDate) {
    return date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || date.equals(this.toDate) || this.isInside(date) || this.isHovered(date);
  }

  validateInput(currentValue: NgbDate, input: string): NgbDate {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  isDisabled = (date: NgbDate, current: {month: number}) => {
    return date.before(this.internalMinDate) || date.after(this.internalMaxDate);
  }
}
