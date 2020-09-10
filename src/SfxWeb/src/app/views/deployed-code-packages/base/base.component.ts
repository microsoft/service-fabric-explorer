import { Component, OnInit, Injector } from '@angular/core';
import { BaseController } from 'src/app/ViewModels/BaseController';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageCollection } from 'src/app/Models/DataModels/collections/Collections';
import { ListSettings, ListColumnSettingForLink, ListColumnSettingWithFilter, ListColumnSetting } from 'src/app/Models/ListSettings';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { map } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent extends BaseController {
  public nodeName: string;
  public appId: string;
  public serviceId: string;
  public activationId: string;

  codePackages: DeployedCodePackageCollection;
  listSettings: ListSettings;

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
      IdGenerator.deployedCodePackageGroup()
  ], true);
  }

  common(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.getDeployedCodePackages(this.nodeName, this.appId, this.serviceId, this.activationId, true, messageHandler)
    .pipe(map(codePackages => {
        this.codePackages = codePackages;

        if (!this.listSettings && codePackages.length > 0) {
            const columnSettings = [
                new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
                new ListColumnSettingWithFilter('raw.HostType', 'Host Type'),
                new ListColumnSettingWithFilter('raw.HostIsolationMode', 'Host Isolation Mode'),
                new ListColumnSetting('raw.Version', 'Version'),
                new ListColumnSetting('raw.MainEntryPoint.ProcessId', 'Process Id'),
                new ListColumnSettingWithFilter('raw.Status', 'Status'),
            ];

            if (codePackages.collection.some(cp => cp.servicePackageActivationId)) {
                columnSettings.splice(3, 0, new ListColumnSetting('servicePackageActivationId', 'Service Package Activation Id'));
            }

            this.listSettings = this.settings.getNewOrExistingListSettings('codePkgs', ['name'], columnSettings);
        }
    }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
      this.nodeName = IdUtils.getNodeName(route);
      this.serviceId = IdUtils.getServiceId(route);
      this.activationId = IdUtils.getServicePackageActivationId(route);
      this.appId = IdUtils.getAppId(route);
  }
}
