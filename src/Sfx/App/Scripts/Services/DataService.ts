//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class DataService {
        public systemApp: SystemApplication;
        public clusterManifest: ClusterManifest;
        public clusterUpgradeProgress: ClusterUpgradeProgress;
        public clusterLoadInformation: ClusterLoadInformation;
        public appTypeGroups: ApplicationTypeGroupCollection;
        public apps: ApplicationCollection;
        public nodes: NodeCollection;

        public restClient: RestClient;

        public constructor(
            public routes: RoutesService,
            public message: MessageService,
            public telemetry: TelemetryService,
            public $location: angular.ILocationService,
            public $http: angular.IHttpService,
            public $q: angular.IQService,
            public $uibModal: angular.ui.bootstrap.IModalService,
            public $route: angular.route.IRouteService,
            public $sanitize: angular.sanitize.ISanitizeService,
            public $rootScope: angular.IRootScopeService) {

            this.systemApp = new SystemApplication(this);
            this.clusterManifest = new ClusterManifest(this);
            this.clusterUpgradeProgress = new ClusterUpgradeProgress(this);
            this.clusterLoadInformation = new ClusterLoadInformation(this);
            this.appTypeGroups = new ApplicationTypeGroupCollection(this);
            this.apps = new ApplicationCollection(this);
            this.nodes = new NodeCollection(this);

            this.restClient = new RestClient($http, message);
        }

        public actionsEnabled(): boolean {
            return this.$rootScope[Constants.SfxReadonlyMetadataName] !== true;
        }

        public invalidateBrowserRestResponseCache(): void {
            this.restClient.invalidateBrowserRestResponseCache();
        }

        public getClusterHealth(
            eventsHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default,
            nodesHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default,
            applicationsHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default
        ): ClusterHealth {
            return new ClusterHealth(this, eventsHealthStateFilter, nodesHealthStateFilter, applicationsHealthStateFilter);
        }

        public getClusterManifest(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterManifest> {
            return this.clusterManifest.ensureInitialized(forceRefresh, messageHandler);
        }

        public getClusterUpgradeProgress(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterUpgradeProgress> {
            return this.clusterUpgradeProgress.ensureInitialized(forceRefresh, messageHandler);
        }

        public getClusterLoadInformation(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterLoadInformation> {
            return this.clusterLoadInformation.ensureInitialized(forceRefresh, messageHandler);
        }

        public getClusterHealthChunk(healthDescriptor: IClusterHealthChunkQueryDescription): angular.IPromise<IClusterHealthChunk> {
            // Will not report cluster chunk api errors
            return this.restClient.getClusterHealthChunk(healthDescriptor, ResponseMessageHandlers.silentResponseMessageHandler).then((raw: any) => {
                // Rre-process the health chunk data in order to match the SFX tree structure
                return this.preprocessHealthChunkData(raw.data);
            });
        }

        public getInitialClusterHealthChunkQueryDescription(): IClusterHealthChunkQueryDescription {
            // By default query all applications and nodes because in SFX almost all health query will need them
            return {
                ApplicationFilters: [
                    {
                        HealthStateFilter: HealthStateFilterFlags.All
                    }],
                NodeFilters: [
                    {
                        HealthStateFilter: HealthStateFilterFlags.All
                    }]
            };
        }

        public getSystemApp(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<SystemApplication> {
            return this.systemApp.ensureInitialized(forceRefresh, messageHandler);
        }

        public getSystemServices(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceCollection> {
            return this.getSystemApp(false, messageHandler).then(app => {
                return app.services.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getApps(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationCollection> {
            return this.apps.ensureInitialized(forceRefresh, messageHandler);
        }

        public getApp(id: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Application> {
            return this.getApps(false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, id, forceRefresh, messageHandler);
            });
        }

        public getNodes(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<NodeCollection> {
            return this.nodes.ensureInitialized(forceRefresh, messageHandler);
        }

        public getNode(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Node> {
            return this.getNodes(false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, name, forceRefresh, messageHandler);
            });
        }

        public getAppTypeGroups(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationTypeGroupCollection> {
            return this.appTypeGroups.ensureInitialized(forceRefresh, messageHandler);
        }

        public getAppTypeGroup(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationTypeGroup> {
            return this.getAppTypeGroups(false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, name, forceRefresh, messageHandler);
            });
        }

        public getAppType(name: string, version: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationType> {
            return this.getAppTypeGroup(name, false, messageHandler).then(appTypeGroup => {
                let filteredAppTypes = _.filter(appTypeGroup.appTypes, appType => appType.raw.Version === version);
                return filteredAppTypes[0];
            });
        }

        public getServiceTypes(appTypeName: string, appTypeVersion: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceTypeCollection> {
            return this.getAppType(appTypeName, appTypeVersion, false, messageHandler).then(appType => {
                return appType.serviceTypes.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getServiceType(appTypeName: string, appTypeVersion: string, serviceTypeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceType> {
            return this.getServiceTypes(appTypeName, appTypeVersion, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, serviceTypeName, forceRefresh, messageHandler);
            });
        }

        public getServices(appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceCollection> {
            let getAppPromise = appId === Constants.SystemAppId
                ? this.getSystemApp(false, messageHandler)
                : this.getApp(appId, false, messageHandler);

            return getAppPromise.then(app => {
                return app.services.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getService(appId: string, serviceId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Service> {
            return this.getServices(appId, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.service(serviceId), forceRefresh, messageHandler);
            });
        }

        public getPartitions(appId: string, serviceId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<PartitionCollection> {
            return this.getService(appId, serviceId, false, messageHandler).then(service => {
                return service.partitions.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getPartition(appId: string, serviceId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<Partition> {
            return this.getPartitions(appId, serviceId, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.partition(partitionId), forceRefresh, messageHandler);
            });
        }

        public getReplicasOnPartition(appId: string, serviceId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ReplicaOnPartitionCollection> {
            return this.getPartition(appId, serviceId, partitionId, false, messageHandler).then(partition => {
                return partition.replicas.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getReplicaOnPartition(appId: string, serviceId: string, partitionId: string, replicaId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<ReplicaOnPartition> {
            return this.getReplicasOnPartition(appId, serviceId, partitionId, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.replica(replicaId), forceRefresh, messageHandler);
            });
        }

        public getDeployedApplications(nodeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedApplicationCollection> {
            return this.getNode(nodeName, false, messageHandler).then(node => {
                return node.deployedApps.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getDeployedApplication(nodeName: string, appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedApplication> {
            return this.getDeployedApplications(nodeName, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.app(appId), forceRefresh, messageHandler);
            });
        }

        public getDeployedServicePackages(nodeName: string, appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedServicePackageCollection> {
            return this.getDeployedApplication(nodeName, appId, false, messageHandler).then(deployedApp => {
                return deployedApp.deployedServicePackages.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getDeployedServicePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedServicePackage> {
            return this.getDeployedServicePackages(nodeName, appId, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.deployedServicePackage(servicePackageName, servicePackageActivationId), forceRefresh, messageHandler);
            });
        }

        public getDeployedCodePackages(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedCodePackageCollection> {
            return this.getDeployedServicePackage(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).then(deployedServicePackage => {
                return deployedServicePackage.deployedCodePackages.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getDeployedCodePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, codePackageName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedCodePackage> {
            return this.getDeployedCodePackages(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.deployedCodePackage(codePackageName), forceRefresh, messageHandler);
            });
        }

        public getDeployedReplicas(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedReplicaCollection> {
            return this.getDeployedServicePackage(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).then(deployedServicePackage => {
                return deployedServicePackage.deployedReplicas.ensureInitialized(forceRefresh, messageHandler);
            });
        }

        public getDeployedReplica(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<DeployedReplica> {
            return this.getDeployedReplicas(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).then(collection => {
                return this.tryGetValidItem(collection, IdGenerator.deployedReplica(partitionId), forceRefresh, messageHandler);
            });
        }

        public createNodeEventList(nodeName?: string): NodeEventList {
            return new NodeEventList(this, nodeName);
        }

        public createPartitionEventList(partitionId?: string): PartitionEventList {
            return new PartitionEventList(this, partitionId);
        }

        public createCorrelatedEventList(eventInstanceId: string) {
            return new CorrelatedEventList(this, eventInstanceId);
        }

        private tryGetValidItem<T extends IDataModel<any>>(collection: IDataModelCollection<T>, uniqueId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let item = collection.find(uniqueId);
            if (item) {
                return item.ensureInitialized(forceRefresh, messageHandler);
            } else {
                return this.$q.reject();
            }
        }

        private preprocessHealthChunkData(clusterHealthChunk: IClusterHealthChunk): IClusterHealthChunk {
            // Move system app to be a standalone object to match the tree structure
            clusterHealthChunk.SystemApplicationHealthStateChunk = _.first(_.remove(clusterHealthChunk.ApplicationHealthStateChunks.Items,
                appHealthStateChunk => appHealthStateChunk.ApplicationName === Constants.SystemAppName));

            let deployedApps: IDeployedApplicationHealthStateChunk[] = [];

            // Add application name to deployed application health chunk
            _.forEach(clusterHealthChunk.ApplicationHealthStateChunks.Items,
                appHealthStateChunk => _.forEach(appHealthStateChunk.DeployedApplicationHealthStateChunks.Items, deployedApp => {
                    deployedApp.ApplicationName = appHealthStateChunk.ApplicationName;
                    deployedApps.push(deployedApp);
                }));

            // Assign deployed apps under their belonging nodes
            let nodeDeployedAppsGroups = _.groupBy(deployedApps, deployedApp => deployedApp.NodeName);
            _.forEach(nodeDeployedAppsGroups, (group, key) => {
                let nodeHealthChunk = _.find(clusterHealthChunk.NodeHealthStateChunks.Items, chunk => chunk.NodeName === key);
                if (nodeHealthChunk) {
                    nodeHealthChunk.DeployedApplicationHealthStateChunks = {
                        Items: group,
                        TotalCount: group.length
                    };
                }
            });

            // Assign empty array to the DeployedApplicationHealthStateChunks to avoid null check.
            _.forEach(clusterHealthChunk.NodeHealthStateChunks.Items, nodeHealthChunk => {
                if (!nodeHealthChunk.DeployedApplicationHealthStateChunks) {
                    nodeHealthChunk.DeployedApplicationHealthStateChunks = {
                        Items: [],
                        TotalCount: 0
                    };
                }
            });

            return clusterHealthChunk;
        }
    }

    (function () {

        let module = angular.module("dataService", ["routes", "messages", "ui.bootstrap", "ngSanitize"]);
        module.factory("data", ["routes", "message", "telemetry", "$location", "$http", "$q", "$uibModal", "$route", "$sanitize", "$rootScope",
            (routes, message, telemetry, $location, $http, $q, $uibModal, $route, $sanitize, $rootScope) =>
                new DataService(routes, message, telemetry, $location, $http, $q, $uibModal, $route, $sanitize, $rootScope)]);

        module.run(["$http", function ($http: angular.IHttpService) {
            $http.defaults.headers.common[Constants.SfxVersionMetadataName] = VersionInfo.Version;
            $http.defaults.headers.common[Constants.SfxBuildMetadataName] = VersionInfo.Build;
        }]);

        // Upon the route change [ie, user navigation], let us know that the cache is no longer valid.
        module.run(["$rootScope", "data", function ($rootScope: angular.IRootScopeService, data: DataService) {
            $rootScope.$on("$routeChangeSuccess", function (event: angular.IAngularEvent, next: any, current: any) {
                data.invalidateBrowserRestResponseCache();
            });

            // Save version and build information in root scope so they can be accessed in the header without any controller.
            $rootScope["SfxVersion"] = VersionInfo.Version;
            $rootScope["SfxBuild"] = VersionInfo.Build;
            $rootScope["ShowPreviewWarning"] = VersionInfo.IsPreview;
        }]);

    })();
}
