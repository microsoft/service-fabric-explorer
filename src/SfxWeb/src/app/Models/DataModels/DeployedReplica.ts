import { DataModelBase, IDecorators } from './Base';
import { IRawDeployedReplica, IRawPartition, IRawDeployedReplicaDetail, IRawLoadMetricReport, IRawReplicatorStatus, IRawRemoteReplicatorStatus, IRawReplicaInfo, IRawInstanceInfo } from '../RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { DeployedServicePackage } from './DeployedServicePackage';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ServiceKindRegexes, SortPriorities, UnicodeConstants } from 'src/app/Common/Constants';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { Observable, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ReplicaOnPartition } from './Replica';
import { LoadMetricReport } from './Partition';
import { ActionWithConfirmationDialog } from '../Action';
import { RoutesService } from 'src/app/services/routes.service';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class DeployedReplica extends DataModelBase<IRawDeployedReplica> {
    public decorators: IDecorators = {
        decorators: {
            LastInBuildDurationInSeconds: {
                displayName: (name) => 'Last In Build Duration',
                displayValue: (value) => this.lastInBuildDuration
            }
        }
    };

    public address: any;
    public detail: DeployedReplicaDetail;
    public partition: IRawPartition;

    public constructor(data: DataService, raw: IRawDeployedReplica, public parent: DeployedServicePackage) {
        super(data, raw, parent);

        this.detail = new DeployedReplicaDetail(this.data, this);
        this.updateInternal();

        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public get servicePackageActivationId(): string {
        return this.raw.ServicePackageActivationId;
    }

    public get serviceViewPath(): string {
        return RoutesService.getServiceViewPath(this.parent.parent.raw.TypeName, this.parent.parent.raw.Id, encodeURI(IdUtils.nameToId(this.raw.ServiceName)));
    }

    public get isStatefulService(): boolean {
        return ServiceKindRegexes.Stateful.test(this.raw.ServiceKind);
    }

    public get isStatelessService(): boolean {
        return ServiceKindRegexes.Stateless.test(this.raw.ServiceKind);
    }

    public get uniqueId(): string {
        return this.raw.PartitionId;
    }

    public get id(): string {
        return this.raw.ReplicaId || this.raw.InstanceId;
    }

    public get name(): string {
        return this.id;
    }

    public get role(): string {
        const { ReconfigurationInformation, ReplicaRole, InstanceRole } = this.raw;

        if( ServiceKindRegexes.SelfReconfiguring.test(this.raw.ServiceKind)) {
            if (!this.partition || this.partition.PartitionStatus !== 'Reconfiguring') {
                return InstanceRole;
            }

            const PreviousInstanceRole = this.raw.PreviousSelfReconfiguringInstanceRole;

            if (!PreviousInstanceRole || PreviousInstanceRole === 'None') {
                return `Reconfiguring - Target Role: ${InstanceRole}`;
            }

            return `Reconfiguring: ${PreviousInstanceRole} ${UnicodeConstants.RightArrow} ${InstanceRole}`;
        }

        if (!this.partition || this.partition.PartitionStatus !== 'Reconfiguring') {
            return ReplicaRole;
        }
    
        const PreviousReplicaRole = ReconfigurationInformation.PreviousConfigurationRole;
        if (!PreviousReplicaRole || PreviousReplicaRole === 'None') {
            return `Reconfiguring - Target Role: ${ReplicaRole}`;
        }
    
        return `Reconfiguring: ${PreviousReplicaRole} ${UnicodeConstants.RightArrow} ${ReplicaRole}`;
    }

    public get activationState(): string {
        if (!ServiceKindRegexes.SelfReconfiguring.test(this.raw.ServiceKind)) {
            return 'N/A';
        }

        const { PartitionStatus } = this.partition;
        const currentState = this.raw.SelfReconfiguringInstanceActivationState;
        const previousState = this.raw.PreviousSelfReconfiguringInstanceActivationState;

        if (PartitionStatus !== 'Reconfiguring') {
            return currentState;
        }

        return `Reconfiguring: ${previousState} ${UnicodeConstants.RightArrow} ${currentState}`;
    }

    public get viewPath(): string {
        return RoutesService.getDeployedReplicaViewPath(this.parent.parent.parent.name, this.parent.parent.id, this.parent.id, this.parent.servicePackageActivationId, this.raw.PartitionId, this.id);
    }

    public get lastInBuildDuration(): string {
        return TimeUtils.getDurationFromSeconds(this.raw.LastInBuildDurationInSeconds);
    }

    public get replicaRoleSortPriority(): number {
        return SortPriorities.ReplicaRolesToSortPriorities[this.raw.ReplicaRole] || 0;
    }

    public restartReplica(): Observable<any> {
        return this.data.restClient.restartReplica(this.parent.parent.parent.raw.Name, this.raw.PartitionId, this.raw.ReplicaId);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawDeployedReplica> {
        return this.data.restClient.getPartitionById(this.raw.PartitionId, ResponseMessageHandlers.silentResponseMessageHandler).pipe(mergeMap(data => {
            this.partition = data;
            return this.data.restClient.getDeployedReplica(this.parent.parent.parent.name, this.parent.parent.id, this.parent.name, this.raw.PartitionId, messageHandler);
        })).pipe(map( values => values[0]));
        // TODO check into this
        // return forkJoin([
        //     this.data.restClient.getPartitionById(this.raw.PartitionId, ResponseMessageHandlers.silentResponseMessageHandler),
        //     this.data.restClient.getDeployedReplica(this.parent.parent.parent.name, this.parent.parent.id, this.parent.name, this.raw.PartitionId, messageHandler)
        // ]).pipe(map((values) => {
        //     console.log("test")
        //                             this.partition = values[0];
        //                             return values[1][0];
        //                         }));
    }

    protected updateInternal(): Observable<any> | void {
        this.address = HtmlUtils.parseReplicaAddress(this.raw.Address);
    }

    private setUpActions(): void {
        const serviceName = this.parent.parent.raw.Name;

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
    }
}

export class DeployedReplicaDetail extends DataModelBase<IRawDeployedReplicaDetail> {
    public decorators: IDecorators = {
        hideList: [
            'ServiceKind',
            'InstanceId',
            'ReplicaId'
        ]
    };

    public replicatorStatus: ReplicatorStatus;
    public reportedLoad: LoadMetricReport[];

    public get currentServiceOperationStartTimeUtc(): string {
        return TimeUtils.timestampToUTCString(this.raw.CurrentServiceOperationStartTimeUtc);
    }

    public constructor(data: DataService, public parent: DeployedReplica | ReplicaOnPartition) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawDeployedReplicaDetail> {
        let getDeployedReplicaDetailPromise = null;
        if (this.parent instanceof DeployedReplica) {
            const deployedReplica = this.parent as DeployedReplica;
            getDeployedReplicaDetailPromise = this.data.restClient.getDeployedReplicaDetail(
                deployedReplica.parent.parent.parent.name, deployedReplica.raw.PartitionId, deployedReplica.id, messageHandler);
        } else {
            const replica = this.parent as ReplicaOnPartition;
            getDeployedReplicaDetailPromise = this.data.restClient.getDeployedReplicaDetail(
                replica.raw.NodeName, replica.parent.id, replica.id, messageHandler);
        }
        return getDeployedReplicaDetailPromise;
    }

    protected updateInternal(): Observable<any> | void {
        this.reportedLoad = this.raw.ReportedLoad.map(report => new LoadMetricReport(this.data, report));
        if (this.raw.ReplicatorStatus) {
            this.replicatorStatus = new ReplicatorStatus(this.data, this.raw.ReplicatorStatus);
        }
    }

    isStateful() {
        return this.parent.isStatefulService;
    }

    public get processID() {
        const info = this.isStateful() ? (this.raw as IRawReplicaInfo).DeployedServiceReplica : (this.raw as IRawInstanceInfo).DeployedServiceReplicaInstance;
        return info.HostProcessId;
    }
}

export class ReplicatorStatus extends DataModelBase<IRawReplicatorStatus> {
    public remoteReplicators: RemoteReplicatorStatus[];

    public get LastCopyOperationReceivedTimeUtc(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastCopyOperationReceivedTimeUtc);
    }

    public get LastReplicationOperationReceivedTimeUtc(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastReplicationOperationReceivedTimeUtc);
    }

    public get LastAcknowledgementSentTimeUtc(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastAcknowledgementSentTimeUtc);
    }

    public constructor(data: DataService, raw: IRawReplicatorStatus) {
        super(data, raw);

        if (raw.RemoteReplicators) {
            this.remoteReplicators = raw.RemoteReplicators.map(rp => new RemoteReplicatorStatus(this.data, rp));
        }
    }
}

export class RemoteReplicatorStatus extends DataModelBase<IRawRemoteReplicatorStatus> {
    public get lastAcknowledgementProcessedTimeUtc(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastAcknowledgementProcessedTimeUtc);
    }

    public constructor(data: DataService, raw: IRawRemoteReplicatorStatus) {
        super(data, raw);
    }
}


