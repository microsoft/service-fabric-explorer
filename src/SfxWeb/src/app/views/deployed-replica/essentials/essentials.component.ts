import { Component, OnInit, Injector } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DeployedReplicaBaseController } from '../DeployedReplicaBase';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedReplicaBaseController {
  appView: string;

  constructor(protected data: DataService, injector: Injector) { 
    super(data, injector);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    console.log(this.replica)
    const deployedService = this.replica.parent;
    const deployedApplication = deployedService.parent;
    const serviceName = encodeURI(this.replica.raw.ServiceName.replace("fabric:/", ""));
    this.appView = this.data.routes.getReplicaViewPath(deployedApplication.raw.TypeName, deployedApplication.raw.Id, serviceName,
                                                       this.replica.raw.PartitionId, this.replica.id);
    return of(null);
  }
}
