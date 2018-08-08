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

    export class DataModelCollectionBase<T extends IDataModel<any>> implements IDataModelCollection<T> {
        public isInitialized: boolean;
        public parent: any;
        public collection: T[] = [];

        protected valueResolver: ValueResolver = new ValueResolver();

        private hash: _.Dictionary<T>;
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

        protected get indexProperty(): string {
            // index the collection by "uniqueId" by default
            return "uniqueId";
        }

        public constructor(public data: DataService, parent?: any) {
            this.parent = parent;
        }

        // Base refresh logic, do not override
        public refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (!this.refreshingPromise) {
                this.refreshingPromise = this.retrieveNewCollection(messageHandler).then(collection => {
                    return this.update(collection);
                }).then(() => {
                    return this;
                }).finally(() => {
                    this.refreshingPromise = null;
                });
            }
            return this.refreshingPromise;
        }

        protected update(collection: T[]): angular.IPromise<any> {
            this.isInitialized = true;
            CollectionUtils.updateDataModelCollection(this.collection, collection);
            this.hash = _.keyBy(this.collection, this.indexProperty);
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

            if (!CollectionUtils.compareCollectionsByKeys(this.collection, healthChunkList.Items, item => item[this.indexProperty], newIdSelector)) {
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
                item => item[this.indexProperty],
                newIdSelector,
                null, // no need to create object because a full refresh will be scheduled when new object is returned by health chunk API,
                      // which is needed because the information returned by the health chunk api is not enough for us to create a full data object.
                (item: T, newItem: P) => {
                    updatePromises.push(item.mergeHealthStateChunk(newItem));
                });

            return this.data.$q.all(updatePromises);
        }
    }

    export class NodeCollection extends DataModelCollectionBase<Node> {
        public healthState: ITextAndBadge;
        public upgradeDomains: string[];
        public faultDomains: string[];
        public healthySeedNodes: string;

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

        protected get indexProperty(): string {
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

            this.healthySeedNodes = seedNodes.length.toString() + " (" +
                Math.round(healthyNodes.length / seedNodes.length * 100).toString() + "%)";
        }

        private updateNodesHealthState(): void {
            // calculates the nodes health state which is the max state value of all nodes
            this.healthState = this.valueResolver.resolveHealthStatus(_.max(_.map(this.collection, node => HealthStateConstants.Values[node.healthState.text])));
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
}

