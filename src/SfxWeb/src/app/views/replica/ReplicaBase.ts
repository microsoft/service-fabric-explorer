import { DataService } from 'src/app/services/data.service';
import { Directive, inject } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Constants } from 'src/app/Common/Constants';

@Directive()
export class ReplicaBaseControllerDirective extends BaseControllerDirective {
    protected data = inject(DataService);

    public appId: string;
    public serviceId: string;
    public partitionId: string;
    public replicaId: string;
    public appTypeName: string;
    public isSystem: boolean;

    replica: ReplicaOnPartition;

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        this.isSystem = this.appTypeName === Constants.SystemAppTypeName;

        return this.data.getReplicaOnPartition(this.appId, this.serviceId, this.partitionId, this.replicaId, true, messageHandler)
        .pipe(map(replica => {
            this.replica = replica;
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
