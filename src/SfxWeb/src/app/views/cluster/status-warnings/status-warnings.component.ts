import { Component, OnInit } from '@angular/core';
import { StatusWarningService, IStatusWarning } from 'src/app/services/status-warning.service';

@Component({
  selector: 'app-status-warnings',
  templateUrl: './status-warnings.component.html',
  styleUrls: ['./status-warnings.component.scss']
})
export class StatusWarningsComponent{

  displayAll = false;

  constructor(public alerts: StatusWarningService) { }

  public toggleViewed(): void {
      this.displayAll = !this.displayAll;
  }

  public remove(alert: IStatusWarning, hidePermanently = false): void {
      this.alerts.removeNotificationById(alert.id, hidePermanently);
  }

}
