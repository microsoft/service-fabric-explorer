import { Component, OnInit, Injector } from '@angular/core';
import { ServiceBaseControllerDirective } from '../ServiceBase';
import { ListSettings, ListColumnSetting } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { IsolatedAction, ActionWithConfirmationDialog } from 'src/app/Models/Action';
import { mergeMap, map } from 'rxjs/operators';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { TelemetryService } from 'src/app/services/telemetry.service';
import { InfrastructureJob } from 'src/app/Models/DataModels/infrastructureJob';
import { IRawInfrastructureJob } from 'src/app/Models/RawDataTypes';

@Component({
  selector: 'app-infrastructurejobs',
  templateUrl: './infrastructurejobs.component.html',
  styleUrls: ['./infrastructurejobs.component.scss']
})
export class InfrastructureJobsComponent extends ServiceBaseControllerDirective {
  mrJobs: IRawInfrastructureJob[];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService, public telemetry: TelemetryService) {
    super(data, injector);
  }

  setup() {
    this.data.restClient.getInfrastructureJobs(this.serviceId).subscribe(mrJobdata => {
      this.mrJobs = mrJobdata;
    })

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {

    const dateRef = new Date();
    //this.mrJobs =  this.data.restClient.getInfrastructureJobs(this.service.id, messageHandler).pipe(map(mrJobList => mrJobList.map(mrJob => new InfrastructureJob(this.service.id, this.data, mrJob, dateRef)) ))
    return this.data.refreshBackupPolicies(messageHandler);
  }

  setupActions(){

  }
   
}


