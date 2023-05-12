import { Component, Input, OnChanges, OnInit } from '@angular/core';

export interface ISection {
  width: number;
  color: string;
}

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

  @Input() colorMap: Record<number, string> = {
    .75 : 'red',
    .5 : 'yellow',
    0 : 'var(--accent-darkblue)'
  }

  timeLeft = 0;

  leftDuration = 0;
  rightDuration = 0;
  barColor = '';

  sections: ISection[] = [];

  constructor() { }

  ngOnChanges(): void {
    this.leftDuration = (this.topInMilliseconds / this.bottomInMilliseconds);
    this.rightDuration = 1 - this.leftDuration;

    this.timeLeft = this.bottomInMilliseconds - this.topInMilliseconds;
    this.barColor = this.setColorCode(this.leftDuration);

    this.sections = [
      {
        width: this.leftDuration,
        color: this.barColor
      },
      {
        width: this.rightDuration,
        color: "grey"
      }
    ]
    console.log(this.sections)
  }

  setColorCode(percent): string {
    const direction = Object.entries(this.colorMap).sort((a,b) => {
      return +b[0] - +a[0];
    });

    console.log(direction)

    for(let i = 0; i < direction.length; i ++) {
      if(+direction[i][0] < percent) {
        return direction[i][1];
      }
    }

    return "gray";
  }
}
