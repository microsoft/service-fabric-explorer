import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { DeployedReplica } from 'src/app/Models/DataModels/DeployedReplica';

@Directive()
export class DeployedReplicaBaseControllerDirective extends BaseControllerDirective {
    replicaStatus: number;

    nodeName: string;
    applicationId: string;
    partitionId: string;
    serviceId: string;
    activationId: string;

    replica: DeployedReplica;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getDeployedReplica(this.nodeName, this.applicationId, this.serviceId, this.activationId, this.partitionId, true, messageHandler)
        .pipe(mergeMap(deployedReplica => {
            this.replica = deployedReplica;

            return this.replica.detail.refresh();
        }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.nodeName = IdUtils.getNodeName(route);
        this.serviceId = IdUtils.getServiceId(route);
        this.activationId = IdUtils.getServicePackageActivationId(route);
        this.partitionId = IdUtils.getPartitionId(route);
        this.applicationId = IdUtils.getAppId(route);
    }
}
