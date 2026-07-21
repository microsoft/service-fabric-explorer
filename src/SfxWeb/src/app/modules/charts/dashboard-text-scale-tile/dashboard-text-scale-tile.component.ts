import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-dashboard-text-scale-tile',
    templateUrl: './dashboard-text-scale-tile.component.html',
    styleUrls: ['./dashboard-text-scale-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DashboardTextScaleTileComponent {

  @Input() barClass = '';
  @Input() title: string;
  @Input() link: string;
  @Input() text: string[] = [];

  constructor() { }

}
