import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-display-time',
  templateUrl: './display-time.component.html',
  styleUrls: ['./display-time.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayTimeComponent implements OnInit, OnChanges, OnDestroy {

  @Input() time: string;

  localTime = "";
  timeSince = "";

  private sub: Subscription = new Subscription();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.sub.add(interval(1000).subscribe(() => this.setTime()));
  }

  ngOnChanges(): void {
    this.localTime = this.time.toLocaleString();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  setTime() {
    const currentDate = new Date();
    currentDate.setMilliseconds(0);
    const duration = currentDate.getTime() - new Date(this.time).getTime();
    this.timeSince = TimeUtils.formatDurationAsAspNetTimespan(duration);

    this.cdr.detectChanges();
  }


}
