import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends BaseController {
  public appId: string;
  public serviceId: string;
  public partitionId: string;
  public replicaId: string;
  public appTypeName: string;
  public isSystem: boolean;

  replica: ReplicaOnPartition;
  unhealthyEvaluationsListSettings: ListSettings;
  nodeView: string;

  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();

  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getReplicaOnPartition(this.appId, this.serviceId, this.partitionId, this.replicaId, true, messageHandler)
    .pipe(map(replica => {
        this.replica = replica;
        if (!this.isSystem) {
            try {

                this.replica.detail.refresh(messageHandler).pipe(map( () => {
                    const rawDataProperty = this.replica.isStatefulService ? "DeployedServiceReplica" : "DeployedServiceReplicaInstance";
                    const detailRaw = this.replica.detail.raw[rawDataProperty];

                    const serviceNameOnly = detailRaw.ServiceManifestName;
                    const activationId = detailRaw.ServicePackageActivationId || null;
                    this.nodeView = this.data.routes.getDeployedReplicaViewPath(this.replica.raw.NodeName, this.appId, serviceNameOnly, activationId, this.partitionId, this.replicaId);
                }));
            } catch (e) {
                console.log(e);
            }
        }

        return this.replica.health.refresh(messageHandler);
    }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.appTypeName = IdUtils.getAppTypeName(route);
    this.appId = IdUtils.getAppId(route);
    this.serviceId = IdUtils.getServiceId(route);
    this.partitionId = IdUtils.getPartitionId(route);
    this.replicaId = IdUtils.getReplicaId(route);
  }
}
