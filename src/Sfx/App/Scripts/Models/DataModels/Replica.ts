//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
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
            return Utils.getHttpResponseData(this.data.restClient.getReplicaOnPartition(
                this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, this.id, messageHandler));
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

