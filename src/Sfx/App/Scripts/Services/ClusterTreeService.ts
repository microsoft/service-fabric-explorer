//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class ClusterTreeService {
        public tree: TreeViewModel;
        private clusterHealth: ClusterHealth;
        private cm: ClusterManifest;
        // controller views can get instantiated before this service and so a request to set the tree location might
        //get requested before the init function is called and so it needs to be cached.
        private cachedTreeSelection: {path: string[], skipSelectAction?: boolean};

        constructor(
            private $q: angular.IQService,
            private data: DataService,
            private routes: RoutesService,
            private settings: SettingsService) {
        }

        // AuthenticationController will call this function to initialize the tree view once authentication is cleared
        public init() {
            this.clusterHealth = new ClusterHealth(this.data, HealthStateFilterFlags.None, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
            this.tree = new TreeViewModel(this.$q, () => this.getRootNode());
            if (this.cachedTreeSelection) {
                this.tree.selectTreeNode(this.cachedTreeSelection.path, this.cachedTreeSelection.skipSelectAction);
            }

            this.cm = new ClusterManifest(this.data);
        }

        public selectTreeNode(path: string[], skipSelectAction?: boolean): ng.IPromise<any> {
            //if init hasnt been called and set this.tree, then cache request for tree selection
            if (!this.tree) {
                this.cachedTreeSelection = {path, skipSelectAction};
                return this.$q.when(null);
            }

            return this.tree.selectTreeNode(path, skipSelectAction);
        }

        public setFirstVisit(): boolean {
            if (!this.tree) {
                return true;
            }
            if (this.tree.firstTreeSelect) {
                this.tree.firstTreeSelect = false;
                return true;
            }
            return false;
        }

        public refresh(): angular.IPromise<any> {
            // For tree refresh, call health chunk API to retrieve health information for all expanded nodes.
            // Merge the health chunk result back to the shared data models, during refresh, all tree nodes will
            // retrieve data from the cached data model which already has latest health state.
            let clusterHealthQueryDescription = this.tree.addHealthChunkFiltersRecursively(this.data.getInitialClusterHealthChunkQueryDescription());
            return this.data.getClusterHealthChunk(clusterHealthQueryDescription)
                .then(healthChunk => {
                    return this.$q.all([
                        // cluster health needs to be refreshed even when the root node is collapsed
                        this.clusterHealth.mergeHealthStateChunk(healthChunk),
                        this.tree.mergeClusterHealthStateChunk(healthChunk)
                    ]);
                }).finally(() => {
                    return this.tree.refresh();
                });
        }

        private getRootNode(): angular.IPromise<ITreeNode[]> {
            return this.clusterHealth.ensureInitialized().then(clusterHealth => {
                return [
                    {
                        nodeId: IdGenerator.cluster(),
                        displayName: () => "Cluster",
                        childrenQuery: () => this.getGroupNodes(),
                        selectAction: () => this.routes.navigate(() => this.routes.getClusterViewPath()),
                        badge: () => clusterHealth.healthState,
                        alwaysVisible: true,
                        startExpanded: true,
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return this.$q.all([
                                // Refresh applications collection in order to refresh Applications health state which is computed based on health states of all apps
                                this.data.getApps().then(apps => apps.mergeClusterHealthStateChunk(clusterHealthChunk)),
                                // Refresh nodes collection in order to refresh Nodes health state which is computed based on health states of all nodes
                                this.data.getNodes().then(nodes => nodes.mergeClusterHealthStateChunk(clusterHealthChunk)),
                                // Refresh system application health state
                                this.data.getSystemApp().then(systemApp => systemApp.mergeHealthStateChunk(clusterHealthChunk.SystemApplicationHealthStateChunk))
                            ]);
                        }
                    }
                ];
            });
        }

        private getGroupNodes(): angular.IPromise<ITreeNode[]> {
            //let cm: ClusterManifest = new ClusterManifest(this.data);
            let cmPromise = this.cm.ensureInitialized(false);

            let appsNode;
            let getAppsPromise = this.data.getApps().then(apps => {
                appsNode = {
                    nodeId: IdGenerator.appGroup(),
                    displayName: () => "Applications",
                    childrenQuery: () => this.getApplicationTypes(),
                    badge: () => apps.healthState,
                    selectAction: () => this.routes.navigate(() => apps.viewPath),
                    alwaysVisible: true
                };
            });

            let nodesNode;
            let getNodesPromise = this.data.getNodes().then(nodes => {
                nodesNode = {
                    nodeId: IdGenerator.nodeGroup(),
                    displayName: () => "Nodes",
                    selectAction: () => this.routes.navigate(() => nodes.viewPath),
                    childrenQuery: () => this.getNodes(),
                    badge: () => nodes.healthState,
                    listSettings: this.settings.getNewOrExistingTreeNodeListSettings(nodes.viewPath),
                    alwaysVisible: true
                };
            });

            let systemAppNode;
            let systemNodePromise = this.data.getSystemApp().then(systemApp => {
                systemAppNode = {
                    nodeId: IdGenerator.systemAppGroup(),
                    displayName: () => Constants.SystemAppTypeName,
                    selectAction: () => this.routes.navigate(() => systemApp.viewPath),
                    childrenQuery: () => this.getServices(Constants.SystemAppId),
                    badge: () => systemApp.healthState,
                    alwaysVisible: true,
                    addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                        // System app node is expanded, modify health filters to include system services
                        systemApp.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                    },
                    mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                        return systemApp.services.mergeClusterHealthStateChunk(clusterHealthChunk);
                    }
                };
            }).catch(err => {
                systemAppNode = null;
            });



            return cmPromise.then( () => {
                //check to see if network inventory manager is enabled and if SFX should display Network information
                if (this.cm.isNetworkInventoryManagerEnabled) {
                    let networkNode;
                    let getNetworkPromise = this.data.getNetworks(true).then(net => {
                        networkNode = {
                            nodeId: IdGenerator.networkGroup(),
                            displayName: () => "Networks",
                            childrenQuery: () => this.getNetworks(),
                            selectAction: () => this.routes.navigate(() => net.viewPath),
                            alwaysVisible: true
                        };
                    });
                    return this.$q.all([getAppsPromise, getNodesPromise, getNetworkPromise, systemNodePromise]).then(() => {
                        return [appsNode, nodesNode, networkNode, systemAppNode];
                    });
                }
                return this.$q.all([getAppsPromise, getNodesPromise, systemNodePromise]).then(() => {
                    let nodes = [appsNode, nodesNode];
                    if(systemAppNode) {
                        nodes.push(systemAppNode);
                    }
                    return nodes;
                });
            });
        }

        private getNodes(): angular.IPromise<ITreeNode[]> {
            // For nodes we need more information like node status which is not available in health chunk API result.
            // Force refresh the data to update those information here.
            return this.data.getNodes(true).then(nodes => {
                return _.map(nodes.collection, node => {
                    return {
                        nodeId: IdGenerator.node(node.name),
                        displayName: () => {
                            let suffix: string = "";
                            if (node.raw.NodeStatus !== NodeStatusConstants.Up) {
                                if (node.raw.IsStopped) {
                                    suffix = "Down (Stopped)";
                                } else {
                                    suffix = node.raw.NodeStatus;
                                }
                            }

                            if (node.raw.IsSeedNode) {
                                suffix = "Seed Node" + (suffix === "" ? "" : " - " + suffix);
                            }

                            if (suffix !== "") {
                                return `${node.name} (${suffix})`;
                            }

                            return node.name;
                        },
                        selectAction: () => this.routes.navigate(() => node.viewPath),
                        childrenQuery: () => this.getDeployedApplications(node.name),
                        badge: () => node.healthState,
                        sortBy: () => [node.name],
                        actions: node.actions,
                        addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                            node.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                        },
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return node.deployedApps.mergeClusterHealthStateChunk(clusterHealthChunk);
                        }
                    };
                });
            });
        }

        private getNetworks(): angular.IPromise<ITreeNode[]> {
            // App type groups cannot be inferred from health chunk data, because we need all app types
            // even there are currently no application instances for them.
            return this.data.getNetworks(true).then(networks => {
                return _.map(networks.collection, network => {
                    return {

                        nodeId: IdGenerator.network(network.name),
                        displayName: () => network.name,
                        selectAction: () => this.routes.navigate(() => network.viewPath),
                        sortBy: () => [network.name],
                        actions: network.actions
                    };
                });
            });
        }

        private getApplicationTypes(): angular.IPromise<ITreeNode[]> {
            // App type groups cannot be inferred from health chunk data, because we need all app types
            // even there are currently no application instances for them.
            return this.data.getAppTypeGroups(true).then(appGroups => {
                return _.map(appGroups.collection, appTypeGroup => {
                    return {
                        nodeId: IdGenerator.appType(appTypeGroup.name),
                        displayName: () => appTypeGroup.name,
                        selectAction: () => this.routes.navigate(() => appTypeGroup.viewPath),
                        childrenQuery: () => this.getApplicationsForType(appTypeGroup.name),
                        badge: () => appTypeGroup.appsHealthState,
                        sortBy: () => [appTypeGroup.name],
                        actions: appTypeGroup.actions
                    };
                });
            });
        }

        private getDeployedApplications(nodeName: string): angular.IPromise<ITreeNode[]> {
            return this.data.getDeployedApplications(nodeName).then(deployedApps => {
                return _.map(deployedApps.collection, deployedApp => {
                    return {
                        nodeId: IdGenerator.deployedApp(deployedApp.id),
                        displayName: () => deployedApp.name,
                        selectAction: () => this.routes.navigate(() => deployedApp.viewPath),
                        childrenQuery: () => this.getDeployedServicePackages(nodeName, deployedApp.id),
                        badge: () => deployedApp.health.healthState,
                        sortBy: () => [deployedApp.name],
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(deployedApp.viewPath),
                        addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                            deployedApp.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                        },
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return deployedApp.deployedServicePackages.mergeClusterHealthStateChunk(clusterHealthChunk);
                        },
                        canExpandAll: true
                    };
                });
            });
        }

        private getDeployedServicePackages(nodeName: string, applicationId: string): angular.IPromise<ITreeNode[]> {
            return this.data.getDeployedServicePackages(nodeName, applicationId).then(deployedServicePackages => {
                return _.map(deployedServicePackages.collection, deployedServicePackage => {
                    return {
                        nodeId: IdGenerator.deployedServicePackage(deployedServicePackage.name, deployedServicePackage.servicePackageActivationId),
                        displayName: () => deployedServicePackage.uniqueId,
                        selectAction: () => this.routes.navigate(() => deployedServicePackage.viewPath),
                        childrenQuery: () => this.getDeployedServiceChildrenGroupNodes(nodeName, applicationId, deployedServicePackage.name, deployedServicePackage.servicePackageActivationId),
                        badge: () => deployedServicePackage.health.healthState,
                        sortBy: () => [deployedServicePackage.uniqueId],
                        canExpandAll: true
                    };
                });
            });
        }

        private getDeployedServiceChildrenGroupNodes(nodeName: string, applicationId: string, servicePackageName: string, servicePackageActivationId: string): angular.IPromise<ITreeNode[]> {
            let codePkgNode;
            // No health chunk data for deployed code packages, need to do force refresh to retrieve health data from server
            let getCodePkgsPromise = this.data.getDeployedCodePackages(nodeName, applicationId, servicePackageName, servicePackageActivationId, true).then(codePkgs => {
                codePkgNode = {
                    nodeId: IdGenerator.deployedCodePackageGroup(),
                    displayName: () => "Code Packages",
                    childrenQuery: () => this.getDeployedCodePackages(codePkgs, nodeName, applicationId, servicePackageName, servicePackageActivationId),
                    selectAction: () => this.routes.navigate(() => codePkgs.viewPath),
                };
            });

            let replicasNode;
            // No health chunk data for deployed replicas, need to do force refresh to retrieve health data from server
            let getReplicasPromise = this.data.getDeployedReplicas(nodeName, applicationId, servicePackageName, servicePackageActivationId, true).then(replicas => {
                replicasNode = {
                    nodeId: IdGenerator.deployedReplicaGroup(),
                    displayName: () => replicas.isStatelessService ? "Instances" : "Replicas",
                    childrenQuery: () => this.getDeployedReplicas(replicas, nodeName, applicationId, servicePackageName, servicePackageActivationId),
                    selectAction: () => this.routes.navigate(() => replicas.viewPath),
                    listSettings: this.settings.getNewOrExistingTreeNodeListSettings(replicas.viewPath),
                };
            });

            return this.$q.all([getCodePkgsPromise, getReplicasPromise]).then(() => {
                return [codePkgNode, replicasNode];
            });
        }

        private getDeployedCodePackages(deployedCodePackages: DeployedCodePackageCollection, nodeName: string, applicationId: string, servicePackageName: string, servicePackageActivationId: string): angular.IPromise<ITreeNode[]> {
            return this.$q.when(_.map(deployedCodePackages.collection, codePackage => {
                return {
                    nodeId: IdGenerator.deployedCodePackage(codePackage.name),
                    displayName: () => codePackage.uniqueId,
                    selectAction: () => this.routes.navigate(() => codePackage.viewPath),
                    sortBy: () => [codePackage.uniqueId],
                    actions: codePackage.actions
                };
            }));
        }

        private getDeployedReplicas(deployedReplicas: DeployedReplicaCollection, nodeName: string, applicationId: string, servicePackageName: string, servicePackageActivationId: string): angular.IPromise<ITreeNode[]> {
            return this.$q.when(_.map(deployedReplicas.collection, replica => {
                return {
                    nodeId: IdGenerator.deployedReplica(replica.raw.PartitionId),
                    displayName: () => replica.isStatelessService
                        ? replica.id
                        : replica.id + " (" + replica.role + ")",
                    selectAction: () => this.routes.navigate(() => replica.viewPath),
                    sortBy: () => replica.isStatelessService
                        ? [replica.id]
                        : [replica.replicaRoleSortPriority, replica.id],
                    actions: replica.actions
                };
            }));
        }

        private getApplicationsForType(appTypeName: string): angular.IPromise<ITreeNode[]> {
            return this.data.getAppTypeGroup(appTypeName).then(appTypeGroup => {
                return _.map(appTypeGroup.apps, app => {
                    return {
                        nodeId: IdGenerator.app(app.id),
                        displayName: () => app.name,
                        selectAction: () => this.routes.navigate(() => app.viewPath),
                        childrenQuery: () => this.getServices(app.id),
                        badge: () => app.healthState,
                        sortBy: () => [app.name],
                        actions: app.actions,
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(app.viewPath),
                        addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                            app.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                        },
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return app.services.mergeClusterHealthStateChunk(clusterHealthChunk);
                        },
                        canExpandAll: true
                    };
                });
            });
        }

        private getServices(appId: string): angular.IPromise<ITreeNode[]> {
            return this.data.getServices(appId).then(services => {
                return _.map(services.collection, service => {
                    return {
                        nodeId: IdGenerator.service(service.id),
                        displayName: () => service.name,
                        selectAction: () => this.routes.navigate(() => service.viewPath),
                        childrenQuery: () => this.getPartitions(appId, service.id),
                        badge: () => service.healthState,
                        sortBy: () => [service.name],
                        actions: service.actions,
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(service.viewPath),
                        addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                            service.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                        },
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return service.partitions.mergeClusterHealthStateChunk(clusterHealthChunk);
                        },
                        canExpandAll: true
                    };
                });
            });
        }

        private getPartitions(appId: string, serviceId: string): angular.IPromise<ITreeNode[]> {
            return this.data.getPartitions(appId, serviceId).then(partitions => {
                return _.map(partitions.collection, partition => {
                    return {
                        nodeId: IdGenerator.partition(partition.id),
                        displayName: () => partition.partitionInformation.isPartitionKindNamed
                            ? `${partition.partitionInformation.raw.Name} (${partition.id})`
                            : partition.id,
                        selectAction: () => this.routes.navigate(() => partition.viewPath),
                        childrenQuery: () => this.getReplicas(appId, serviceId, partition.id),
                        badge: () => partition.healthState,
                        sortBy: () => [partition.name],
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(partition.viewPath)
                        // For children replicas, no need to do health chunk query here because
                        // we need full replicas information like role and location.
                    };
                });
            });
        }

        private getReplicas(appId: string, serviceId: string, partitionId: string): angular.IPromise<ITreeNode[]> {
            // Force refresh to retrieve replica role and location information which are not available in health chunk API
            return this.data.getReplicasOnPartition(appId, serviceId, partitionId, true).then(replicas => {
                return _.map(replicas.collection, replica => {
                    return {
                        nodeId: IdGenerator.replica(replica.id),
                        displayName: () => replica.isStatelessService
                            ? replica.raw.NodeName
                            : `${replica.role} (${replica.raw.NodeName})`,
                        selectAction: () => this.routes.navigate(() => replica.viewPath),
                        badge: () => replica.healthState,
                        sortBy: () => replica.isStatelessService
                            ? [replica.raw.NodeName]
                            : [replica.replicaRoleSortPriority, replica.raw.NodeName],
                        actions: replica.actions,
                        canExpandAll: true
                    };
                });
            });
        }
    }

    (function () {
        let module = angular.module("clusterTreeService", ["ng", "ngSanitize", "dataService", "routes"]);
        module.factory("clusterTree", ["$q", "data", "routes", "settings",
            ($q, data, routes, settings) => new ClusterTreeService($q, data, routes, settings)]);
    })();
}

