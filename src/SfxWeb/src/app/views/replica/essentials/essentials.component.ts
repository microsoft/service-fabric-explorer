import { Component, Injector } from '@angular/core';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { forkJoin, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ReplicaBaseControllerDirective } from '../ReplicaBase';
import { RoutesService } from 'src/app/services/routes.service';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent extends ReplicaBaseControllerDirective {
  nodeView: string;

  essentialItems: IEssentialListItem[] = [];

  constructor(protected data: DataService, injector: Injector, private settings: SettingsService) {
    super(data, injector);
  }

  setup() {
    this.essentialItems = [];
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
  const safeHealthRefresh$ = this.replica.health.refresh(messageHandler).pipe(
    catchError(error => {
      console.error("Health refresh failed", error);
      return of(null); // Continue with null on failure
    })
  );

  const safeDetailRefresh$ = this.replica.detail.refresh(messageHandler).pipe(
    map(() => {
      if (!this.isSystem) {
          const rawDataProperty = this.replica.isStatefulService ? 'DeployedServiceReplica' : 'DeployedServiceReplicaInstance';
          const detailRaw = this.replica.detail.raw[rawDataProperty];

          const serviceNameOnly = detailRaw.ServiceManifestName;
          const activationId = detailRaw.ServicePackageActivationId || null;
          this.nodeView = RoutesService.getDeployedReplicaViewPath(this.replica.raw.NodeName, this.appId, serviceNameOnly, activationId, this.partitionId, this.replicaId);
      }
      return true;
    }),
    catchError(error => {
      console.error("Detail refresh failed", error);
      return of(false); // Emit with "failed" flag
    })
  );

  return forkJoin([safeHealthRefresh$, safeDetailRefresh$]).pipe(
    map(([_, detailSuccess]) => {
      this.essentialItems = [
        {
          descriptionName: 'Node Name',
          copyTextValue: this.replica.raw.NodeName,
          selectorName: 'nodeName',
          displaySelector: true
        }];

        if(detailSuccess)
        {
          this.essentialItems.push({
          descriptionName: 'Process Id',
          displayText: this.replica.detail.processID,
          copyTextValue: this.replica.detail.processID
        });
        }

        this.essentialItems.push({
          descriptionName: 'Status',
          displayText: this.replica.raw.ReplicaStatus,
          copyTextValue: this.replica.raw.ReplicaStatus,
          selectorName: 'status',
          displaySelector: true
        });

      if (this.replica.raw.ReplicaStatus === 'ToBeRemoved') {
        const expirationTimestampUTC = this.replica.raw.ToBeRemovedReplicaExpirationTimeUtc;
        this.essentialItems.push({
          descriptionName: 'Replica Expiration Time UTC',
          displayText: expirationTimestampUTC,
          copyTextValue: expirationTimestampUTC,
          selectorName: 'toBeRemovedExpirationTimeUTC'
        });
      }

      if (!this.isSystem) {
        this.essentialItems.push({
          selectorName: 'viewNode',
          displaySelector: true
        });
      }
    })
  );
}
}
