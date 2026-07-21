import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DeployedServicePackageBaseControllerDirective } from '../DeployedServicePackage';
import { DataService } from 'src/app/services/data.service';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { of } from 'rxjs';

@Component({
    selector: 'app-essentials',
    templateUrl: './essentials.component.html',
    styleUrls: ['./essentials.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EssentialsComponent extends DeployedServicePackageBaseControllerDirective {
  protected data: DataService = inject(DataService);

  essentialItems: IEssentialListItem[] = [];

  setup() {
    this.essentialItems = [];
  }

  refresh() {
    this.essentialItems = [
      {
        descriptionName: 'Version',
        displayText: this.servicePackage.raw.Version,
        copyTextValue: this.servicePackage.raw.Version
      },
      {
        descriptionName: 'Status',
        copyTextValue: this.servicePackage.raw.Status,
        selectorName: 'status',
        displaySelector: true
      }
    ];

    if (this.servicePackage.servicePackageActivationId) {
      this.essentialItems.push({
          descriptionName: 'Service Package Activation Id',
          copyTextValue: this.servicePackage.servicePackageActivationId,
          selectorName: 'appTypeViewPath',
          displaySelector: true
        });
    }

    return of(null);
  }
}
