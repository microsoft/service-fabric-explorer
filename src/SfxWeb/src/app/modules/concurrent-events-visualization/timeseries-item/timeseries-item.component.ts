import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-timeseries-item',
  templateUrl: './timeseries-item.component.html',
  styleUrls: ['./timeseries-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeseriesItemComponent {
  @Input() item: any;

  constructor() { }

}
