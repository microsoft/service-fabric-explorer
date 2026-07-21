import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { LoadMetricInformation } from 'src/app/Models/DataModels/Shared';

@Component({
    selector: 'app-metric-tile',
    templateUrl: './metric-tile.component.html',
    styleUrls: ['./metric-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MetricTileComponent {
  @Input() metric: LoadMetricInformation;
  @Output() toggleSelected = new EventEmitter<void>();

  constructor() { }
}
