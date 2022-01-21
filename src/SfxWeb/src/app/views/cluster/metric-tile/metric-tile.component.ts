import { Component, Input } from '@angular/core';
import { LoadMetricInformation } from 'src/app/Models/DataModels/Shared';

@Component({
  selector: 'app-metric-tile',
  templateUrl: './metric-tile.component.html',
  styleUrls: ['./metric-tile.component.scss']
})
export class MetricTileComponent {
  @Input() metric: LoadMetricInformation;

  constructor() { }
}
