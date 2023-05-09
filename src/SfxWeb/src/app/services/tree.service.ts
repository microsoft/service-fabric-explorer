import { ElementRef, Injectable } from '@angular/core';
import { IdGenerator } from '../Utils/IdGenerator';
import { ITreeNode } from '../ViewModels/TreeTypes';
import { IClusterHealthChunkQueryDescription, IClusterHealthChunk, HealthStateFilterFlags } from '../Models/HealthChunkRawDataTypes';
import { DeployedReplicaCollection, DeployedCodePackageCollection } from '../Models/DataModels/collections/Collections';
import { NodeStatusConstants, Constants } from '../Common/Constants';
import { ClusterHealth, ClusterManifest } from '../Models/DataModels/Cluster';
import { TreeViewModel } from '../ViewModels/TreeViewModel';
import { DataService } from './data.service';
import { RoutesService } from './routes.service';
import { of, Observable, forkJoin } from 'rxjs';
import { mergeMap, map, finalize, catchError } from 'rxjs/operators';
import { SettingsService } from './settings.service';
import { RefreshService } from './refresh.service';
import { FocusService } from './focus.service';

@Injectable({
  providedIn: 'root'
})
export class TreeService {

        public containerRef: ElementRef;
        public tree: TreeViewModel;
        private clusterHealth: ClusterHealth;
        // controller views can get instantiated before this service and so a request to set the tree location might
        // get requested before the init function is called 
        private selectTreeNodeCalled = false;
        private cachedTreeSelection: {path: string[], skipSelectAction?: boolean};

        public get cachedTreeNodeSelection(): string {
            return this.cachedTreeSelection ? this.cachedTreeSelection.path.slice(-1).pop() : null;
        }

        constructor(
            private data: DataService,
            private routes: RoutesService,
            private settings: SettingsService,
            private refreshService: RefreshService,
            private focusService: FocusService) {
        }

        // AuthenticationController will call this function to initialize the tree view once authentication is cleared
        public init() {
            this.clusterHealth = new ClusterHealth(this.data, HealthStateFilterFlags.None, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
            this.tree = new TreeViewModel(() => this.getRootNode());
            if (this.selectTreeNodeCalled) {
                this.tree.selectTreeNode(this.cachedTreeSelection.path, this.cachedTreeSelection.skipSelectAction);
                this.selectTreeNodeCalled = false;
            }

            this.refreshService.refreshSubject.subscribe( () => this.refresh().subscribe());
        }

        public selectTreeNode(path: string[], skipSelectAction?: boolean): Observable<any> {
            this.cachedTreeSelection = {path, skipSelectAction};
            
            // if init hasnt been called and set this.tree, then wait for it to be set
            if (!this.tree) {
                this.selectTreeNodeCalled = true;
                return of(null);
            }
            
            return this.tree.selectTreeNode(path, skipSelectAction);
        }

        public selectTree(skipSelectionAction?: boolean): void {
            this.tree.selectTreeNode(this.cachedTreeSelection.path, true);
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

        public refresh(): Observable<any> {
            // For tree refresh, call health chunk API to retrieve health information for all expanded nodes.
            // Merge the health chunk result back to the shared data models, during refresh, all tree nodes will
            // retrieve data from the cached data model which already has latest health state.
            const clusterHealthQueryDescription = this.tree.addHealthChunkFiltersRecursively(this.data.getInitialClusterHealthChunkQueryDescription());
            return this.data.getClusterHealthChunk(clusterHealthQueryDescription)
                .pipe(mergeMap(healthChunk => {
                  return forkJoin([
                        // cluster health needs to be refreshed even when the root node is collapsed
                        this.clusterHealth.mergeHealthStateChunk(healthChunk),
                        this.tree.mergeClusterHealthStateChunk(healthChunk)
                    ]).pipe(mergeMap(() => this.tree.refresh()) );
                }));
        }

        private getRootNode(): Observable<ITreeNode[]> {
            return this.clusterHealth.ensureInitialized().pipe(map(clusterHealth => {
                return [
                    {
                        nodeId: IdGenerator.cluster(),
                        displayName: () => 'Cluster',
                        childrenQuery: () => this.getGroupNodes(),
                        selectAction: () => this.routes.navigate(() => RoutesService.getClusterViewPath(), () => this.focusService.focus()),
                        badge: () => clusterHealth.healthState,
                        alwaysVisible: true,
                        startExpanded: true,
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return forkJoin([
                                // Refresh applications collection in order to refresh Applications health state which is computed based on health states of all apps
                                this.data.getApps().pipe(map(apps => apps.mergeClusterHealthStateChunk(clusterHealthChunk))),
                                // Refresh nodes collection in order to refresh Nodes health state which is computed based on health states of all nodes
                                this.data.getNodes().pipe(map(nodes => nodes.mergeClusterHealthStateChunk(clusterHealthChunk))),
                                // Refresh system application health state
                                this.data.getSystemApp().pipe(map(systemApp => systemApp.mergeHealthStateChunk(clusterHealthChunk.SystemApplicationHealthStateChunk)))
                            ]);
                        }
                    }
                ];
            }));
        }

        private getGroupNodes(): Observable<ITreeNode[]> {

            const getAppsPromise = this.data.getApps().pipe(map(apps => {
              return {
                    nodeId: IdGenerator.appGroup(),
                    displayName: () => 'Applications',
                    childrenQuery: () => this.getApplicationTypes(),
                    badge: () => apps.healthState,
                    selectAction: () => this.routes.navigate(() => apps.viewPath, () => this.focusService.focus()),
                    listSettings: this.settings.getNewOrExistingTreeNodeListSettings(apps.viewPath),
                    alwaysVisible: true
                };
            }));

            const getNodesPromise = this.data.getNodes().pipe(map(nodes => {
              return {
                    nodeId: IdGenerator.nodeGroup(),
                    displayName: () => 'Nodes',
                    selectAction: () => this.routes.navigate(() => nodes.viewPath, () => this.focusService.focus()),
                    childrenQuery: () => this.getNodes(),
                    badge: () => nodes.healthState,
                    listSettings: this.settings.getNewOrExistingTreeNodeListSettings(nodes.viewPath),
                    alwaysVisible: true
                };
            }));

            const systemNodePromise = this.data.getSystemApp().pipe(
                            catchError(err => {
                return of(null);
            }),
            map(systemApp => {
              if (systemApp) {
                return {
                    nodeId: IdGenerator.systemAppGroup(),
                    displayName: () => Constants.SystemAppTypeName,
                    selectAction: () => this.routes.navigate(() => systemApp.viewPath, () => this.focusService.focus()),
                    childrenQuery: () => this.getServices(Constants.SystemAppId),
                    badge: () => systemApp.healthState,
                    listSettings: this.settings.getNewOrExistingTreeNodeListSettings(systemApp.viewPath),
                    alwaysVisible: true,
                    addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                        // System app node is expanded, modify health filters to include system services
                        systemApp.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                    },
                    mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                        return systemApp.services.mergeClusterHealthStateChunk(clusterHealthChunk);
                    }
                };
              }else{
                  return null;
              }
            }),

            );


            return forkJoin([getAppsPromise, getNodesPromise, systemNodePromise]).pipe(map(resp => {
                if (resp[2] === null) {
                    resp.splice(2);
                    return resp;
                }
                return resp;
            }));
        }

        private getNodes(): Observable<ITreeNode[]> {
            // For nodes we need more information like node status which is not available in health chunk API result.
            // Force refresh the data to update those information here.
            return this.data.getNodes(true).pipe(map(nodes => {
                return nodes.collection.map(node => {
                    return {
                        nodeId: IdGenerator.node(node.name),
                        displayName: () => {
                            let suffix = '';
                            if (node.raw.NodeStatus !== NodeStatusConstants.Up) {
                                if (node.raw.IsStopped) {
                                    suffix = 'Down (Stopped)';
                                } else {
                                    suffix = node.raw.NodeStatus;
                                    if (node.raw.NodeDeactivationInfo.NodeDeactivationIntent !== NodeStatusConstants.Invalid) {
                                        suffix += ' -> ' + node.raw.NodeDeactivationInfo.NodeDeactivationIntent;
                                    }
                                }
                            }

                            if (node.raw.IsSeedNode) {
                                suffix = 'Seed Node' + (suffix === '' ? '' : ' - ' + suffix);
                            }

                            if (suffix !== '') {
                                return `${node.name} (${suffix})`;
                            }

                            return node.name;
                        },
                        selectAction: () => this.routes.navigate(() => node.viewPath, () => this.focusService.focus()),
                        childrenQuery: () => this.getDeployedApplications(node.name),
                        badge: () => node.healthState,
                        sortBy: () => [node.name],
                        actions: node.actions,
                        addHealthStateFiltersForChildren: (clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription) => {
                            node.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
                        },
                        mergeClusterHealthStateChunk: (clusterHealthChunk: IClusterHealthChunk) => {
                            return node.deployedApps.mergeClusterHealthStateChunk(clusterHealthChunk);
                        },
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(node.viewPath),
                    };
                });
            }));
        }

        private getApplicationTypes(): Observable<ITreeNode[]> {
            // App type groups cannot be inferred from health chunk data, because we need all app types
            // even there are currently no application instances for them.
            return this.data.getAppTypeGroups(true).pipe(map(appGroups => {
                return appGroups.collection.map(appTypeGroup => {
                    return {
                        nodeId: IdGenerator.appType(appTypeGroup.name),
                        displayName: () => appTypeGroup.name,
                        selectAction: () => this.routes.navigate(() => appTypeGroup.viewPath, () => this.focusService.focus()),
                        childrenQuery: () => this.getApplicationsForType(appTypeGroup.name),
                        badge: () => appTypeGroup.appsHealthState,
                        sortBy: () => [appTypeGroup.name],
                        actions: appTypeGroup.actions,
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(appGroups.viewPath),
                    };
                });
            }));
        }

        private getDeployedApplications(nodeName: string): Observable<ITreeNode[]> {
            return this.data.getDeployedApplications(nodeName).pipe(map(deployedApps => {
                return deployedApps.collection.map(deployedApp => {
                    return {
                        nodeId: IdGenerator.deployedApp(deployedApp.id),
                        displayName: () => deployedApp.name,
                        selectAction: () => this.routes.navigate(() => deployedApp.viewPath, () => this.focusService.focus()),
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
            }));
        }

        private getDeployedServicePackages(nodeName: string, applicationId: string): Observable<ITreeNode[]> {
            return this.data.getDeployedServicePackages(nodeName, applicationId).pipe(map(deployedServicePackages => {
                return deployedServicePackages.collection.map(deployedServicePackage => {
                    return {
                        nodeId: IdGenerator.deployedServicePackage(deployedServicePackage.name, deployedServicePackage.servicePackageActivationId),
                        displayName: () => deployedServicePackage.uniqueId,
                        selectAction: () => this.routes.navigate(() => deployedServicePackage.viewPath, () => this.focusService.focus()),
                        childrenQuery: () => this.getDeployedServiceChildrenGroupNodes(nodeName, applicationId, deployedServicePackage.name, deployedServicePackage.servicePackageActivationId),
                        badge: () => deployedServicePackage.health.healthState,
                        sortBy: () => [deployedServicePackage.uniqueId],
                        canExpandAll: true
                    };
                });
            }));
        }

        private getDeployedServiceChildrenGroupNodes(nodeName: string, applicationId: string, servicePackageName: string, servicePackageActivationId: string): Observable<ITreeNode[]> {
            let codePkgNode;
            // No health chunk data for deployed code packages, need to do force refresh to retrieve health data from server
            const getCodePkgsPromise = this.data.getDeployedCodePackages(nodeName, applicationId, servicePackageName, servicePackageActivationId, true).pipe(map(codePkgs => {
                codePkgNode = {
                    nodeId: IdGenerator.deployedCodePackageGroup(),
                    displayName: () => 'Code Packages',
                    childrenQuery: () => this.getDeployedCodePackages(codePkgs, nodeName, applicationId, servicePackageName, servicePackageActivationId),
                    selectAction: () => this.routes.navigate(() => codePkgs.viewPath, () => this.focusService.focus()),
                };
            }));

            let replicasNode;
            // No health chunk data for deployed replicas, need to do force refresh to retrieve health data from server
            const getReplicasPromise = this.data.getDeployedReplicas(nodeName, applicationId, servicePackageName, servicePackageActivationId, true).pipe(map(replicas => {
                replicasNode = {
                    nodeId: IdGenerator.deployedReplicaGroup(),
                    displayName: () => replicas.isStatelessService ? 'Instances' : 'Replicas',
                    childrenQuery: () => this.getDeployedReplicas(replicas, nodeName, applicationId, servicePackageName, servicePackageActivationId),
                    selectAction: () => this.routes.navigate(() => replicas.viewPath, () => this.focusService.focus()),
                    listSettings: this.settings.getNewOrExistingTreeNodeListSettings(replicas.viewPath),
                };
            }));

            return forkJoin([getCodePkgsPromise, getReplicasPromise]).pipe(map(() => {
                return [codePkgNode, replicasNode];
            }));
        }

        private getDeployedCodePackages(deployedCodePackages: DeployedCodePackageCollection, nodeName: string, applicationId: string,
                                        servicePackageName: string, servicePackageActivationId: string): Observable<ITreeNode[]> {
            return of(deployedCodePackages.collection.map(codePackage => {
                return {
                    nodeId: IdGenerator.deployedCodePackage(codePackage.name),
                    displayName: () => codePackage.uniqueId,
                    selectAction: () => this.routes.navigate(() => codePackage.viewPath, () => this.focusService.focus()),
                    sortBy: () => [codePackage.uniqueId],
                    actions: codePackage.actions
                };
            }));
        }

        private getDeployedReplicas(deployedReplicas: DeployedReplicaCollection, nodeName: string, applicationId: string,
                                    servicePackageName: string, servicePackageActivationId: string): Observable<ITreeNode[]> {
            return of(deployedReplicas.collection.map(replica => {
                return {
                    nodeId: IdGenerator.deployedReplica(replica.raw.PartitionId),
                    displayName: () => replica.isStatelessService
                        ? replica.id
                        : replica.id + ' (' + replica.role + ')',
                    selectAction: () => this.routes.navigate(() => replica.viewPath, () => this.focusService.focus()),
                    sortBy: () => replica.isStatelessService
                        ? [replica.id]
                        : [replica.replicaRoleSortPriority, replica.id],
                    actions: replica.actions
                };
            }));
        }

        private getApplicationsForType(appTypeName: string): Observable<ITreeNode[]> {
            return this.data.getAppTypeGroup(appTypeName).pipe(map(appTypeGroup => {
                return appTypeGroup.apps.map(app => {
                    return {
                        nodeId: IdGenerator.app(app.id),
                        displayName: () => app.name,
                        selectAction: () => this.routes.navigate(() => app.viewPath, () => this.focusService.focus()),
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
            }));
        }

        private getServices(appId: string): Observable<ITreeNode[]> {
            return this.data.getServices(appId).pipe(map(services => {
                return services.collection.map(service => {
                    return {
                        nodeId: IdGenerator.service(service.id),
                        displayName: () => service.name,
                        selectAction: () => this.routes.navigate(() => service.viewPath, () => this.focusService.focus()),
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
            }));
        }

        private getPartitions(appId: string, serviceId: string): Observable<ITreeNode[]> {
            return this.data.getPartitions(appId, serviceId).pipe(map(partitions => {
                return partitions.collection.map(partition => {
                    return {
                        nodeId: IdGenerator.partition(partition.id),
                        displayName: () => partition.partitionInformation.isPartitionKindNamed
                            ? `${partition.partitionInformation.raw.Name} (${partition.id})`
                            : partition.id,
                        selectAction: () => this.routes.navigate(() => partition.viewPath, () => this.focusService.focus()),
                        childrenQuery: () => this.getReplicas(appId, serviceId, partition.id),
                        badge: () => partition.healthState,
                        sortBy: () => [partition.name],
                        listSettings: this.settings.getNewOrExistingTreeNodeListSettings(partition.viewPath)
                        // For children replicas, no need to do health chunk query here because
                        // we need full replicas information like role and location.
                    };
                });
            }));
        }

        private getReplicas(appId: string, serviceId: string, partitionId: string): Observable<ITreeNode[]> {
            // Force refresh to retrieve replica role and location information which are not available in health chunk API
            return this.data.getReplicasOnPartition(appId, serviceId, partitionId, true).pipe(map(replicas => {
                return replicas.collection.map(replica => {
                    return {
                        nodeId: IdGenerator.replica(replica.id),
                        displayName: () => replica.isStatelessService
                            ? replica.raw.NodeName
                            : `${replica.role} (${replica.raw.NodeName})`,
                        selectAction: () => this.routes.navigate(() => replica.viewPath, () => this.focusService.focus()),
                        badge: () => replica.healthState,
                        sortBy: () => replica.isStatelessService
                            ? [replica.raw.NodeName]
                            : [replica.replicaRoleSortPriority, replica.raw.NodeName],
                        actions: replica.actions,
                        canExpandAll: false
                    };
                });
            }));
        }
    }


