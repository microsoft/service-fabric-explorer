import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { LoadMetricInformation } from 'src/app/Models/DataModels/Shared';

@Component({
  selector: 'app-metric-tile',
  templateUrl: './metric-tile.component.html',
  styleUrls: ['./metric-tile.component.scss']
})
export class MetricTileComponent implements OnInit {
  @Input() metric: LoadMetricInformation;

  constructor() { }

  ngOnInit(): void {
  }

}
