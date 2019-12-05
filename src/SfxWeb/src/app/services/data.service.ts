import { Injectable } from '@angular/core';
import { SystemApplication, Application } from '../Models/DataModels/Application';
import { ApplicationTypeGroupCollection, ApplicationCollection, NetworkCollection, BackupPolicyCollection, ServiceCollection, IDataModelCollection, ServiceTypeCollection, DeployedReplicaCollection, DeployedCodePackageCollection, DeployedServicePackageCollection, DeployedApplicationCollection, ReplicaOnPartitionCollection, PartitionCollection } from '../Models/DataModels/collections/Collections';
import { RoutesService } from './routes.service';
import { MessageService } from './message.service';
import { TelemetryService } from './telemetry.service';
import { StatusWarningService } from './status-warning.service';
import { StorageService } from './storage.service';
import { HealthStateFilterFlags, IClusterHealthChunkQueryDescription, IClusterHealthChunk, IDeployedApplicationHealthStateChunk } from '../Models/HealthChunkRawDataTypes';
import { ClusterUpgradeProgress, ClusterLoadInformation, ClusterManifest, ClusterHealth } from '../Models/DataModels/Cluster';
import { ImageStore } from '../Models/DataModels/ImageStore';
import { Constants } from '../Common/Constants';
import { IResponseMessageHandler, ResponseMessageHandlers } from '../Common/ResponseMessageHandlers';
import { Observable, throwError } from 'rxjs';
import { RestClientService } from './rest-client.service';
import { map, mergeMap } from 'rxjs/operators';
import { IDataModel } from '../Models/DataModels/Base';
import { IdGenerator } from '../Utils/IdGenerator';
import { Node } from '../Models/DataModels/Node';
import { Network } from '../Models/DataModels/Network';
import { ApplicationTypeGroup, ApplicationType } from '../Models/DataModels/ApplicationType';
import { ServiceType, Service } from '../Models/DataModels/Service';
import { DeployedReplica } from '../Models/DataModels/DeployedReplica';
import { DeployedCodePackage } from '../Models/DataModels/DeployedCodePackage';
import { DeployedServicePackage } from '../Models/DataModels/DeployedServicePackage';
import { DeployedApplication } from '../Models/DataModels/DeployedApplication';
import { ReplicaOnPartition } from '../Models/DataModels/Replica';
import { Partition } from '../Models/DataModels/Partition';
import { NodeCollection } from '../Models/DataModels/collections/NodeCollection';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public systemApp: SystemApplication;
  public clusterManifest: ClusterManifest;
  public clusterUpgradeProgress: ClusterUpgradeProgress;
  public clusterLoadInformation: ClusterLoadInformation;
  public appTypeGroups: ApplicationTypeGroupCollection;
  public apps: ApplicationCollection;
  public nodes: NodeCollection;
  public imageStore: ImageStore;
  public networks: NetworkCollection;
  public backupPolicies: BackupPolicyCollection;

  constructor(
    public routes: RoutesService,
    public message: MessageService,
    public telemetry: TelemetryService,
    public warnings: StatusWarningService,
    public storage: StorageService,
    public restClient: RestClientService
    // public $q: angular.IQService,
    // public $timeout: angular.ITimeoutService,
    // public $uibModal: angular.ui.bootstrap.IModalService,
    // public $route: angular.route.IRouteService,
    // public $sanitize: angular.sanitize.ISanitizeService,
    // public $rootScope: angular.IRootScopeService
    // public $location: angular.ILocationService,
  ) {
    this.clusterUpgradeProgress = new ClusterUpgradeProgress(this);
    this.clusterManifest = new ClusterManifest(this);
    this.clusterLoadInformation = new ClusterLoadInformation(this);
    this.apps = new ApplicationCollection(this);
    this.appTypeGroups = new ApplicationTypeGroupCollection(this);
    this.nodes = new NodeCollection(this);
    this.systemApp = new SystemApplication(this);
   }


  // TODO the state of whether or not actions are enabled should be stored here and set using an http interceptor
  public actionsEnabled(): boolean {
    return true;
    //return this.$rootScope[Constants.SfxReadonlyMetadataName] !== true;
  }

  public actionsAdvancedEnabled(): boolean {
      return this.actionsEnabled && this.storage.getValueBoolean(Constants.AdvancedModeKey, false);
  }

  public getClusterHealth(
    eventsHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default,
    nodesHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default,
    applicationsHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default
  ): ClusterHealth {
    return new ClusterHealth(this, eventsHealthStateFilter, nodesHealthStateFilter, applicationsHealthStateFilter);
  }

  public getClusterManifest(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler): Observable<ClusterManifest> {
    return this.clusterManifest.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => this.clusterManifest));
  }

  public getClusterUpgradeProgress(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler): Observable<ClusterUpgradeProgress> {
      return this.clusterUpgradeProgress.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => this.clusterUpgradeProgress));
  }

  public getClusterLoadInformation(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler): Observable<ClusterLoadInformation> {
      return this.clusterLoadInformation.ensureInitialized(forceRefresh, messageHandler);
  }

  public getClusterHealthChunk(healthDescriptor: IClusterHealthChunkQueryDescription): Observable<IClusterHealthChunk> {
      // Will not report cluster chunk api errors
      return this.restClient.getClusterHealthChunk(healthDescriptor, ResponseMessageHandlers.silentResponseMessageHandler).pipe(map((raw: any) => {
          // Rre-process the health chunk data in order to match the SFX tree structure
          return this.preprocessHealthChunkData(raw);
      }));
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

  public getSystemApp(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<SystemApplication> {
    return this.systemApp.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => this.systemApp));
  }

  public getSystemServices(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceCollection> {
      return this.getSystemApp(false, messageHandler).pipe(mergeMap(app => app.services.ensureInitialized(forceRefresh, messageHandler)
      ),map(app => app.services));
  }

  public getApps(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationCollection> {
      return this.apps.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => this.apps));
  }

  public getApp(id: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<Application> {
      return this.getApps(false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, id, forceRefresh, messageHandler);
      }));
  }

  public getNodes(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<NodeCollection> {
      return this.nodes.ensureInitialized(forceRefresh, messageHandler);
  }

  public getNode(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<Node> {
      return this.getNodes(false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, name, forceRefresh, messageHandler);
      }));
  }

  public getNetwork(networkName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<Network> {
    return this.getNetworks(false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, networkName, forceRefresh, messageHandler);
    }));
  }

  public getNetworks(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<NetworkCollection> {
    return this.networks.ensureInitialized(forceRefresh, messageHandler);
  }

  public getAppTypeGroups(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationTypeGroupCollection> {
    return this.appTypeGroups.ensureInitialized(forceRefresh, messageHandler);
  }

  public getAppTypeGroup(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationTypeGroup> {
    return this.getAppTypeGroups(false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, name, forceRefresh, messageHandler);
    }));
  }

  public getAppType(name: string, version: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationType> {
    return this.getAppTypeGroup(name, false, messageHandler).pipe(map(appTypeGroup => {
        let filteredAppTypes = appTypeGroup.appTypes.filter(appType => appType.raw.Version === version);
        return filteredAppTypes[0];
    }));
  }

  public getServiceTypes(appTypeName: string, appTypeVersion: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceTypeCollection> {
    return this.getAppType(appTypeName, appTypeVersion, false, messageHandler).pipe(mergeMap(appType => {
        return appType.serviceTypes.ensureInitialized(forceRefresh, messageHandler), map( () => appType.serviceTypes);
    }));
  }

  public getServiceType(appTypeName: string, appTypeVersion: string, serviceTypeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceType> {
    return this.getServiceTypes(appTypeName, appTypeVersion, false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, serviceTypeName, forceRefresh, messageHandler);
    }));
  }

  public getServices(appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceCollection> {
    let getAppPromise = appId === Constants.SystemAppId
        ? this.getSystemApp(false, messageHandler)
        : this.getApp(appId, false, messageHandler);

    return getAppPromise.pipe(mergeMap(app => {
        return app.services.ensureInitialized(forceRefresh, messageHandler).pipe( map( () => app.services));
    }));
  }

  public getService(appId: string, serviceId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<Service> {
    return this.getServices(appId, false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, IdGenerator.service(serviceId), forceRefresh, messageHandler);
    }));
  }

  public getPartitions(appId: string, serviceId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<PartitionCollection> {
    return this.getService(appId, serviceId, false, messageHandler).pipe(mergeMap(service => {
        return service.partitions.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => service.partitions));
    }));
  }

  public getPartition(appId: string, serviceId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<Partition> {
      return this.getPartitions(appId, serviceId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.partition(partitionId), forceRefresh, messageHandler);
      }));
  }

  public getReplicasOnPartition(appId: string, serviceId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ReplicaOnPartitionCollection> {
      return this.getPartition(appId, serviceId, partitionId, false, messageHandler).pipe(mergeMap(partition => {
          return partition.replicas.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => partition.replicas));
      }));
  }

  public getReplicaOnPartition(appId: string, serviceId: string, partitionId: string, replicaId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ReplicaOnPartition> {
      return this.getReplicasOnPartition(appId, serviceId, partitionId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.replica(replicaId), forceRefresh, messageHandler);
      }));
  }

  public getDeployedApplications(nodeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedApplicationCollection> {
      return this.getNode(nodeName, false, messageHandler).pipe(mergeMap(node => {
          return node.deployedApps.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => node.deployedApps))
      }));
  }

  public getDeployedApplication(nodeName: string, appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedApplication> {
      return this.getDeployedApplications(nodeName, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.app(appId), forceRefresh, messageHandler);
      }));
  }

  public getDeployedServicePackages(nodeName: string, appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedServicePackageCollection> {
      return this.getDeployedApplication(nodeName, appId, false, messageHandler).pipe(mergeMap(deployedApp => {
          return deployedApp.deployedServicePackages.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => deployedApp.deployedServicePackages));
      }));
  }

  public getDeployedServicePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedServicePackage> {
      return this.getDeployedServicePackages(nodeName, appId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.deployedServicePackage(servicePackageName, servicePackageActivationId), forceRefresh, messageHandler);
      }));
  }

  public getDeployedCodePackages(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedCodePackageCollection> {
      return this.getDeployedServicePackage(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(deployedServicePackage => {
          return deployedServicePackage.deployedCodePackages.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => deployedServicePackage.deployedCodePackages));
      }));
  }

  public getDeployedCodePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, codePackageName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedCodePackage> {
      return this.getDeployedCodePackages(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.deployedCodePackage(codePackageName), forceRefresh, messageHandler);
      }));
  }

  public getDeployedReplicas(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedReplicaCollection> {
      return this.getDeployedServicePackage(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(deployedServicePackage => {
          return deployedServicePackage.deployedReplicas.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => deployedServicePackage.deployedReplicas));
      }));
  }

  public getDeployedReplica(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedReplica> {
      return this.getDeployedReplicas(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.deployedReplica(partitionId), forceRefresh, messageHandler);
      }));
  }

  private tryGetValidItem<T extends IDataModel<any>>(collection: IDataModelCollection<T>, uniqueId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<any> {
    let item = collection.find(uniqueId);
    if (item) {
        console.log(item)
        return item.ensureInitialized(forceRefresh, messageHandler);
    } else {
        console.log("error getting valid item")
        return throwError(null);
    }
  } 

  private preprocessHealthChunkData(clusterHealthChunk: IClusterHealthChunk): IClusterHealthChunk {
    // Move system app to be a standalone object to match the tree structure
    clusterHealthChunk.SystemApplicationHealthStateChunk = clusterHealthChunk.ApplicationHealthStateChunks.Items.filter(
        appHealthStateChunk => appHealthStateChunk.ApplicationName === Constants.SystemAppName)[0];

    let deployedApps: IDeployedApplicationHealthStateChunk[] = [];

    // Add application name to deployed application health chunk
    clusterHealthChunk.ApplicationHealthStateChunks.Items.forEach(appHealthStateChunk => 
      appHealthStateChunk.DeployedApplicationHealthStateChunks.Items.forEach(deployedApp => {
            deployedApp.ApplicationName = appHealthStateChunk.ApplicationName;
            deployedApps.push(deployedApp);
        }));

    // Assign deployed apps under their belonging nodes
    let nodeDeployedAppsGroups = deployedApps.reduce( (previous, current) => { 
        if( current.NodeName in previous){
            previous[current.NodeName].push(current);
        }else{
            previous[current.NodeName] = [current]
        }
        return previous}, {});
    
    // TODO 
    //let nodeDeployedAppsGroups = _.groupBy(deployedApps, deployedApp => deployedApp.NodeName);
    Object.keys(nodeDeployedAppsGroups).forEach(key => {
        const group = nodeDeployedAppsGroups[key];

        let nodeHealthChunk = clusterHealthChunk.NodeHealthStateChunks.Items.find(chunk => chunk.NodeName === key);
        if (nodeHealthChunk) {
            nodeHealthChunk.DeployedApplicationHealthStateChunks = {
                Items: group,
                TotalCount: group.length
            };
        }
    });

    // Assign empty array to the DeployedApplicationHealthStateChunks to avoid null check.
    clusterHealthChunk.NodeHealthStateChunks.Items.forEach(nodeHealthChunk => {
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
