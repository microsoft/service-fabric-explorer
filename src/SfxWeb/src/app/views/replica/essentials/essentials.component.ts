import { Component, Injector } from '@angular/core';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { SettingsService } from 'src/app/services/settings.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
    return forkJoin([
      this.replica.health.refresh(messageHandler),
      this.replica.detail.refresh(messageHandler).pipe(map(() => {
        if (!this.isSystem) {
          const rawDataProperty = this.replica.isStatefulService ? 'DeployedServiceReplica' : 'DeployedServiceReplicaInstance';
          const detailRaw = this.replica.detail.raw[rawDataProperty];

          const serviceNameOnly = detailRaw.ServiceManifestName;
          const activationId = detailRaw.ServicePackageActivationId || null;
          this.nodeView = RoutesService.getDeployedReplicaViewPath(this.replica.raw.NodeName, this.appId, serviceNameOnly, activationId, this.partitionId, this.replicaId);
        }
      }))
    ]).pipe(map(() => {
      this.essentialItems = [
        {
          descriptionName: 'Node Name',
          copyTextValue: this.replica.raw.NodeName,
          selectorName: 'nodeName',
          displaySelector: true
        },
        {
          descriptionName: 'Process Id',
          displayText: this.replica.detail.processID,
          copyTextValue: this.replica.detail.processID
        },
        {
          descriptionName: 'Status',
          displayText: this.replica.raw.ReplicaStatus,
          copyTextValue: this.replica.raw.ReplicaStatus,
          selectorName: 'status',
          displaySelector: true
        }
      ];

      this.replica.raw.IsStopped = true;

      if(this.replica.raw.IsStopped) {
        const strIsStopped = String(this.replica.raw.IsStopped);
        this.essentialItems.push({
          descriptionName: 'IsStopped',
          displayText: strIsStopped,
          copyTextValue: strIsStopped,
          selectorName: 'stopped'
        })
        
        const now = new Date();
        const tomorrowUTC = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const expirationTimestampUTC = tomorrowUTC.toISOString();
        this.essentialItems.push({
          descriptionName: 'Replica Expiration Timestamp UTC',
          displayText: expirationTimestampUTC,
          copyTextValue: expirationTimestampUTC,
          selectorName: 'stoppedExpirationTimestamp'
        })
      }

      if(!this.isSystem) {
        this.essentialItems.push(        {
          selectorName: 'viewNode',
          displaySelector: true
        })
      }
    }));
  }
}
