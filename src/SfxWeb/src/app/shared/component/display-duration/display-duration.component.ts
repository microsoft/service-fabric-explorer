import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-display-duration',
  templateUrl: './display-duration.component.html',
  styleUrls: ['./display-duration.component.scss']
})
export class DisplayDurationComponent implements OnChanges {

  @Input() topText = '';
  @Input() topInMilliseconds: number;
  @Input() topHelpText = '';

  @Input() bottomText = '';
  @Input() bottomInMilliseconds: number;
  @Input() bottomHelpText = '';
  @Input() bottomHelpTextLink = '';

  timeLeft = 0;

  leftDuration = 0;
  rightDuration = 0;
  barColor = '';

  constructor() { }

  ngOnChanges(): void {
    this.leftDuration = (this.topInMilliseconds / this.bottomInMilliseconds);
    this.rightDuration = 1 - this.leftDuration;

    this.timeLeft = this.bottomInMilliseconds;
    this.barColor = this.setColorCode(this.leftDuration);
  }

  setColorCode(percent): string {
    if (percent > .75) {
      return 'red';
    }else if (percent > .5 ){
      return 'yellow';
    }else {
      return 'blue';
    }
  }

}
