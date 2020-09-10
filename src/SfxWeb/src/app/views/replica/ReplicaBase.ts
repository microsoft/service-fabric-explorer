import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { ReplicaOnPartition } from 'src/app/Models/DataModels/Replica';
import { Constants } from 'src/app/Common/Constants';

@Directive()
export class ReplicaBaseController extends BaseController {
    public appId: string;
    public serviceId: string;
    public partitionId: string;
    public replicaId: string;
    public appTypeName: string;
    public isSystem: boolean;

    replica: ReplicaOnPartition;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

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
