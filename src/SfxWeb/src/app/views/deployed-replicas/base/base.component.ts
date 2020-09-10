import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { DeployedReplicaCollection } from 'src/app/Models/DataModels/collections/Collections';
import { ListSettings, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForLink } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends BaseController {
  nodeName: string;
  appId: string;
  serviceId: string;
  activationId: string;

  replicas: DeployedReplicaCollection;
  listSettings: ListSettings;

  type: string;

  constructor(protected data: DataService, injector: Injector, private tree: TreeService, private settings: SettingsService) {
    super(injector);
  }

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.nodeGroup(),
      IdGenerator.node(this.nodeName),
      IdGenerator.deployedApp(this.appId),
      IdGenerator.deployedServicePackage(this.serviceId, this.activationId),
      IdGenerator.deployedReplicaGroup()
    ], true);

    this.listSettings = null;
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getDeployedReplicas(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
    .pipe(map(replicas => {
        this.replicas = replicas;
        this.type = replicas.isStatelessService ? 'Deployed Instances' : 'Deployed Replicas';

        if (!this.listSettings && replicas.length > 0) {
            const replica = replicas.collection[0];
            let defaultSortProperties = ['replicaRoleSortPriority', 'id'];
            const columnSettings = [
                new ListColumnSettingForLink('id', 'Id', item => item.viewPath),
                new ListColumnSetting('raw.PartitionId', 'Partition Id'),
                new ListColumnSettingWithFilter('raw.ServiceKind', 'Service Kind'),
                new ListColumnSettingWithFilter('role', 'Replica Role', defaultSortProperties),
                new ListColumnSettingWithFilter('raw.ReplicaStatus', 'Status')
            ];

            if (replica.isStatelessService) {
                columnSettings.splice(3, 1); // Remove replica role column
                defaultSortProperties = ['id'];
            }

            if (replicas.collection.some(cp => cp.servicePackageActivationId)) {
                columnSettings.splice(1, 0, new ListColumnSetting('servicePackageActivationId', 'Service Package Activation Id'));
            }

            this.listSettings = this.settings.getNewOrExistingListSettings(`replicas-${this.serviceId}${this.nodeName}`, defaultSortProperties, columnSettings);
        }
    }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.nodeName = IdUtils.getNodeName(route);
    this.appId = IdUtils.getAppId(route);
    this.serviceId = IdUtils.getServiceId(route);
    this.activationId = IdUtils.getServicePackageActivationId(route);
  }

}
