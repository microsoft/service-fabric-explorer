import { IRawReplicaOnPartition, IRawReplicaHealth } from '../RawDataTypes';
import { IDecorators, DataModelBase } from './Base';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { DeployedReplicaDetail } from './DeployedReplica';
import { DataService } from 'src/app/services/data.service';
import { Partition } from './Partition';
import { HealthStateFilterFlags } from '../HealthChunkRawDataTypes';
import { ServiceKindRegexes, SortPriorities, UnicodeConstants } from 'src/app/Common/Constants';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { HealthBase } from './HealthEvent';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ActionWithConfirmationDialog } from '../Action';
import { RoutesService } from 'src/app/services/routes.service';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class ReplicaOnPartition extends DataModelBase<IRawReplicaOnPartition> {
    public decorators: IDecorators = {
        decorators: {
            LastInBuildDurationInSeconds: {
                displayName: (name) => 'Last In Build Duration',
                displayValue: (value) => this.lastInBuildDuration
            },
            ReplicaRole: {
                displayValue: (value) => this.role
            }
        }
    };

    public health: ReplicaHealth;
    public detail: DeployedReplicaDetail;
    public address: any;

    public constructor(data: DataService, raw: IRawReplicaOnPartition, public parent: Partition) {
        super(data, raw, parent);

        this.health = new ReplicaHealth(this.data, this, HealthStateFilterFlags.Default);
        this.detail = new DeployedReplicaDetail(this.data, this);
        this.updateInternal();

        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public restartReplica(): Observable<any> {
        return this.data.restClient.restartReplica(this.raw.NodeName, this.parent.raw.PartitionInformation.Id, this.raw.ReplicaId);
    }

    public deleteInstance(): Observable<any> {
        return this.data.restClient.deleteReplica(this.raw.NodeName, this.parent.raw.PartitionInformation.Id, this.raw.InstanceId);
    }

    public get isStatefulService(): boolean {
        return ServiceKindRegexes.Stateful.test(this.raw.ServiceKind);
    }

    public get isStatelessService(): boolean {
        return ServiceKindRegexes.Stateless.test(this.raw.ServiceKind);
    }

    public get id(): string {
        return this.raw.ReplicaId || this.raw.InstanceId;
    }

    public get name(): string {
        return this.id;
    }

    public get role(): string {
        const { PartitionStatus } = this.parent.raw;
        const { PreviousReplicaRole, ReplicaRole } = this.raw;
    
        if (PartitionStatus !== 'Reconfiguring') {
            return ReplicaRole;
        }
    
        if (!PreviousReplicaRole || PreviousReplicaRole === 'None') {
            return `Reconfiguring - Target Role: ${ReplicaRole}`;
        }
    
        return `Reconfiguring: ${PreviousReplicaRole} ${UnicodeConstants.RightArrow} ${ReplicaRole}`;
    }

    public get currentRole(): string {
        return this.raw.ReplicaRole;
    }

    public get previousRole(): string {
        if (this.parent.raw.PartitionStatus === 'Reconfiguring' && this.raw.PreviousReplicaRole) {
            return this.raw.PreviousReplicaRole;
        }

        return 'None';
    }

    public get viewPath(): string {
        return RoutesService.getReplicaViewPath(this.parent.parent.parent.raw.TypeName, this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, this.id);
    }

    public get nodeViewPath(): string {
        return RoutesService.getNodeViewPath(this.raw.NodeName);
    }

    public get lastInBuildDuration(): string {
        return TimeUtils.getDurationFromSeconds(this.raw.LastInBuildDurationInSeconds);
    }

    public get replicaRoleSortPriority(): number {
        return SortPriorities.ReplicaRolesToSortPriorities[this.raw.ReplicaRole] || 0;
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<any> {
        // Refresh the parent partition here as well because we need its status to display the correct role name
        return this.parent.refresh().pipe(mergeMap(
            () => this.data.restClient.getReplicaOnPartition(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, this.id, messageHandler)));
    }

    protected updateInternal(): Observable<any> | void {
        this.address = HtmlUtils.parseReplicaAddress(this.raw.Address);
    }

    private setUpActions(): void {
        const serviceName = this.parent.parent.raw.Name;

        if (this.isStatefulService) {
          this.actions.add(new ActionWithConfirmationDialog(
              this.data.dialog,
              'Restart Replica',
              'Restart Replica',
              'Restarting',
              () => this.restartReplica(),
              () => true,
              {
                title:  `Confirm Replica Restart`
              },
              {
                inputs: {
                    message: `Restart Replica for ${serviceName}`,
                    confirmationKeyword: 'confirm'
                }
              }
          ));
      } else if (this.isStatelessService) {
          this.actions.add(new ActionWithConfirmationDialog(
              this.data.dialog,
              'Delete Instance',
              'Delete Instance',
              'Deleting',
              () => this.deleteInstance(),
              () => true,
              {
                title:  `Confirm Instance Delete`
              },
              {
                inputs: {
                    message: `Delete Instance for ${serviceName}`,
                    confirmationKeyword: 'confirm'
                }
              }
          ));
      }

    }
}

export class ReplicaHealth extends HealthBase<IRawReplicaHealth> {
    public constructor(data: DataService, public parent: ReplicaOnPartition, protected eventsHealthStateFilter: HealthStateFilterFlags) {
        super(data, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawReplicaHealth> {
        return this.data.restClient.getReplicaHealth(this.parent.parent.parent.parent.id, this.parent.parent.parent.id,
            this.parent.parent.id, this.parent.id, this.eventsHealthStateFilter, messageHandler);
    }
}
