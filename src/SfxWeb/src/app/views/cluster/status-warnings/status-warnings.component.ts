import { Component, OnInit } from '@angular/core';
import { StatusWarningService, IStatusWarning } from 'src/app/services/status-warning.service';
import { of } from 'rxjs';
import { ActionWithConfirmationDialog } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';
import { StatusWarningLevel } from 'src/app/Common/Constants';

@Component({
  selector: 'app-status-warnings',
  templateUrl: './status-warnings.component.html',
  styleUrls: ['./status-warnings.component.scss']
})
export class StatusWarningsComponent{

  displayAll = false;

  constructor(public alerts: StatusWarningService, public data: DataService) { }

  public toggleViewed(): void {
      this.displayAll = !this.displayAll;
  }

  public remove(alert: IStatusWarning, hidePermanently = false): void {
    if (alert.level === StatusWarningLevel.Warning){
      this.removeWithConfirm(alert);
    }else{
      this.alerts.removeNotificationById(alert.id, hidePermanently);
    }
  }

  public removeWithConfirm(alert: IStatusWarning): void {
    new ActionWithConfirmationDialog(
        this.data.dialog,
        '',
        'Accept',
        'acknowledge',
        () => of(this.alerts.removeNotificationById(alert.id, true)),
        () => true,
        'Acknowledge',
        alert.confirmText,
        'Accept').run();
  }


}
