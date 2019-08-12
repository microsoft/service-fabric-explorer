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

        private static certExpirationChecked = false;

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

        public checkExpiredCertStatus() {
            try{
                if(!ClusterHealth.certExpirationChecked){
                //Check cluster health
                //if healthy then no cert issue
                //if warning
                    //check if through unhealthy evaluations
                    this.ensureInitialized().then( (clusterHealth: ClusterHealth) => {
                        setTimeout( ()=> {
                            clusterHealth = this;
                            //if Error
                                //starting walking and query all nodes in warning state
                            if (clusterHealth.healthState.text === HealthStateConstants.Warning) {
                                if ( clusterHealth.unhealthyEvaluations.some(event => {
                                        if (event.raw.hasOwnProperty("UnhealthyEvent")) {
                                            //property indexing is differen then for
                                            return event.raw.UnhealthyEvent.Description.indexOf("Certificate expiration") === 0 && event.raw.UnhealthyEvent.Property === CertExpiraryHealthEventProperty.Cluster;
                                        }
                                        return false; 
                                    })
                                ){
                                    this.setMessage();
                                    ClusterHealth.certExpirationChecked = true;
                                }
                            }else if (clusterHealth.healthState.text === HealthStateConstants.Error) {
                                //only check seed nodes for a reasonable confidence of the cluster cert state
                                this.data.getNodes(true).then(nodes => {
                                    let seedNodes = _.filter(nodes.collection, node => node.raw.IsSeedNode);
                                    this.checkNodesContinually(0, seedNodes);
                                });
                            }else{
                                ClusterHealth.certExpirationChecked = true;
                            }
                        })
                    });
                }
            }catch(e){
                console.log(e);
            }
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

        private setMessage(): void {
            this.data.warnings.addOrUpdateNotification({
                message: "A cluster certificate for this cluster is set to expire. Replace it as soon as possible.",
                level: StatusWarningLevel.Error,
                priority: 5,
                id: BannerWarningID.ExpiringClusterCert
            });
            ClusterHealth.certExpirationChecked = true;
        }

        private containsCertExpiringHealthEvent(unhealthyEvaluations: HealthEvent[]): boolean {
            return unhealthyEvaluations.some(event => event.raw.Description.indexOf("Certificate expiration") === 0 && event.raw.Property === CertExpiraryHealthEventProperty.Cluster);
        }

        private checkNodesContinually(index: number, nodes: Node[]) {
            if (index < nodes.length) {
                const node = nodes[index];
                console.log("checking node " + node.name);
                if(node.healthState.text === HealthStateConstants.Error || node.healthState.text === HealthStateConstants.Warning) {
                    node.health.ensureInitialized().then( () => {
                        if(!this.containsCertExpiringHealthEvent(node.health.healthEvents)) {
                            this.checkNodesContinually(index + 1, nodes);
                        }else {
                            this.setMessage();
                        }
                    });
                }else{
                    this.checkNodesContinually(index + 1, nodes);
                }
            }else{
                ClusterHealth.certExpirationChecked = true;
            }
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return Utils.getHttpResponseData(this.data.restClient.getClusterHealth(this.eventsHealthStateFilter,
                this.nodesHealthStateFilter, this.applicationsHealthStateFilter,
                messageHandler));
        }
    }

    export class ClusterManifest extends DataModelBase<IRawClusterManifest> {
        public clusterManifestName: string;
        private _imageStoreConnectionString: string;
        private _isNetworkInventoryManagerEnabled: boolean = false;

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
            let $imageStoreConnectionStringParameter = $("Section[Name='Management'] > Parameter[Name='ImageStoreConnectionString']", $manifest);
            if ($imageStoreConnectionStringParameter.length > 0) {
                this._imageStoreConnectionString = $imageStoreConnectionStringParameter.attr("Value");
            }

            let $nimEnabledParameter = $("Section[Name=NetworkInventoryManager] > Parameter[Name='IsEnabled']", $manifest);
            if ($nimEnabledParameter.length > 0) {
                this._isNetworkInventoryManagerEnabled = $nimEnabledParameter.attr("Value").toLowerCase() === "true";
            }
        }

        public get isNetworkInventoryManagerEnabled(): boolean {
            return this._isNetworkInventoryManagerEnabled;
        }

        public get imageStoreConnectionString(): string {
            return this._imageStoreConnectionString;
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

        public get isUpgrading(): boolean {
            return UpgradeDomainStateRegexes.InProgress.test(this.raw.UpgradeState);
        }

        public get startTimestampUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.StartTimestampUtc);
        }

        public get failureTimestampUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.FailureTimestampUtc);
        }

        public get upgradeDuration(): string {
            return TimeUtils.getDuration(this.raw.UpgradeDurationInMilliseconds);
        }

        public get upgradeDomainDuration(): string {
            return TimeUtils.getDuration(this.raw.UpgradeDomainDurationInMilliseconds);
        }

        public getCompletedUpgradeDomains(): number {
            return _.filter(this.upgradeDomains, upgradeDomain => {return upgradeDomain.stateName === UpgradeDomainStateNames.Completed; }).length;
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawClusterUpgradeProgress> {
            return this.data.$q( (resolve, reject) => {
                Utils.getHttpResponseData(this.data.restClient.getClusterUpgradeProgress(messageHandler)).then(data => {

                    //if the code version is "0.0.0.0" this means there has not been a baseline upgrade and will require querying for the actual code versin of the cluster
                    if (data.CodeVersion === "0.0.0.0") {
                        Utils.getHttpResponseData(this.data.restClient.getClusterVersion())
                        .then(resp => {
                            //set codeVersion here, essentially swapping it out
                            data.CodeVersion = resp.Version;
                        }).finally( () => {
                            resolve(data);
                        });

                    }else {
                        resolve(data);
                    }
                });
            });

        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.unhealthyEvaluations = Utils.getParsedHealthEvaluations(this.raw.UnhealthyEvaluations, null, null, this.data);
            let domains = _.map(this.raw.UpgradeDomains, ud => new UpgradeDomain(this.data, ud));
            let groupedDomains = _.filter(domains, ud => ud.stateName === UpgradeDomainStateNames.Completed)
                .concat(_.filter(domains, ud => ud.stateName === UpgradeDomainStateNames.InProgress))
                .concat(_.filter(domains, ud => ud.name === this.raw.NextUpgradeDomain))
                .concat(_.filter(domains, ud => ud.stateName === UpgradeDomainStateNames.Pending && ud.name !== this.raw.NextUpgradeDomain));

            this.upgradeDomains = groupedDomains;

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

