import { Component, Injector } from '@angular/core';
import { of } from 'rxjs';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { DataService } from 'src/app/services/data.service';
import { DeployedCodePackageBaseControllerDirective } from '../DeployedCodePackageBase';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends DeployedCodePackageBaseControllerDirective {

  essentialItems: IEssentialListItem[] = [];
  essentialItems2: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector) {
    super(data, injector);
  }

  refresh() {

    this.essentialItems = [
      {
        descriptionName: 'Version',
        displayText: this.deployedCodePackage.raw.Version,
        copyTextValue: this.deployedCodePackage.raw.Version
      },
      {
        descriptionName: 'Host Type',
        displayText: this.deployedCodePackage.raw.HostType,
        copyTextValue: this.deployedCodePackage.raw.HostType
      },
      {
        descriptionName: 'Host Isolation Mode',
        displayText: this.deployedCodePackage.raw.HostIsolationMode,
        copyTextValue: this.deployedCodePackage.raw.HostIsolationMode
      }
    ];

    this.essentialItems2 = [
      {
        descriptionName: 'Process Id',
        displayText: this.deployedCodePackage.raw.MainEntryPoint.ProcessId,
        copyTextValue: this.deployedCodePackage.raw.MainEntryPoint.ProcessId
      },
      {
        descriptionName: 'Instance Id',
        displayText: this.deployedCodePackage.raw.MainEntryPoint.InstanceId,
        copyTextValue: this.deployedCodePackage.raw.MainEntryPoint.InstanceId
      },
      {
        descriptionName: 'Status',
        copyTextValue: this.deployedCodePackage.raw.Status,
        selectorName: 'status',
        displaySelector: true
      }
    ];

    if (this.deployedCodePackage.servicePackageActivationId) {
      this.essentialItems.push({
          descriptionName: 'Service Package Activation Id',
          copyTextValue: this.deployedCodePackage.servicePackageActivationId,
          displayText: this.deployedCodePackage.servicePackageActivationId,
        });
    }

    return of(null);
  }

  setup() {
    this.essentialItems = [];
    this.essentialItems2 = [];
  }
}
