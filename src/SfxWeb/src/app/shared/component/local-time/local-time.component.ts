import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { interval } from 'rxjs';

@Component({
  selector: 'app-local-time',
  templateUrl: './local-time.component.html',
  styleUrls: ['./local-time.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocalTimeComponent implements OnInit {

  localTime: string;
  utcTime: string;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    interval(1000).subscribe(() => this.setTime());
  }

  setTime() {
    const currentDate = new Date();
    this.localTime = currentDate.toLocaleString();
    this.utcTime = currentDate.toISOString();
    console.log("test")
    this.cdr.detectChanges();
  }
}
