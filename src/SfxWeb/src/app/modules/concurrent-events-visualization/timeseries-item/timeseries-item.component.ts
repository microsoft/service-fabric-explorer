import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-timeseries-item',
  templateUrl: './timeseries-item.component.html',
  styleUrls: ['./timeseries-item.component.scss']
})
export class TimeseriesItemComponent {
  @Input() item: any;

  constructor() { }

}
