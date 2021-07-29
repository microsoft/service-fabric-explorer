import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-display-duration',
  templateUrl: './display-duration.component.html',
  styleUrls: ['./display-duration.component.scss']
})
export class DisplayDurationComponent implements OnChanges {

  @Input() topText: string = "";
  @Input() topInMilliseconds: number;
  @Input() topHelpText: string = "";

  @Input() bottomText: string = "";
  @Input() bottomInMilliseconds: number;
  @Input() bottomHelpText: string = "";
  @Input() bottomHelpTextLink: string = "";

  timeLeft = 0;

  leftDuration: number = 0;
  rightDuration: number = 0;
  barColor: string = "";

  constructor() { }

  ngOnChanges(): void {
    this.leftDuration = (this.topInMilliseconds / this.bottomInMilliseconds);
    this.rightDuration = 1 - this.leftDuration;
    console.log(this)

    this.timeLeft = this.bottomInMilliseconds - this.topInMilliseconds;
    this.barColor = this.setColorCode(this.leftDuration);
  }

  setColorCode(percent): string {
    if(percent > .75) {
      return "red";
    }else if(percent > .5 ){
      return "yellow";
    }else {
      return "blue";
    }
  }

}
