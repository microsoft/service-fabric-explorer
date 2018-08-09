//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export enum HealthStatisticsEntityKind {
        Node,
        Application,
        Service,
        Partition,
        Replica,
        DeployedApplication,
        DepoyedServicePackage
    }

    export class ClusterHealth extends HealthBase<IRawClusterHealth> {

        private emptyHealthStateCount: IRawHealthStateCount = {
            OkCount: 0,
            ErrorCount: 0,
            WarningCount: 0
        };

        public constructor(data: DataService,
            protected eventsHealthStateFilter: HealthStateFilterFlags,
            protected nodesHealthStateFilter: HealthStateFilterFlags,
            protected applicationsHealthStateFilter: HealthStateFilterFlags) {
            super(data);
        }

        public getHealthStateCount(entityKind: HealthStatisticsEntityKind): IRawHealthStateCount {
            if (this.raw) {
                let entityHealthCount = _.find(this.raw.HealthStatistics.HealthStateCountList, item => item.EntityKind === HealthStatisticsEntityKind[entityKind]);
                if (entityHealthCount) {
                    return entityHealthCount.HealthStateCount;
                }
            }
            return this.emptyHealthStateCount;
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return Utils.getHttpResponseData(this.data.restClient.getClusterHealth(this.eventsHealthStateFilter,
                this.nodesHealthStateFilter, this.applicationsHealthStateFilter,
                messageHandler));
        }
    }

    export class ClusterManifest extends DataModelBase<IRawClusterManifest> {
        public clusterManifestName: string;

        public constructor(data: DataService) {
            super(data);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterManifest> {
            return Utils.getHttpResponseData(this.data.restClient.getClusterManifest(messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            let $xml = $($.parseXML(this.raw.Manifest));
            let $manifest = $xml.find("ClusterManifest")[0];
            this.clusterManifestName = $manifest.getAttribute("Name");
        }
    }

    export class ClusterUpgradeProgress extends DataModelBase<IRawClusterUpgradeProgress> {
        public decorators: IDecorators = {
            hideList: [
                // Unhealthy evaluations are displayed in separate section in app detail page
                "UnhealthyEvaluations"
            ],
            decorators: {
                "UpgradeDurationInMilliseconds": {
                    displayName: (name) => "Upgrade Duration",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                },
                "UpgradeDomainDurationInMilliseconds": {
                    displayName: (name) => "Upgrade Domain Duration",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                }
            }
        };

        public unhealthyEvaluations: HealthEvaluation[] = [];
        public upgradeDomains: UpgradeDomain[] = [];
        public upgradeDescription: UpgradeDescription;

        public get startTimestampUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.StartTimestampUtc);
        }

        public get failureTimestampUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.FailureTimestampUtc);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterUpgradeProgress> {
            return Utils.getHttpResponseData(this.data.restClient.getClusterUpgradeProgress(messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.unhealthyEvaluations = Utils.getParsedHealthEvaluations(this.raw.UnhealthyEvaluations);
            CollectionUtils.updateDataModelCollection(this.upgradeDomains, _.map(this.raw.UpgradeDomains, ud => new UpgradeDomain(this.data, ud)));

            if (this.raw.UpgradeDescription) {
                this.upgradeDescription = new UpgradeDescription(this.data, this.raw.UpgradeDescription);
            }
        }
    }

    export class ClusterLoadInformation extends DataModelBase<IRawClusterLoadInformation> {
        public loadMetricInformation: LoadMetricInformation[] = [];

        public get lastBalancingStartTimeUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.LastBalancingStartTimeUtc);
        }

        public get lastBalancingEndTimeUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.LastBalancingEndTimeUtc);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterLoadInformation> {
            return Utils.getHttpResponseData(this.data.restClient.getClusterLoadInformation(messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            CollectionUtils.updateDataModelCollection(this.loadMetricInformation, _.map(this.raw.LoadMetricInformation, lmi => new LoadMetricInformation(this.data, lmi)));
        }
    }
}

