import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mi-warning',
  templateUrl: './mi-warning.component.html',
  styleUrls: ['./mi-warning.component.scss']
})
export class MiWarningComponent {

  @Input() miWarningText = "This cluster is using Managed Identity authentication. EventStore events may be temporarily unavailable. You may temporarily opt out of EventStore in your cluster to avoid this warning.";

}
