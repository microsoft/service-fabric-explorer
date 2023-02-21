import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { create, API } from 'nouislider';

export interface IOnDateChange {
  endDate: Date;
  startDate: Date;
}
@Component({
  selector: 'app-double-slider',
  templateUrl: './double-slider.component.html',
  styleUrls: ['./double-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoubleSliderComponent implements OnChanges, AfterViewInit {

  @Input() startDate: any;
  @Input() endDate: any;
  @Input() minDate: Date;

  @Output() dateChanged = new EventEmitter<IOnDateChange>();

  slider: API;

  @ViewChild('slider') container: ElementRef;


  constructor() { }

  ngAfterViewInit() {

    this.slider = create(this.container.nativeElement, {
        format: {
            to : num => {
                const date = new Date(num);
                return date.toISOString() + '<br>' + date.toLocaleString('en-us');
            },
            from: Number
        },
        tooltips: true,
        connect: true,
        range: {
            min: this.minDate ? this.minDate.getTime() : TimeUtils.AddDays(new Date(), -30).getTime(),
            max: new Date().getTime(),
        },
        handleAttributes: [
          { 'aria-label': 'lower',
            'aria-valuemax': 'lower'
         },
          { 'aria-label': 'upper',
           'aria-valuemin': 'upper'
        },
      ],
      ariaFormat: {
        to : num => {
          const date = new Date(num);
          return date.toISOString();
      },
      },
        start: [new Date(this.startDate).getTime(), new Date(this.endDate).getTime()],
    });

    // watch for changes to dates to know when to attempt to update the scroll bar
    // note: when this updates the value it'll cycle back down and call this so making sure you have a check
    // for only updating on new values so it doesnt get stuck on an update loop.
    this.slider.on('set', (data) => {
        const start = new Date((data[0] as string).split('<br>')[1]);
        const end = new Date((data[1] as string).split('<br>')[1]);

        let changed = false;

        if (this.endDate.toUTCString() !== end.toUTCString()) {
            this.endDate = end;
            changed = true;
        }
        if (this.startDate.toUTCString() !== start.toUTCString()) {
            this.startDate = start;
            changed = true;
        }

        if (changed){
          this.dateChanged.emit({
            endDate: this.endDate,
            startDate: this.startDate
          });
        }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.slider){
      this.slider.set([new Date(this.startDate).getTime(), new Date(this.endDate).getTime()]);
    }
  }

}
