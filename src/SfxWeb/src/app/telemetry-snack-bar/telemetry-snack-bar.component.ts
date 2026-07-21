import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-telemetry-snack-bar',
    templateUrl: './telemetry-snack-bar.component.html',
    styleUrls: ['./telemetry-snack-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TelemetrySnackBarComponent {

  constructor() { }

}
