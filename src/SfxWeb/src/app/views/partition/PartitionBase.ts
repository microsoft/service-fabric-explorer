import { DataService } from 'src/app/services/data.service';
import { Injector, Directive } from '@angular/core';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { Partition } from 'src/app/Models/DataModels/Partition';

@Directive()
export class PartitionBaseController extends BaseController {
    public appId: string;
    public serviceId: string;
    public partitionId: string;
    public appTypeName: string;

    partition: Partition;

    constructor(protected data: DataService, injector: Injector) {
      super(injector);
    }

    common(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getPartition(this.appId, this.serviceId, this.partitionId, true, messageHandler)
        .pipe(map(partition => {
            this.partition = partition;
        }));
    }

    getParams(route: ActivatedRouteSnapshot): void {
        this.appTypeName = IdUtils.getAppTypeName(route);
        this.appId = IdUtils.getAppId(route);
        this.serviceId = IdUtils.getServiceId(route);
        this.partitionId = IdUtils.getPartitionId(route);
      }
}
