//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class ReplicaOnPartition extends DataModelBase<IRawReplicaOnPartition> {
        public decorators: IDecorators = {
            decorators: {
                "LastInBuildDurationInSeconds": {
                    displayName: (name) => "Last In Build Duration",
                    displayValueInHtml: (value) => this.lastInBuildDuration
                },
                "NodeName": {
                    displayValueInHtml: (value) => HtmlUtils.getLinkHtml(value, this.nodeViewPath)
                },
                "ReplicaRole": {
                    displayValueInHtml: (value) => this.role + "test "
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
                console.log("setting up action items")
                this.setUpActions();
            }
            console.log(this.actions)

        }

        private setUpActions(): void {
            console.log(this.raw.ReplicaRole);
            if (this.raw.ReplicaRole !== "Primary") {
                return;
            }
            
            let serviceName = this.parent.parent.raw.Name;

            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "movePrimaryReplica",
                "Move Primary Replica",
                "Moving",
                () => this.movePrimaryReplica(),
                () => true,
                "Confirm Primary Replica Move",
                `Move Primary Replica for ${serviceName} from Node ${this.raw.NodeName}?`,
                'confirm'
            ));
            console.log("added actions")
        }

        public movePrimaryReplica(): angular.IPromise<any> {
            console.log(this.parent);
            console.log(this.raw);
            let nodeName = this.raw.NodeName;
            let replicaId = this.raw.ReplicaId;
            let partitionId = this.parent.raw.PartitionInformation.Id;
            return this.data.restClient.movePrimaryReplicaNode(nodeName, partitionId, replicaId); 
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
            if (this.parent.raw.PartitionStatus === "Reconfiguring") {
                return `Reconfiguring - Target Role: ${this.raw.ReplicaRole}`;
            }

            return this.raw.ReplicaRole;
        }

        public get viewPath(): string {
            return this.data.routes.getReplicaViewPath(this.parent.parent.parent.raw.TypeName, this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, this.id);
        }

        public get nodeViewPath(): string {
            return this.data.routes.getNodeViewPath(this.raw.NodeName);
        }

        public get lastInBuildDuration(): string {
            return TimeUtils.getDurationFromSeconds(this.raw.LastInBuildDurationInSeconds);
        }

        public get replicaRoleSortPriority(): number {
            return SortPriorities.ReplicaRolesToSortPriorities[this.raw.ReplicaRole] || 0;
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            // Refresh the parent partition here as well because we need its status to display the correct role name
            return this.parent.refresh().then(
                () => Utils.getHttpResponseData(this.data.restClient.getReplicaOnPartition(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, this.id, messageHandler)));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.address = Utils.parseReplicaAddress(this.raw.Address);
        }
    }

    export class ReplicaHealth extends HealthBase<IRawReplicaHealth> {
        public constructor(data: DataService, public parent: ReplicaOnPartition, protected eventsHealthStateFilter: HealthStateFilterFlags) {
            super(data, parent);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawReplicaHealth> {
            return Utils.getHttpResponseData(this.data.restClient.getReplicaHealth(this.parent.parent.parent.parent.id, this.parent.parent.parent.id,
                this.parent.parent.id, this.parent.id, this.eventsHealthStateFilter, messageHandler));
        }
    }
}

