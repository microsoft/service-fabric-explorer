import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Component({
  selector: 'app-display-time',
  templateUrl: './display-time.component.html',
  styleUrls: ['./display-time.component.scss']
})
export class DisplayTimeComponent implements OnChanges {

  @Input() time: string;

  localTime = "";
  timeSince = "";
  constructor() { }

  ngOnChanges(): void {
    this.localTime = `${this.time.toLocaleString()}`;

    const duration = new Date().getTime() - new Date(this.time).getTime();
    this.timeSince = TimeUtils.formatDurationAsAspNetTimespan(duration);
  }

}
