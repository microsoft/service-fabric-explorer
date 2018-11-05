//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class DeployedReplica extends DataModelBase<IRawDeployedReplica> {
        public decorators: IDecorators = {
            decorators: {
                "LastInBuildDurationInSeconds": {
                    displayName: (name) => "Last In Build Duration",
                    displayValueInHtml: (value) => this.lastInBuildDuration
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
            return this.data.routes.getServiceViewPath(this.parent.parent.raw.TypeName, this.parent.parent.raw.Id, IdUtils.nameToId(this.raw.ServiceName));
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
            if (this.partition && this.partition.PartitionStatus === "Reconfiguring") {
                return `Reconfiguring - Target Role: ${this.raw.ReplicaRole}`;
            }

            return this.raw.ReplicaRole;
        }

        public get viewPath(): string {
            return this.data.routes.getDeployedReplicaViewPath(this.parent.parent.parent.name, this.parent.parent.id, this.parent.id, this.parent.servicePackageActivationId, this.raw.PartitionId, this.id);
        }

        public get lastInBuildDuration(): string {
            return TimeUtils.getDurationFromSeconds(this.raw.LastInBuildDurationInSeconds);
        }

        public get replicaRoleSortPriority(): number {
            return SortPriorities.ReplicaRolesToSortPriorities[this.raw.ReplicaRole] || 0;
        }

        public restartReplica(): angular.IPromise<any> {
            return this.data.restClient.restartReplica(this.parent.parent.parent.raw.Name, this.raw.PartitionId, this.raw.ReplicaId);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedReplica> {
            const promises: angular.IPromise<any>[] = [
                this.data.restClient.getPartitionById(this.raw.PartitionId, ResponseMessageHandlers.silentResponseMessageHandler).then(response => this.partition = response.data),
                this.data.restClient.getDeployedReplica(this.parent.parent.parent.name, this.parent.parent.id, this.parent.name, this.raw.PartitionId, messageHandler).then(response => { return _.first(response.data); })
            ];

            return this.data.$q.all(promises).then((values) => values[1]);
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.address = Utils.parseReplicaAddress(this.raw.Address);
        }
                
        private setUpActions(): void {
            let serviceName = this.parent.parent.raw.Name;

            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "Restart Replica",
                "Restart Replica",
                "Restarting",
                () => this.restartReplica(),
                () => true,
                `Confirm Replica Restart`,
                `Restart Replica for ${serviceName}`,
                "confirm"
            ));
        }
    }

    export class DeployedReplicaDetail extends DataModelBase<IRawDeployedReplicaDetail> {
        public decorators: IDecorators = {
            hideList: [
                "ServiceKind",
                "InstanceId",
                "ReplicaId"
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

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedReplicaDetail> {
            let getDeployedReplicaDetailPromise = null;
            if (this.parent instanceof DeployedReplica) {
                let deployedReplica = <DeployedReplica>this.parent;
                getDeployedReplicaDetailPromise = this.data.restClient.getDeployedReplicaDetail(
                    deployedReplica.parent.parent.parent.name, deployedReplica.raw.PartitionId, deployedReplica.id, messageHandler);
            } else {
                let replica = <ReplicaOnPartition>this.parent;
                getDeployedReplicaDetailPromise = this.data.restClient.getDeployedReplicaDetail(
                    replica.raw.NodeName, replica.parent.id, replica.id, messageHandler);
            }
            return Utils.getHttpResponseData(getDeployedReplicaDetailPromise);
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.reportedLoad = _.map(this.raw.ReportedLoad, report => new LoadMetricReport(this.data, report));
            if (this.raw.ReplicatorStatus) {
                this.replicatorStatus = new ReplicatorStatus(this.data, this.raw.ReplicatorStatus);
            }
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
                this.remoteReplicators = _.map(raw.RemoteReplicators, rp => new RemoteReplicatorStatus(this.data, rp));
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

}

