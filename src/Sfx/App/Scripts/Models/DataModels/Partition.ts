//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class Partition extends DataModelBase<IRawPartition> {
        public partitionInformation: PartitionInformation;
        public replicas: ReplicaOnPartitionCollection;
        public loadInformation: PartitionLoadInformation;
        public health: PartitionHealth;

        public constructor(data: DataService, raw: IRawPartition, public parent: Service) {
            super(data, raw, parent);

            this.partitionInformation = new PartitionInformation(this.data, raw.PartitionInformation);
            this.replicas = new ReplicaOnPartitionCollection(this.data, this);
            this.loadInformation = new PartitionLoadInformation(this.data, this);
            this.health = new PartitionHealth(this.data, this, HealthStateFilterFlags.Default, HealthStateFilterFlags.None);
        }

        public get isStatefulService(): boolean {
            return ServiceKindRegexes.Stateful.test(this.raw.ServiceKind);
        }

        public get isStatelessService(): boolean {
            return ServiceKindRegexes.Stateless.test(this.raw.ServiceKind);
        }

        public get id(): string {
            return this.partitionInformation.id;
        }

        public get name(): string {
            return this.raw.PartitionInformation.Name || this.raw.PartitionInformation.Id;
        }

        public get viewPath(): string {
            return this.data.routes.getPartitionViewPath(this.parent.parent.raw.TypeName, this.parent.parent.id, this.parent.id, this.id);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartition> {
            return Utils.getHttpResponseData(this.data.restClient.getPartition(this.parent.parent.id, this.parent.id, this.id, messageHandler));
        }
    }

    export class PartitionHealth extends HealthBase<IRawPartitionHealth> {
        public constructor(data: DataService, public parent: Partition,
            protected eventsHealthStateFilter: HealthStateFilterFlags,
            protected replicasHealthStateFilter: HealthStateFilterFlags) {
            super(data, parent);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionHealth> {
            return Utils.getHttpResponseData(this.data.restClient.getPartitionHealth(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id,
                this.eventsHealthStateFilter, this.replicasHealthStateFilter, messageHandler));
        }
    }

    export class PartitionInformation extends DataModelBase<IRawPartitionInformation> {
        public constructor(data: DataService, raw: IRawPartitionInformation) {
            super(data, raw);
        }

        public get isPartitionKindInt64Range(): boolean {
            return ServicePartitionKindRegexes.Int64Range.test(this.raw.ServicePartitionKind);
        }

        public get isPartitionKindNamed(): boolean {
            return ServicePartitionKindRegexes.Named.test(this.raw.ServicePartitionKind);
        }
    }

    export class PartitionLoadInformation extends DataModelBase<IRawPartitionLoadInformation> {
        public decorators: IDecorators = {
            hideList: ["PartitionId"]
        };

        public primaryLoadMetricReports: LoadMetricReport[] = [];
        public secondaryLoadMetricReports: LoadMetricReport[] = [];

        public constructor(data: DataService, public parent: Partition) {
            super(data, null, parent);
        }

        public get isValid(): boolean {
            return this.isInitialized && (this.primaryLoadMetricReports.length > 0 || this.secondaryLoadMetricReports.length > 0);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionLoadInformation> {
            return Utils.getHttpResponseData(this.data.restClient.getPartitionLoadInformation(
                this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.primaryLoadMetricReports = _.map(this.raw.PrimaryLoadMetricReports, report => new LoadMetricReport(this.data, report));
            this.secondaryLoadMetricReports = _.map(this.raw.SecondaryLoadMetricReports, report => new LoadMetricReport(this.data, report));
        }
    }

    export class LoadMetricReport extends DataModelBase<IRawLoadMetricReport> {
        public constructor(data: DataService, raw: IRawLoadMetricReport) {
            super(data, raw);
        }

        public get lastReportedUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.LastReportedUtc);
        }
    }
}

