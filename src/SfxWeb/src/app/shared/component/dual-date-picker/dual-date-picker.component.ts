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

  @Output() onDateChange = new EventEmitter<{endDate: Date, startDate: Date}>();

  _minDate: NgbDateStruct;
  _maxDate: NgbDateStruct;

  hoveredDate: NgbDate;

  fromDate: NgbDate;
  toDate: NgbDate;

  constructor(public calendar: NgbCalendar, public formatter: NgbDateParserFormatter) {

  }

  ngOnChanges(simple: SimpleChanges) {
    this.toDate = this.dateToNgbDate(this.currentEndDate);
    this.fromDate = this.dateToNgbDate(this.currentStartDate);
  }

  ngOnInit(){
    this._maxDate = this.dateToNgbDate(this.maxDate);
    this._minDate = this.dateToNgbDate(this.minDate);
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
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }

    if (this.fromDate && this.toDate){
      this.currentStartDate.setFullYear(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day);
      this.currentEndDate.setFullYear(this.toDate.year, this.toDate.month - 1, this.toDate.day);
      this.onDateChange.emit({
        endDate: this.currentEndDate,
        startDate: this.currentStartDate
      });
    }
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
    return date.before(this._minDate) || date.after(this._maxDate);
  }
}
