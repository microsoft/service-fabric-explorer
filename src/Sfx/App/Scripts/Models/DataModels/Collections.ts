//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDataModelCollection<T extends IDataModel<any>> {
        // The real collection wrapped
        collection: T[];

        // The length of current collection
        length: number;

        // Indicates if the collection has been initialized (refreshed at least one time)
        isInitialized: boolean;

        // Indicates if the current collection is refreshing (calling REST API to update the raw object)
        isRefreshing: boolean;

        // The relative URL of this collection page
        viewPath: string;

        // Find the entity from current collection by unique ID
        find(uniqueId: string): T;

        // Invokes service fabric REST API to retrieve updated version of this collection
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;

        // If current entity is not initialized, call refresh to get the object from server, or return the cached version of the object.
        ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any>;

        // Find and merge the health chunk data into current collection
        mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any>;
    }

    export class CancelablePromise<T> {
        private defer: angular.IDeferred<T> = null;

        public constructor(private $q: angular.IQService) {
        }

        public load(loadHandler: () => angular.IPromise<T>): angular.IPromise<T> {
            if (this.hasPromise()) {
                this.cancel();
            }

            this.defer = this.$q.defer<T>();
            this.executeInternal(loadHandler);
            return this.getPromise();
        }

        public hasPromise(): boolean {
            return this.defer !== null;
        }

        public getPromise(): angular.IPromise<T> {
            if (!this.hasPromise()) {
                return null;
            }
            return this.defer.promise;
        }

        public cancel(): void {
            if (this.hasPromise()) {
                this.defer.reject({ isCanceled: true });
                this.defer = null;
            }
        }

        private executeInternal(loadHandler: () => angular.IPromise<T>): void {
            let capturedDefer = this.defer;
            loadHandler().then(result => {
                if (this.defer === capturedDefer) {
                    this.defer.resolve(result);
                }
            }).catch((rejected) => {
                if (this.defer === capturedDefer) {
                    this.defer.reject(rejected);
                }
            }).finally(() => {
                if (this.defer === capturedDefer) {
                    this.defer = null;
                }
            });
        }
    }

    export class DataModelCollectionBase<T extends IDataModel<any>> implements IDataModelCollection<T> {
        public isInitialized: boolean = false;
        public parent: any;
        public collection: T[] = [];

        protected valueResolver: ValueResolver = new ValueResolver();

        private appendOnly: boolean;
        private hash: _.Dictionary<T>;
        private refreshingLoadPromise: CancelablePromise<T[]>;
        private refreshingPromise: angular.IPromise<any>;

        public get viewPath(): string {
            return "";
        }

        public get length(): number {
            return this.collection.length;
        }

        public get isRefreshing(): boolean {
            return !!this.refreshingPromise;
        }

        protected get indexPropery(): string {
            // index the collection by "uniqueId" by default
            return "uniqueId";
        }

        public constructor(public data: DataService, parent?: any, appendOnly: boolean = false) {
            this.parent = parent;
            this.appendOnly = appendOnly;
            this.refreshingLoadPromise = new CancelablePromise(this.data.$q);
        }

        // Base refresh logic, do not override
        public refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (!this.refreshingPromise) {
                this.refreshingPromise =
                    this.refreshingLoadPromise.load(() => {
                        return this.retrieveNewCollection(messageHandler);
                    }).catch((error) => {
                        if (error && error.isCanceled !== true) {
                            throw error;
                        }
                        // Else skipping as load got canceled.
                        return this.data.$q.when(null);
                    }).then(collection => {
                        if (collection) {
                            return this.update(collection);
                        }
                    }).then(() => {
                        return this;
                    }).finally(() => {
                        this.refreshingPromise = null;
                    });
            }
            return this.refreshingPromise;
        }

        public clear(): angular.IPromise<any> {
            this.cancelLoad();
            return this.data.$q.when(this.refreshingPromise ? this.refreshingPromise : true).then(() => {
                this.collection = [];
                this.isInitialized = false;
            });
        }

        protected cancelLoad(): void {
            if (this.refreshingLoadPromise.hasPromise()) {
                this.refreshingLoadPromise.cancel();
            }
        }

        protected update(collection: T[]): angular.IPromise<any> {
            this.isInitialized = true;
            CollectionUtils.updateDataModelCollection(this.collection, collection, this.appendOnly);
            this.hash = _.keyBy(this.collection, this.indexPropery);
            return this.data.$q.when(this.updateInternal());
        }

        public ensureInitialized(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (!this.isInitialized || forceRefresh) {
                return this.refresh(messageHandler);
            }
            return this.data.$q.when(this);
        }

        public find(uniqueId: string): T {
            if (this.hash) {
                return this.hash[uniqueId];
            }
            return null;
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            return this.data.$q.when(true);
        }

        // All derived class should override this function to do custom refreshing
        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<T[]> {
            return this.data.$q.reject();
        }

        // Derived class should override this function to do custom updating
        protected updateInternal(): angular.IPromise<any> | void {
            return this.data.$q.when(true);
        }

        protected updateCollectionFromHealthChunkList<P extends IHealthStateChunk>(
            healthChunkList: IHealthStateChunkList<P>,
            newIdSelector: (item: P) => string): angular.IPromise<any> {

            if (!CollectionUtils.compareCollectionsByKeys(this.collection, healthChunkList.Items, item => item[this.indexPropery], newIdSelector)) {
                if (!this.isRefreshing) {
                    // If the health chunk data has different set of keys, refresh the entire collection
                    // to get full information of the new items.
                    return this.refresh();
                } else {
                    return this.data.$q.when(true);
                }
            }

            // Merge health chunk data
            let updatePromises = [];
            CollectionUtils.updateCollection<T, P>(
                this.collection,
                healthChunkList.Items,
                item => item[this.indexPropery],
                newIdSelector,
                null, // no need to create object because a full refresh will be scheduled when new object is returned by health chunk API,
                // which is needed because the information returned by the health chunk api is not enough for us to create a full data object.
                (item: T, newItem: P) => {
                    updatePromises.push(item.mergeHealthStateChunk(newItem));
                });

            return this.data.$q.all(updatePromises);
        }

        // Derived class should implement this if it is going to use details-view directive as child and call showDetails(itemId).
        protected getDetailsList(item: any): IDataModelCollection<any> {
            return null;
        }
    }

    export class NodeCollection extends DataModelCollectionBase<Node> {
        public healthState: ITextAndBadge;
        public upgradeDomains: string[];
        public faultDomains: string[];
        public healthySeedNodes: string;
        public disabledNodes: string;
        public seedNodeCount: number;

        public constructor(data: DataService) {
            super(data);
        }

        public get viewPath(): string {
            return this.data.routes.getNodesViewPath();
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            return this.updateCollectionFromHealthChunkList(clusterHealthChunk.NodeHealthStateChunks, item => IdGenerator.node(item.NodeName)).then(() => {
                this.updateNodesHealthState();
            });
        }

        public getNodeStateCounts(): INodesStatusDetails[] {
            let counts = {};
            let allNodes = new NodeStatusDetails("All nodes");
            let seedNodes = new NodeStatusDetails("Seed Nodes");

            this.collection.forEach(node => {
                if (node.raw.IsSeedNode) {
                    seedNodes.add(node);
                }
                if (!(node.raw.Type in counts)) {
                    counts[node.raw.Type] = new NodeStatusDetails(node.raw.Type);
                }
                counts[node.raw.Type].add(node);
                allNodes.add(node);
            });
            return [allNodes, seedNodes].concat(Object.keys(counts).map(key => counts[key]));
        }

        public setAdvancedMode(state: boolean): void {
            this.collection.forEach( node => {
                node.removeAdvancedActions();
                if (state) {
                    node.setAdvancedActions();
                }
            });
        }

        protected get indexPropery(): string {
            // node should be indexed by name
            return "name";
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getNodes(messageHandler).then(items => {
                return _.map(items, raw => new Node(this.data, raw));
            });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.updateNodesHealthState();

            this.faultDomains = _.map(this.collection, node => node.raw.FaultDomain);
            this.faultDomains = _.uniq(this.faultDomains).sort();

            this.upgradeDomains = _.map(this.collection, node => node.raw.UpgradeDomain);
            this.upgradeDomains = _.uniq(this.upgradeDomains).sort();

            let seedNodes = _.filter(this.collection, node => node.raw.IsSeedNode);
            let healthyNodes = _.filter(seedNodes, node => node.healthState.text === HealthStateConstants.OK);

            let disabledNodes = 0;
            let disablingNodes = 0;

            this.collection.forEach(node => {
                if (node.raw.NodeStatus === NodeStatusConstants.Disabled) {
                    disabledNodes++;
                }
                if (node.raw.NodeStatus === NodeStatusConstants.Disabling) {
                    disablingNodes++;
                }
            });

            this.disabledNodes = `${disabledNodes}/${disablingNodes}`;
            this.seedNodeCount = seedNodes.length;

            this.checkSeedNodeCount(this.seedNodeCount);
            this.checkOneNodeScenario();

            this.healthySeedNodes = seedNodes.length.toString() + " (" +
                Math.round(healthyNodes.length / seedNodes.length * 100).toString() + "%)";
        }

        private checkSeedNodeCount(count: number) {
            //if < 5 seed nodes display warning
            //if count is 1, it is one box/test only scenario
            if (count < 5 && count !== 1) {
                this.data.warnings.addOrUpdateNotification({
                    message: "Cluster is degraded because it does not have 5 seed nodes. See link for more details",
                    level: StatusWarningLevel.Error,
                    priority: 2,
                    id: BannerWarningID.ClusterDegradedState,
                    link: "https://aka.ms/servicefabric/durability"
                });
            }else {
                this.data.warnings.removeNotificationById(BannerWarningID.ClusterDegradedState);
            }
        }

        private checkOneNodeScenario(): void {
            if (this.collection.length === 1) {
                this.data.warnings.addOrUpdateNotification({
                    message: "One node cluster is considered test and can not perform cluster upgrades.",
                    level: StatusWarningLevel.Info,
                    priority: 1,
                    id: BannerWarningID.OneNodeCluster,
                    link: "https://aka.ms/servicefabric/durability"
                });
            }else {
                this.data.warnings.removeNotificationById(BannerWarningID.OneNodeCluster);
            }
        }

        private updateNodesHealthState(): void {
            // calculates the nodes health state which is the max state value of all nodes
            this.healthState = this.valueResolver.resolveHealthStatus(_.max(_.map(this.collection, node => HealthStateConstants.Values[node.healthState.text])));
        }
    }

    export class NetworkCollection extends DataModelCollectionBase<Network> {
        public constructor(data: DataService) {
            super(data);
        }

        public get viewPath(): string {
            return this.data.routes.getNetworksViewPath();
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getNetworks(messageHandler).then(items => {
                return _.map(items, raw => new Network(this.data, raw));
            });
        }
    }

    export class NetworkOnAppCollection extends DataModelCollectionBase<NetworkOnApp> {
        appId: string;
        public constructor(data: DataService, appId: string) {
            super(data);
            this.appId = appId;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let collection = [];
            return this.data.restClient.getNetworksOnApp(this.appId, messageHandler).then(items => {
                let tasks = _.map(items, raw => {
                    let network = new NetworkOnApp(this.data, raw);
                    return network.refresh().then(() => collection.push(network));
                });
                return this.data.$q.all(tasks).then(() => collection);
            });
        }
    }

    export class NetworkOnNodeCollection extends DataModelCollectionBase<NetworkOnNode> {
        nodeName: string;
        public constructor(data: DataService, nodeName: string) {
            super(data);
            this.nodeName = nodeName;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let collection = [];
            return this.data.restClient.getNetworksOnNode(this.nodeName, messageHandler).then(items => {
                let filtered = _.filter(items, item => { return item.NetworkName !== "servicefabric_network"; });
                let tasks = _.map(filtered, raw => {
                    let network = new NetworkOnNode(this.data, raw);
                    return network.refresh().then(() => collection.push(network));
                });
                return this.data.$q.all(tasks).then(() => collection);
            });
        }
    }

    export class AppOnNetworkCollection extends DataModelCollectionBase<AppOnNetwork> {
        networkName: string;
        public constructor(data: DataService, networkName: string) {
            super(data);
            this.networkName = networkName;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let collection = [];
            return this.data.restClient.getAppsOnNetwork(this.networkName, messageHandler).then(items => {
                let tasks = _.map(items, raw => {
                    let application = new AppOnNetwork(this.data, raw);
                    return application.refresh().then(() => collection.push(application));
                });

                return this.data.$q.all(tasks).then(() => collection);
            });
        }
    }

    export class NodeOnNetworkCollection extends DataModelCollectionBase<NodeOnNetwork> {
        networkName: string;
        public constructor(data: DataService, networkName: string) {
            super(data);
            this.networkName = networkName;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let collection = [];
            return this.data.restClient.getNodesOnNetwork(this.networkName, messageHandler).then(items => {
                let tasks = _.map(items, raw => {
                    let node = new NodeOnNetwork(this.data, raw);
                    return node.refresh().then(() => {
                        collection.push(node);
                    });

                });
                return this.data.$q.all(tasks).then(() => collection);
            });
        }
    }

    export class DeployedContainerOnNetworkCollection extends DataModelCollectionBase<DeployedContainerOnNetwork> {
        networkName: string;
        public constructor(data: DataService, networkName: string) {
            super(data);
            this.networkName = networkName;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getNodesOnNetwork(this.networkName, messageHandler).then(items => {
                let result: DeployedContainerOnNetwork[] = new Array();
                let promises = [];
                _.each(items, raw => {
                    promises.push(this.data.restClient.getDeployedContainersOnNetwork(this.networkName, raw.nodeName, messageHandler).then(values => {
                        _.each(values, value => {
                            result.push(new DeployedContainerOnNetwork(this.data, raw.nodeName, value));
                        });
                    }));
                });
                return this.data.$q.all(promises).then(values => {
                    return result;
                });

            });
        }
    }

    export class ApplicationCollection extends DataModelCollectionBase<Application> {
        public upgradingAppCount: number = 0;
        public healthState: ITextAndBadge;

        public constructor(data: DataService) {
            super(data);
        }

        public get viewPath(): string {
            return this.data.routes.getAppsViewPath();
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            return this.updateCollectionFromHealthChunkList(clusterHealthChunk.ApplicationHealthStateChunks, item => IdGenerator.app(IdUtils.nameToId(item.ApplicationName))).then(() => {
                this.updateAppsHealthState();
                return this.refreshAppTypeGroups();
            });
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getApplications(messageHandler).then(items => {
                return _.map(items, raw => new Application(this.data, raw));
            });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.upgradingAppCount = _.filter(this.collection, (app) => app.isUpgrading).length;
            this.updateAppsHealthState();
            return this.refreshAppTypeGroups();
        }

        private updateAppsHealthState(): void {
            // calculates the applications health state which is the max state value of all applications
            this.healthState = this.length > 0
                ? this.valueResolver.resolveHealthStatus(_.max(_.map(this.collection, app => HealthStateConstants.Values[app.healthState.text])))
                : ValueResolver.healthStatuses[1];
        }

        private refreshAppTypeGroups(): angular.IPromise<any> {
            // updates applications list in each application type group to keep them in sync.
            return this.data.getAppTypeGroups(false).then(appTypeGroups => {
                _.each(appTypeGroups.collection, appTypeGroup => appTypeGroup.refreshAppTypeApps(this));
            });
        }
    }

    export class ApplicationTypeGroupCollection extends DataModelCollectionBase<ApplicationTypeGroup> {
        public constructor(data: DataService) {
            super(data);
        }

        public get viewPath(): string {
            return this.data.routes.getAppTypesViewPath();
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getApplicationTypes(null, messageHandler)
                .then(response => {
                    let appTypes = _.map(response.data, item => new ApplicationType(this.data, item));
                    let groups = _.groupBy(appTypes, item => item.raw.Name);
                    return _.map(groups, g => new ApplicationTypeGroup(this.data, g));
                });
        }
    }

    export class ServiceTypeCollection extends DataModelCollectionBase<ServiceType> {
        public constructor(data: DataService, public parent: ApplicationType | Application) {
            super(data, parent);
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let appTypeName = null;
            let appTypeVersion = null;
            if (this.parent instanceof ApplicationType) {
                appTypeName = (<ApplicationType>(this.parent)).raw.Name;
                appTypeVersion = (<ApplicationType>(this.parent)).raw.Version;
            } else {
                appTypeName = (<Application>(this.parent)).raw.TypeName;
                appTypeVersion = (<Application>(this.parent)).raw.TypeVersion;
            }

            return this.data.restClient.getServiceTypes(appTypeName, appTypeVersion, messageHandler)
                .then(response => {
                    return _.map(response.data, raw => new ServiceType(this.data, raw, this.parent));
                });
        }
    }

    export class ServiceCollection extends DataModelCollectionBase<Service> {
        public constructor(data: DataService, public parent: Application) {
            super(data, parent);
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            let serviceHealthStateChunks = null;
            if (this.parent.name === Constants.SystemAppName) {
                serviceHealthStateChunks = clusterHealthChunk.SystemApplicationHealthStateChunk.ServiceHealthStateChunks;
            } else {
                let appHealthChunk = _.find(clusterHealthChunk.ApplicationHealthStateChunks.Items,
                    item => item.ApplicationName === this.parent.name);
                if (appHealthChunk) {
                    serviceHealthStateChunks = appHealthChunk.ServiceHealthStateChunks;
                }
            }
            if (serviceHealthStateChunks) {
                return this.updateCollectionFromHealthChunkList<IServiceHealthStateChunk>(serviceHealthStateChunks, item => IdGenerator.service(IdUtils.nameToId(item.ServiceName)));
            }
            return this.data.$q.when(true);
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getServices(this.parent.id, messageHandler)
                .then(items => {
                    return _.map(items, raw => new Service(this.data, raw, this.parent));
                });
        }
    }

    export class PartitionCollection extends DataModelCollectionBase<Partition> {
        public constructor(data: DataService, public parent: Service) {
            super(data, parent);
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            let appHealthChunk = _.find(clusterHealthChunk.ApplicationHealthStateChunks.Items,
                item => item.ApplicationName === this.parent.parent.name);
            if (appHealthChunk) {
                let serviceHealthChunk = _.find(appHealthChunk.ServiceHealthStateChunks.Items,
                    item => item.ServiceName === this.parent.name);
                if (serviceHealthChunk) {
                    return this.updateCollectionFromHealthChunkList(serviceHealthChunk.PartitionHealthStateChunks, item => IdGenerator.partition(item.PartitionId));
                }
            }
            return this.data.$q.when(true);
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getPartitions(this.parent.parent.id, this.parent.id, messageHandler)
                .then(items => {
                    return _.map(items, raw => new Partition(this.data, raw, this.parent));
                });
        }
    }

    export class ReplicaOnPartitionCollection extends DataModelCollectionBase<ReplicaOnPartition> {
        public constructor(data: DataService, public parent: Partition) {
            super(data, parent);
        }

        public get isStatefulService(): boolean {
            return this.parent.isStatefulService;
        }

        public get isStatelessService(): boolean {
            return this.parent.isStatelessService;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getReplicasOnPartition(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, messageHandler)
                .then(items => {
                    return _.map(items, raw => new ReplicaOnPartition(this.data, raw, this.parent));
                });
        }
    }

    export class DeployedApplicationCollection extends DataModelCollectionBase<DeployedApplication> {
        public constructor(data: DataService, public parent: Node) {
            super(data, parent);
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            let nodeHealthChunk = _.find(clusterHealthChunk.NodeHealthStateChunks.Items, chunk => chunk.NodeName === this.parent.name);
            if (nodeHealthChunk) {
                return this.updateCollectionFromHealthChunkList<IDeployedApplicationHealthStateChunk>(
                    nodeHealthChunk.DeployedApplicationHealthStateChunks,
                    item => IdGenerator.deployedApp(IdUtils.nameToId(item.ApplicationName)));
            }
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getDeployedApplications(this.parent.name, messageHandler)
                .then((raw: any) => {
                    let rawApps: IRawDeployedApplication[] = raw.data;
                    return _.map(rawApps, rawApp => new DeployedApplication(this.data, rawApp, this.parent));
                });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            // The deployed application does not include "HealthState" information by default.
            // Trigger a health chunk query to fill the health state information.
            if (this.length > 0) {
                let healthChunkQueryDescription = this.data.getInitialClusterHealthChunkQueryDescription();
                this.parent.addHealthStateFiltersForChildren(healthChunkQueryDescription);
                return this.data.getClusterHealthChunk(healthChunkQueryDescription).then(healthChunk => {
                    return this.mergeClusterHealthStateChunk(healthChunk);
                });
            }
        }
    }

    export class DeployedServicePackageCollection extends DataModelCollectionBase<DeployedServicePackage> {
        public constructor(data: DataService, public parent: DeployedApplication) {
            super(data, parent);
        }

        public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): angular.IPromise<any> {
            let appHealthChunk = _.find(clusterHealthChunk.ApplicationHealthStateChunks.Items,
                item => item.ApplicationName === this.parent.name);
            if (appHealthChunk) {
                let deployedAppHealthChunk = _.find(appHealthChunk.DeployedApplicationHealthStateChunks.Items,
                    deployedAppHealthChunk => deployedAppHealthChunk.NodeName === this.parent.parent.name);
                if (deployedAppHealthChunk) {
                    return this.updateCollectionFromHealthChunkList<IDeployedServicePackageHealthStateChunk>(
                        deployedAppHealthChunk.DeployedServicePackageHealthStateChunks,
                        item => IdGenerator.deployedServicePackage(item.ServiceManifestName, item.ServicePackageActivationId));
                }
            }
            return this.data.$q.when(true);
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getDeployedServicePackages(this.parent.parent.name, this.parent.id, messageHandler)
                .then((raw: any) => {
                    let rawServicePackages: IRawDeployedServicePackage[] = raw.data;
                    return _.map(rawServicePackages, rawServicePackage => new DeployedServicePackage(this.data, rawServicePackage, this.parent));
                });
        }

        protected updateInternal(): angular.IPromise<any> | void {
            // The deployed application does not include "HealthState" information by default.
            // Trigger a health chunk query to fill the health state information.
            if (this.length > 0) {
                let healthChunkQueryDescription = this.data.getInitialClusterHealthChunkQueryDescription();
                this.parent.addHealthStateFiltersForChildren(healthChunkQueryDescription);
                return this.data.getClusterHealthChunk(healthChunkQueryDescription).then(healthChunk => {
                    return this.mergeClusterHealthStateChunk(healthChunk);
                });
            }
        }
    }

    export class DeployedCodePackageCollection extends DataModelCollectionBase<DeployedCodePackage> {
        public constructor(data: DataService, public parent: DeployedServicePackage) {
            super(data, parent);
        }

        public get viewPath(): string {
            return this.data.routes.getDeployedCodePackagesViewPath(this.parent.parent.parent.name, this.parent.parent.id, this.parent.id, this.parent.servicePackageActivationId);
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getDeployedCodePackages(this.parent.parent.parent.name, this.parent.parent.id, this.parent.name, messageHandler)
                .then(response => {
                    return _.map(_.filter(response.data, raw => raw.ServicePackageActivationId === this.parent.servicePackageActivationId),
                        raw => new DeployedCodePackage(this.data, raw, this.parent));
                });
        }
    }

    export class DeployedReplicaCollection extends DataModelCollectionBase<DeployedReplica> {
        public constructor(data: DataService, public parent: DeployedServicePackage) {
            super(data, parent);
        }

        public get viewPath(): string {
            return this.data.routes.getDeployedReplicasViewPath(this.parent.parent.parent.name, this.parent.parent.id, this.parent.id, this.parent.servicePackageActivationId);
        }

        public get isStatefulService(): boolean {
            return this.length > 0 && _.first(this.collection).isStatefulService;
        }

        public get isStatelessService(): boolean {
            return this.length > 0 && _.first(this.collection).isStatelessService;
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getDeployedReplicas(this.parent.parent.parent.name, this.parent.parent.id, this.parent.name, messageHandler)
                .then(response => {
                    return _.map(_.filter(response.data, raw => raw.ServicePackageActivationId === this.parent.servicePackageActivationId),
                        raw => new DeployedReplica(this.data, raw, this.parent));
                });
        }
    }

    export abstract class EventListBase<T extends FabricEventBase> extends DataModelCollectionBase<FabricEventInstanceModel<T>> {
        public readonly settings: ListSettings;
        public readonly detailsSettings: ListSettings;
        // This will skip refreshing if period is set to be too quick by user, as currently events
        // requests take ~3 secs, and so we shouldn't be delaying every global refresh.
        public readonly minimumRefreshTimeInSecs: number = 10;
        public readonly pageSize: number = 15;
        public readonly defaultDateWindowInDays: number = 2;
        public readonly latestRefreshPeriodInSecs: number = 60 * 60;

        protected readonly optionalColsStartIndex: number = 2;

        private lastRefreshTime?: Date;
        private _startDate: Date;
        private _endDate: Date;

        public get startDate() {
            return new Date(this._startDate.valueOf());
        }
        public get endDate() {
            let endDate = new Date(this._endDate.valueOf());
            let timeNow = new Date();
            if (endDate > timeNow) {
                endDate = timeNow;
            }

            return endDate;
        }

        public get queryStartDate() {
            if (this.isInitialized) {
                // Only retrieving the latest, including a period that allows refreshing
                // previously retrieved events with new correlation information if any.
                if ((this.endDate.getTime() - this.startDate.getTime()) / 1000 > this.latestRefreshPeriodInSecs) {
                    return TimeUtils.AddSeconds(this.endDate, (-1 * this.latestRefreshPeriodInSecs));
                }
            }

            return this.startDate;
        }
        public get queryEndDate() { return this.endDate; }

        public constructor(data: DataService, startDate?: Date, endDate?: Date) {
            // Using appendOnly, because we refresh by retrieving latest,
            // and collection gets cleared when dates window changes.
            super(data, null, true);
            this.settings = this.createListSettings();
            this.detailsSettings = this.createListSettings();

            // Add correlated event col.
            let correlatedEventsCol = new ListColumnSetting(
                "#CorrelatedEvents",
                "",
                [],
                null,
                (item) => HtmlUtils.getEventDetailsViewLinkHtml(item.raw));
            correlatedEventsCol.fixedWidthPx = 40;
            this.settings.columnSettings.splice(1, 0, correlatedEventsCol);

            this.setNewDateWindowInternal(startDate, endDate);
        }

        public setDateWindow(startDate?: Date, endDate?: Date): boolean {
            return this.setNewDateWindowInternal(startDate, endDate);
        }

        public resetDateWindow(): boolean {
            return this.setDateWindow(null, null);
        }

        public reload(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            this.lastRefreshTime = null;
            return this.clear().then(() => {
                return this.refresh(messageHandler);
            });
        }

        protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            // Use existing collection if a refresh is called in less than minimumRefreshTimeInSecs.
            if (this.lastRefreshTime &&
                (new Date().getTime() - this.lastRefreshTime.getTime()) < (this.minimumRefreshTimeInSecs * 1000)) {
                return this.data.$q.when(this.collection);
            }

            this.lastRefreshTime = new Date();
            return this.retrieveEvents(messageHandler);
        }

        protected getDetailsList(item: any): IDataModelCollection<any> {
            return this.data.createCorrelatedEventList(item.raw.eventInstanceId);
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<T>[]> {
            // Should be overriden to retrieve actual events.
            return this.data.$q.when([]);
        }

        private createListSettings(): ListSettings {
            let listSettings = new ListSettings(
                this.pageSize,
                ["raw.timeStamp"],
                [new ListColumnSetting(
                    "raw.kind",
                    "Type",
                    ["raw.kind"],
                    true,
                    (item) => HtmlUtils.getEventNameHtml(item.raw)),
                new ListColumnSetting(
                    "raw.category",
                    "Event Category",
                    ["raw.category"],
                    true,
                    (item) => (!item.raw.category ? "Operational" : item.raw.category)),
                new ListColumnSetting("raw.timeStampString", "Timestamp"), ],
                [new ListColumnSetting(
                    "raw.eventInstanceId",
                    "",
                    [],
                    null,
                    (item) => HtmlUtils.getEventSecondRowHtml(item.raw),
                    -1), ],
                true,
                (item) => (Object.keys(item.raw.eventProperties).length > 0),
                true);

            listSettings.columnSettings[0].fixedWidthPx = 320;
            listSettings.columnSettings[1].fixedWidthPx = 200;
            listSettings.sortReverse = true;

            return listSettings;
        }

        private setNewDateWindowInternal(startDate?: Date, endDate?: Date): boolean {
            if (!startDate) {
                startDate = TimeUtils.AddDays(
                    endDate ? endDate : new Date(),
                    (-1 * this.defaultDateWindowInDays));
            }

            if (!endDate) {
                endDate = TimeUtils.AddDays(
                    startDate,
                    this.defaultDateWindowInDays);
            }

            let bodStartDate = new Date(startDate.valueOf());
            let eodEndDate = new Date(endDate.valueOf());
            bodStartDate.setHours(0, 0, 0, 0);
            eodEndDate.setHours(23, 59, 59, 999);
            if (!this._startDate || this._startDate.getTime() !== bodStartDate.getTime() ||
                !this._endDate || this._endDate.getTime() !== eodEndDate.getTime()) {
                this._startDate = bodStartDate;
                this._endDate = eodEndDate;
                return true;
            }

            return false;
        }
    }

    export class ClusterEventList extends EventListBase<ClusterEvent> {
        public constructor(data: DataService, partitionId?: string) {
            super(data);
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ClusterEvent>[]> {
            return this.data.restClient.getClusterEvents(this.queryStartDate, this.queryEndDate, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<ClusterEvent>(this.data, event));
                });
        }
    }

    export class NodeEventList extends EventListBase<NodeEvent> {
        private nodeName?: string;

        public constructor(data: DataService, nodeName?: string) {
            super(data);
            this.nodeName = nodeName;
            if (!this.nodeName) {
                // Show NodeName as the second column.
                this.settings.columnSettings.splice(
                    this.optionalColsStartIndex,
                    0,
                    new ListColumnSettingWithFilter(
                        "raw.nodeName",
                        "Node Name"));
            }
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<NodeEvent>[]> {
            return this.data.restClient.getNodeEvents(this.queryStartDate, this.queryEndDate, this.nodeName, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<NodeEvent>(this.data, event));
                });
        }
    }

    export class ApplicationEventList extends EventListBase<ApplicationEvent> {
        private applicationId?: string;

        public constructor(data: DataService, applicationId?: string) {
            super(data);
            if (applicationId) {
                this.applicationId = applicationId.replace(new RegExp("/", "g"), "~");
            }

            if (!this.applicationId) {
                // Show ApplicationId as the first column.
                this.settings.columnSettings.splice(
                    this.optionalColsStartIndex,
                    0,
                    new ListColumnSettingWithFilter(
                        "raw.applicationId",
                        "Application Id"));
            }
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ApplicationEvent>[]> {
            return this.data.restClient.getApplicationEvents(this.queryStartDate, this.queryEndDate, this.applicationId, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<ApplicationEvent>(this.data, event));
                });
        }
    }

    export class ServiceEventList extends EventListBase<ServiceEvent> {
        private serviceId?: string;

        public constructor(data: DataService, serviceId?: string) {
            super(data);
            if (serviceId) {
                this.serviceId = serviceId.replace(new RegExp("/", "g"), "~");
            }
            if (!this.serviceId) {
                // Show ServiceId as the first column.
                this.settings.columnSettings.splice(
                    this.optionalColsStartIndex,
                    0,
                    new ListColumnSettingWithFilter(
                        "raw.serviceId",
                        "Service Id"));
            }
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ServiceEvent>[]> {
            return this.data.restClient.getServiceEvents(this.queryStartDate, this.queryEndDate, this.serviceId, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<ServiceEvent>(this.data, event));
                });
        }
    }

    export class PartitionEventList extends EventListBase<PartitionEvent> {
        private partitionId?: string;

        public constructor(data: DataService, partitionId?: string) {
            super(data);
            this.partitionId = partitionId;
            if (!this.partitionId) {
                // Show PartitionId as the first column.
                this.settings.columnSettings.splice(
                    this.optionalColsStartIndex,
                    0,
                    new ListColumnSettingWithFilter(
                        "raw.partitionId",
                        "Partition Id"));
            }
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<PartitionEvent>[]> {
            return this.data.restClient.getPartitionEvents(this.queryStartDate, this.queryEndDate, this.partitionId, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<PartitionEvent>(this.data, event));
                });
        }
    }

    export class ReplicaEventList extends EventListBase<ReplicaEvent> {
        private partitionId: string;
        private replicaId?: string;

        public constructor(data: DataService, partitionId: string, replicaId?: string) {
            super(data);
            this.partitionId = partitionId;
            this.replicaId = replicaId;
            if (!this.replicaId) {
                // Show ReplicaId as the first column.
                this.settings.columnSettings.splice(
                    this.optionalColsStartIndex,
                    0,
                    new ListColumnSettingWithFilter(
                        "raw.replicaId",
                        "Replica Id"));
            }
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<ReplicaEvent>[]> {
            return this.data.restClient.getReplicaEvents(this.queryStartDate, this.queryEndDate, this.partitionId, this.replicaId, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<ReplicaEvent>(this.data, event));
                });
        }
    }

    export class CorrelatedEventList extends EventListBase<FabricEvent> {
        private eventInstanceId: string;

        public constructor(data: DataService, eventInstanceId: string) {
            super(data);
            this.eventInstanceId = eventInstanceId;
        }

        protected retrieveEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEventInstanceModel<FabricEvent>[]> {
            return this.data.restClient.getCorrelatedEvents(this.eventInstanceId, messageHandler)
                .then(result => {
                    return result.map(event => new FabricEventInstanceModel<FabricEvent>(this.data, event));
                });
        }
    }
}
