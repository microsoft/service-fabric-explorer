import { Injectable } from '@angular/core';
import { SystemApplication, Application } from '../Models/DataModels/Application';
import { ApplicationTypeGroupCollection, ApplicationCollection, BackupPolicyCollection, ServiceTypeCollection,
         DeployedReplicaCollection, DeployedCodePackageCollection, DeployedServicePackageCollection, ReplicaOnPartitionCollection,
         PartitionCollection, ClusterEventList, NodeEventList, ApplicationEventList, ServiceEventList, PartitionEventList, ReplicaEventList, CorrelatedEventList, EventListBase } from '../Models/DataModels/collections/Collections';
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
import { Observable, throwError, of } from 'rxjs';
import { RestClientService } from './rest-client.service';
import { map, mergeMap, finalize } from 'rxjs/operators';
import { IDataModel } from '../Models/DataModels/Base';
import { IdGenerator } from '../Utils/IdGenerator';
import { Node } from '../Models/DataModels/Node';
import { ApplicationTypeGroup, ApplicationType } from '../Models/DataModels/ApplicationType';
import { ServiceType, Service } from '../Models/DataModels/Service';
import { DeployedReplica } from '../Models/DataModels/DeployedReplica';
import { DeployedCodePackage } from '../Models/DataModels/DeployedCodePackage';
import { DeployedServicePackage } from '../Models/DataModels/DeployedServicePackage';
import { DeployedApplication } from '../Models/DataModels/DeployedApplication';
import { ReplicaOnPartition } from '../Models/DataModels/Replica';
import { Partition } from '../Models/DataModels/Partition';
import { NodeCollection } from '../Models/DataModels/collections/NodeCollection';
import { ServiceCollection } from '../Models/DataModels/collections/ServiceCollection';
import { IDataModelCollection } from '../Models/DataModels/collections/CollectionBase';
import { DeployedApplicationCollection } from '../Models/DataModels/collections/DeployedApplicationCollection';
import { MatDialog } from '@angular/material/dialog';
import { RepairTaskCollection } from '../Models/DataModels/collections/RepairTaskCollection';
import { ApplicationEvent, ClusterEvent, FabricEventBase, NodeEvent, PartitionEvent, ReplicaEvent, ServiceEvent } from '../Models/eventstore/Events';
import { EventType, IEventStoreData } from '../modules/event-store/event-store/event-store.component';
import { SettingsService } from './settings.service';
import { RepairTask } from '../Models/DataModels/repairTask';
import { ApplicationTimelineGenerator, ClusterTimelineGenerator, NodeTimelineGenerator, PartitionTimelineGenerator, RepairTaskTimelineGenerator } from '../Models/eventstore/timelineGenerators';
import groupBy from 'lodash/groupBy';
import { StandaloneIntegrationService } from './standalone-integration.service';
import { InfrastructureCollection } from '../Models/DataModels/collections/infrastructureCollection';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public systemApp: SystemApplication;
  public clusterManifest: ClusterManifest;
  public clusterHealth: ClusterHealth;
  public clusterUpgradeProgress: ClusterUpgradeProgress;
  public clusterLoadInformation: ClusterLoadInformation;
  public appTypeGroups: ApplicationTypeGroupCollection;
  public apps: ApplicationCollection;
  public nodes: NodeCollection;
  public imageStore: ImageStore;
  public backupPolicies: BackupPolicyCollection;
  public repairCollection: RepairTaskCollection;
  public infrastructureCollection: InfrastructureCollection;

  public readOnlyHeader: boolean =  null;
  public clusterNameMetadata: string = null;

  constructor(
    public routes: RoutesService,
    public message: MessageService,
    public telemetry: TelemetryService,
    public warnings: StatusWarningService,
    public storage: StorageService,
    public restClient: RestClientService,
    public dialog: MatDialog,
    public standalone: StandaloneIntegrationService,
  ) {
    this.clusterUpgradeProgress = new ClusterUpgradeProgress(this);
    this.clusterManifest = new ClusterManifest(this);
    this.clusterLoadInformation = new ClusterLoadInformation(this);
    this.apps = new ApplicationCollection(this);
    this.appTypeGroups = new ApplicationTypeGroupCollection(this);
    this.nodes = new NodeCollection(this);
    this.systemApp = new SystemApplication(this);
    this.backupPolicies = new BackupPolicyCollection(this);
    this.repairCollection = new RepairTaskCollection(this);
    this.infrastructureCollection = new InfrastructureCollection(this);
    this.clusterHealth = this.getClusterHealth(HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.None);
    if(standalone.isStandalone()) {
      this.clusterNameMetadata = standalone.clusterUrl;
      this.readOnlyHeader = !!standalone.integrationConfig.isReadOnlyMode;
    }
   }

  public actionsEnabled(): boolean {
    return this.readOnlyHeader !== true;
  }

  public actionsAdvancedEnabled(): boolean {
      return this.actionsEnabled() && this.storage.getValueBoolean(Constants.AdvancedModeKey, false);
  }

  public isAdvancedModeEnabled(): boolean {
    return this.storage.getValueBoolean(Constants.AdvancedModeKey, false);
  }

  public async versionCheck(minVersion: string): Promise<boolean> {
    const splitVersion = minVersion.split(".");
    const upgradeInfo = await this.getClusterUpgradeProgress().toPromise();
    const splitClusterVersion = upgradeInfo.raw.CodeVersion.split(".");

    let higherVersion = true;
    for(let i = 0; i < splitVersion.length; i++) {
      if(+splitVersion[i] > +splitClusterVersion[i]) {
        higherVersion = false;
        break;
      }
    }
    return higherVersion;
  }

  public getClusterHealth(
    eventsHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default,
    nodesHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default,
    applicationsHealthStateFilter: HealthStateFilterFlags = HealthStateFilterFlags.Default
  ): ClusterHealth {
    return new ClusterHealth(this, eventsHealthStateFilter, nodesHealthStateFilter, applicationsHealthStateFilter);
  }

  public getDefaultClusterHealth(forceRefresh: boolean = false, messageHandler?: IResponseMessageHandler) {
    return this.clusterHealth.ensureInitialized(forceRefresh, messageHandler).pipe(map(() => this.clusterHealth));
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
      ), map(() => this.systemApp.services));
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
      return this.nodes.ensureInitialized(forceRefresh, messageHandler).pipe(map(() => this.nodes));
  }

  public getNode(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<Node> {
      return this.getNodes(false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, name, forceRefresh, messageHandler);
      }));
  }

  public getAppTypeGroups(forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationTypeGroupCollection> {
    return this.appTypeGroups.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => this.appTypeGroups));
  }

  public getAppTypeGroup(name: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationTypeGroup> {
    return this.getAppTypeGroups(false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, name, forceRefresh, messageHandler);
    }));
  }

  public getAppType(name: string, version: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ApplicationType> {
    return this.getAppTypeGroup(name, false, messageHandler).pipe(map(appTypeGroup => {
        const filteredAppTypes = appTypeGroup.appTypes.filter(appType => appType.raw.Version === version);
        return filteredAppTypes[0];
    }));
  }

  public getServiceTypes(appTypeName: string, appTypeVersion: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceTypeCollection> {
    return this.getAppType(appTypeName, appTypeVersion, false, messageHandler).pipe(mergeMap(appType => {
        return appType.serviceTypes.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => appType.serviceTypes));
    }));
  }

  public getServiceType(appTypeName: string, appTypeVersion: string, serviceTypeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceType> {
    return this.getServiceTypes(appTypeName, appTypeVersion, false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, serviceTypeName, forceRefresh, messageHandler);
    }));
  }

  public getServices(appId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ServiceCollection> {
    const getAppPromise = appId === Constants.SystemAppId
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

  // eslint-disable-next-line max-len
  public getReplicaOnPartition(appId: string, serviceId: string, partitionId: string, replicaId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<ReplicaOnPartition> {
      return this.getReplicasOnPartition(appId, serviceId, partitionId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.replica(replicaId), forceRefresh, messageHandler);
      }));
  }

  public getDeployedApplications(nodeName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedApplicationCollection> {
      return this.getNode(nodeName, false, messageHandler).pipe(mergeMap(node => {
          return node.deployedApps.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => node.deployedApps));
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

  // eslint-disable-next-line max-len
  public getDeployedServicePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedServicePackage> {
      return this.getDeployedServicePackages(nodeName, appId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.deployedServicePackage(servicePackageName, servicePackageActivationId), forceRefresh, messageHandler);
      }));
  }

  // eslint-disable-next-line max-len
  public getDeployedCodePackages(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedCodePackageCollection> {
      return this.getDeployedServicePackage(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(deployedServicePackage => {
          return deployedServicePackage.deployedCodePackages.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => deployedServicePackage.deployedCodePackages));
      }));
  }

  // eslint-disable-next-line max-len
  public getDeployedCodePackage(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, codePackageName: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedCodePackage> {
      return this.getDeployedCodePackages(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(collection => {
          return this.tryGetValidItem(collection, IdGenerator.deployedCodePackage(codePackageName), forceRefresh, messageHandler);
      }));
  }

// eslint-disable-next-line max-len
  public getDeployedReplicas(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedReplicaCollection> {
      return this.getDeployedServicePackage(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(deployedServicePackage => {
          return deployedServicePackage.deployedReplicas.ensureInitialized(forceRefresh, messageHandler).pipe(map( () => deployedServicePackage.deployedReplicas));
      }));
  }

    // eslint-disable-next-line max-len
  public getDeployedReplica(nodeName: string, appId: string, servicePackageName: string, servicePackageActivationId: string, partitionId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<DeployedReplica> {
    return this.getDeployedReplicas(nodeName, appId, servicePackageName, servicePackageActivationId, false, messageHandler).pipe(mergeMap(collection => {
        return this.tryGetValidItem(collection, IdGenerator.deployedReplica(partitionId), forceRefresh, messageHandler);
      }));
  }

  public refreshBackupPolicies(messageHandler: IResponseMessageHandler): Observable<any> {
    return this.clusterManifest.ensureInitialized().pipe(mergeMap(() => {
        if (this.clusterManifest.isBackupRestoreEnabled){
            return this.backupPolicies.refresh(messageHandler);
        }else{
            return of(null);
        }
      }));
  }

  public getRepairJobById(id: string): Observable<RepairTask> {
    return this.repairCollection.ensureInitialized().pipe(mergeMap((collection) => {
      return this.tryGetValidItem(this.repairCollection, id);
    }));
  }

    private addFabricEventData<T extends EventListBase<any>, S extends FabricEventBase>(data: IEventStoreData<T, S>){
        data.listSettings = data.eventsList.settings;
        data.getEvents = () => data.eventsList.collection.map(event => event.raw);
        data.setDateWindow = (startDate: Date, endDate: Date) => data.eventsList.setDateWindow(startDate, endDate);
        data.objectResolver = (id: string) => data.eventsList.collection.find(item => item.raw.eventInstanceId === id);
        return data;
    }

    public getRepairTasksData(settings: SettingsService): IEventStoreData<RepairTaskCollection, RepairTask>{
        return {
            eventsList: this.repairCollection,
            type: "RepairTask",
            displayName: 'Repair Tasks',
            listSettings: settings.getNewOrExistingCompletedRepairTaskListSettings(),
            getEvents: () => this.repairCollection.collection,
            objectResolver:  (id: string) => {
              return this.repairCollection.collection.find(task => task.raw.TaskId === id);
            }
        };
    }

    public getClusterEventData(): IEventStoreData<ClusterEventList, ClusterEvent>{
        const list = new ClusterEventList(this);
        const d : IEventStoreData<ClusterEventList, ClusterEvent> = {
            eventsList : list,
            type : "Cluster",
            displayName : 'Cluster',
        };

        this.addFabricEventData<ClusterEventList, ClusterEvent>(d);
        return d;
    }

    public getNodeEventData(nodeName?: string): IEventStoreData<NodeEventList, NodeEvent>{
        const list = new NodeEventList(this, nodeName);
        const d: IEventStoreData<NodeEventList, NodeEvent> = {
            eventsList: list,
            type: "Node",
            displayName: nodeName ? nodeName : 'Nodes',
        };

        this.addFabricEventData<NodeEventList, NodeEvent>(d);
        return d;
    }

    public getApplicationEventData(applicationId?: string): IEventStoreData<ApplicationEventList, ApplicationEvent> {
        const list = new ApplicationEventList(this, applicationId);
        const d: IEventStoreData<ApplicationEventList, ApplicationEvent> = {
            eventsList : list,
            type : applicationId ? "Application" : null,
            displayName : applicationId ? applicationId : 'Apps',
        };

        this.addFabricEventData<ApplicationEventList, ApplicationEvent>(d);
        return d;
    }

    public getServiceEventData(serviceId?: string): IEventStoreData<ServiceEventList, ServiceEvent> {
        const list = new ServiceEventList(this, serviceId);
        const d = {
            eventsList : list,
            displayName : serviceId
        };

        this.addFabricEventData<ServiceEventList, ServiceEvent>(d);
        return d;
    }

    public getPartitionEventData(partitionId?: string): IEventStoreData<PartitionEventList, PartitionEvent> {
        const list = new PartitionEventList(this, partitionId);
        const d: IEventStoreData<PartitionEventList, PartitionEvent> = {
            eventsList : list,
            type : "Partition",
            displayName : partitionId
        };

        this.addFabricEventData<PartitionEventList, PartitionEvent>(d);
        return d;
    }

    public getReplicaEventData(partitionId: string, replicaId?: string): IEventStoreData<ReplicaEventList, ReplicaEvent> {
        const list = new ReplicaEventList(this, partitionId, replicaId);
        const d: IEventStoreData<ReplicaEventList, ReplicaEvent> = {
            eventsList : list,
            displayName : replicaId || partitionId + " replicas",
            type: "Replica"
        };

        this.addFabricEventData<ReplicaEventList, ReplicaEvent>(d);
        return d;
    }

    public createCorrelatedEventList(eventInstanceId: string) {
        return new CorrelatedEventList(this, eventInstanceId);
    }

  private tryGetValidItem<T extends IDataModel<any>>(collection: IDataModelCollection<T>, uniqueId: string, forceRefresh?: boolean, messageHandler?: IResponseMessageHandler): Observable<any> {
    const item = collection.find(uniqueId);
    if (item) {
        return item.ensureInitialized(forceRefresh, messageHandler);
    } else {
      return throwError('This item could not be found ' + uniqueId);
    }
  }

  private preprocessHealthChunkData(clusterHealthChunk: IClusterHealthChunk): IClusterHealthChunk {
    // Move system app to be a standalone object to match the tree structure
    clusterHealthChunk.SystemApplicationHealthStateChunk = clusterHealthChunk.ApplicationHealthStateChunks.Items.filter(
        appHealthStateChunk => appHealthStateChunk.ApplicationName === Constants.SystemAppName)[0];

    const deployedApps: IDeployedApplicationHealthStateChunk[] = [];

    // Add application name to deployed application health chunk
    clusterHealthChunk.ApplicationHealthStateChunks.Items.forEach(appHealthStateChunk =>
      appHealthStateChunk.DeployedApplicationHealthStateChunks.Items.forEach(deployedApp => {
            deployedApp.ApplicationName = appHealthStateChunk.ApplicationName;
            deployedApps.push(deployedApp);
        }));

    // TODO
    const nodeDeployedAppsGroups = groupBy(deployedApps, deployedApp => deployedApp.NodeName);
    Object.keys(nodeDeployedAppsGroups).forEach(key => {
        const group = nodeDeployedAppsGroups[key];

        const nodeHealthChunk = clusterHealthChunk.NodeHealthStateChunks.Items.find(chunk => chunk.NodeName === key);
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
