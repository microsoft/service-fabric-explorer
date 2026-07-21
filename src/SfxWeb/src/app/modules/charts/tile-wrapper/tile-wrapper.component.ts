import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-tile-wrapper',
    templateUrl: './tile-wrapper.component.html',
    styleUrls: ['./tile-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TileWrapperComponent {

  constructor() { }
}
