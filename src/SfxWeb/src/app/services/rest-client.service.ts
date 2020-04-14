import { Injectable } from '@angular/core';
import { MessageService, MessageSeverity } from './message.service';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { HealthStateFilterFlags, IClusterHealthChunkQueryDescription } from '../Models/HealthChunkRawDataTypes';
import { IResponseMessageHandler, ResponseMessageHandlers } from '../Common/ResponseMessageHandlers';
import { Observable, of, Observer, throwError, from } from 'rxjs';
import { IRawCollection, IRawClusterManifest, IRawClusterHealth, IRawClusterUpgradeProgress, IRawClusterLoadInformation, IRawNetwork, IRawNetworkOnApp, 
         IRawNetworkOnNode, IRawAppOnNetwork, IRawNodeOnNetwork, IRawDeployedContainerOnNetwork, IRawNode, IRawBackupPolicy, IRawApplicationBackupConfigurationInfo, 
         IRawServiceBackupConfigurationInfo, IRawBackupProgressInfo, IRawRestoreProgressInfo, IRawPartitionBackupConfigurationInfo, IRawPartitionBackup, IRawNodeHealth, 
         IRawNodeLoadInformation, IRawDeployedApplication, IRawApplicationHealth, IRawDeployedServicePackage, IRawDeployedServicePackageHealth, IRawServiceManifest, 
         IRawDeployedReplica, IRawServiceType, IRawDeployedCodePackage, IRawContainerLogs, IRawDeployedReplicaDetail, IRawApplicationType, IRawApplicationManifest, 
         IRawApplication, IRawService, IRawCreateServiceDescription, IRawCreateServiceFromTemplateDescription, IRawUpdateServiceDescription, IRawServiceDescription, 
         IRawServiceHealth, IRawApplicationUpgradeProgress, IRawCreateComposeDeploymentDescription, IRawPartition, IRawPartitionHealth, IRawPartitionLoadInformation, 
         IRawReplicaOnPartition, IRawReplicaHealth, IRawImageStoreContent, IRawStoreFolderSize, IRawClusterVersion, IRawList, IRawAadMetadataMetadata, IRawAadMetadata, IRawStorage, IRawRepairTask } from '../Models/RawDataTypes';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { Application } from '../Models/DataModels/Application';
import { Service } from '../Models/DataModels/Service';
import { Partition } from '../Models/DataModels/Partition';
import { ClusterEvent, NodeEvent, ApplicationEvent, ServiceEvent, PartitionEvent, ReplicaEvent, FabricEvent, EventsResponseAdapter, FabricEventBase } from '../Models/eventstore/Events';
import { StandaloneIntegration, IHttpRequest, IHttpResponse } from '../Common/StandaloneIntegration';
import { AadMetadata } from '../Models/DataModels/Aad';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestClientService {

  private static defaultApiVersion: string = "3.0";
  private static apiVersion40: string = "4.0";
  private static apiVersion60: string = "6.0";
  private static apiVersion62Preview: string = "6.2-preview";
  private static apiVersion64: string = "6.4";
  private static apiVersion65: string = "6.5";

  private cacheAllowanceToken: number = Date.now().valueOf();

  private requestCount: number = 0;
  private requestStarted: { (param: number): void; }[] = [];
  private requestEnded: { (param: number): void; }[] = [];
  private allRequestsComplete: { (): void; }[] = [];

  constructor(private httpClient: HttpClient, private message: MessageService) {
      this.registerRequestEndedCallback(requestCount => {
          if (requestCount === 0) {
              this.allRequestsComplete = [];
          }
      });
  }

  public invalidateBrowserRestResponseCache(): void {
      this.cacheAllowanceToken = Date.now().valueOf();
  }

  public registerRequestStartedCallback(callback: (number) => void): RestClientService {
      this.requestStarted.push(callback);
      return this;
  }

  public registerRequestEndedCallback(callback: (number) => void): RestClientService {
      this.requestEnded.push(callback);
      return this;
  }

  public registerAllRequestsCompleteCallback(callback: () => void): void {
      if (this.requestCount === 0) {
          callback();
      } else {
          this.allRequestsComplete.push(callback);
      }
  }

  public getClusterHealth(
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      nodesHealthStateFilter: number = HealthStateFilterFlags.Default,
      applicationsHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawClusterHealth> {

      let url = `$/GetClusterHealth?NodesHealthStateFilter=${nodesHealthStateFilter}`
          + `&ApplicationsHealthStateFilter=${applicationsHealthStateFilter}&EventsHealthStateFilter=${eventsHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get cluster health", messageHandler);
  }

  public getClusterManifest(messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> {
      return this.get(this.getApiUrl("$/GetClusterManifest"), "Get cluster manifest", messageHandler);
  }

  public getClusterUpgradeProgress(messageHandler?: IResponseMessageHandler): Observable<IRawClusterUpgradeProgress> {
      return this.get(this.getApiUrl("$/GetUpgradeProgress"), "Get cluster upgrade progress", messageHandler);
  }

  public getClusterLoadInformation(messageHandler?: IResponseMessageHandler): Observable<IRawClusterLoadInformation> {
      return this.get(this.getApiUrl("$/GetLoadInformation"), "Get cluster load information", messageHandler);
  }

  public getClusterHealthChunk(healthDescriptor: IClusterHealthChunkQueryDescription, messageHandler?: IResponseMessageHandler): Observable<{}> {
      return this.post(this.getApiUrl("$/GetClusterHealthChunk"), "Get cluster health chunk", healthDescriptor, messageHandler);
  }

  public getDeployedContainersOnNetwork(networkName: string, nodeName: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedContainerOnNetwork[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetNetworks/" + encodeURIComponent(networkName) + "/$/GetCodePackages";
      return this.getFullCollection<IRawDeployedContainerOnNetwork>(url, "Get containers on network", RestClientService.apiVersion60);
  }

  public getNodes(messageHandler?: IResponseMessageHandler): Observable<IRawNode[]> {
      return this.getFullCollection<IRawNode>("Nodes/", "Get nodes");
  }

  public getNode(nodeName: string, messageHandler?: IResponseMessageHandler): Observable<IRawNode> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/";
      return this.get(this.getApiUrl(url), "Get node", messageHandler);
  }

  ///$/GetAadMetadata?api-version=6.0

  public getAADmetadata(messageHandler?: IResponseMessageHandler): Observable<AadMetadata> {
    let url = "$/GetAadMetadata/"
    return this.get<IRawAadMetadata>(this.getApiUrl(url, RestClientService.apiVersion60), "Get aadmetadata", messageHandler).pipe(map(data => new AadMetadata(data)));
}


  public getBackupPolicies(messageHandler?: IResponseMessageHandler):Observable<IRawBackupPolicy[]> {
      return this.getFullCollection<IRawBackupPolicy>("BackupRestore/BackupPolicies/", "Get backup Policies", RestClientService.apiVersion64);
  }

  public getApplicationBackupConfigurationInfoCollection(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawApplicationBackupConfigurationInfo[]> {
      return this.getFullCollection<IRawApplicationBackupConfigurationInfo>("Applications/" + encodeURIComponent(applicationId) + "/$/GetBackupConfigurationInfo", "Gets the application backup configuration information", RestClientService.apiVersion64, messageHandler);
  }

  public getServiceBackupConfigurationInfoCollection(serviceId: string, messageHandler?: IResponseMessageHandler): Observable<IRawServiceBackupConfigurationInfo[]> {
      return this.getFullCollection<IRawServiceBackupConfigurationInfo>("Services/" + encodeURIComponent(serviceId) + "/$/GetBackupConfigurationInfo", "Gets the application backup configuration information", RestClientService.apiVersion64, messageHandler);
  }

  public getPartitionBackupProgress(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawBackupProgressInfo> {
      return this.get(this.getApiUrl("Partitions/" + encodeURIComponent(partitionId) + "/$/GetBackupProgress", RestClientService.apiVersion64), "Gets the partition backup progress", messageHandler);
  }

  public getPartitionRestoreProgress(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawRestoreProgressInfo> {
      return this.get(this.getApiUrl("Partitions/" + encodeURIComponent(partitionId) + "/$/GetRestoreProgress", RestClientService.apiVersion64), "Gets the partition restore progress", messageHandler);
  }

  public getPartitionBackupConfigurationInfo(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawPartitionBackupConfigurationInfo> {
      return this.get(this.getApiUrl("Partitions/" + encodeURIComponent(partitionId) + "/$/GetBackupConfigurationInfo", RestClientService.apiVersion64), "Gets the partition backup configuration information", messageHandler);
  }

  public getLatestPartitionBackup(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawPartitionBackup[]> {
      return this.getFullCollection2<IRawPartitionBackup>("Partitions/" + encodeURIComponent(partitionId) + "/$/GetBackups", "Gets the latest partition backup", RestClientService.apiVersion64, messageHandler, undefined, undefined, undefined, undefined, true);
  }

  public getPartitionBackupList(partitionId: string, messageHandler?: IResponseMessageHandler, startDate?: Date, endDate?: Date, maxResults?: number): Observable<IRawPartitionBackup[]> {
      return this.getFullCollection2<IRawPartitionBackup>("Partitions/" + encodeURIComponent(partitionId) + "/$/GetBackups", "Gets the partition backup list", RestClientService.apiVersion64, messageHandler, undefined, startDate, endDate, maxResults);
  }

  public getBackupPolicy(backupName: string, messageHandler?: IResponseMessageHandler): Observable<IRawBackupPolicy> {
      let url = "BackupRestore/BackupPolicies/" + encodeURIComponent(backupName) + "/";
      return this.get(this.getApiUrl(url, RestClientService.apiVersion64), "Get backup policy", messageHandler);
  }

  public getNodeHealth(nodeName: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawNodeHealth> {

      let url = `Nodes/${encodeURIComponent(nodeName)}/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get node health", messageHandler);
  }

  public getNodeLoadInformation(nodeName: string, messageHandler?: IResponseMessageHandler): Observable<IRawNodeLoadInformation> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetLoadInformation";
      return this.get(this.getApiUrl(url), "Get node load information", messageHandler);
  }

  public restartNode(nodeName: string, nodeInstanceId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/Restart";

      let body = {
          "NodeInstanceId": nodeInstanceId
      };

      return this.post(this.getApiUrl(url), "Node restart", body, messageHandler);
  }

  public getDeployedApplications(nodeName: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedApplication[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetApplications";
      return this.get(this.getApiUrl(url), "Get applications", messageHandler);
  }

  public getDeployedApplication(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedApplication> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId);

      return this.get(this.getApiUrl(url), "Get deployed applications", messageHandler);
  }

  public getDeployedApplicationHealth(
      nodeName: string, applicationId: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      deployedServicePackagesHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler
  ): Observable<IRawApplicationHealth> {

      let url = `Nodes/${encodeURIComponent(nodeName)}/$/GetApplications/${encodeURIComponent(applicationId)}/$/GetHealth`
          + `?EventsHealthStateFilter=${eventsHealthStateFilter}&DeployedServicePackagesHealthStateFilter=${deployedServicePackagesHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get application health", messageHandler);
  }

  public getDeployedServicePackages(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedServicePackage[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetServicePackages";

      return this.get(this.getApiUrl(url), "Get deployed service packages", messageHandler);
  }

  public getDeployedServicePackage(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedServicePackage[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetServicePackages/" + encodeURIComponent(servicePackageName);

      return this.get(this.getApiUrl(url), "Get deployed service package on application", messageHandler);
  }

  public getDeployedServicePackageHealth(nodeName: string, applicationId: string, servicePackageName: string,
      servicePackageActivationId: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawDeployedServicePackageHealth> {

      let url = `Nodes/${encodeURIComponent(nodeName)}/$/GetApplications/${encodeURIComponent(applicationId)}`
          + `/$/GetServicePackages/${encodeURI(servicePackageName)}`
          + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}`
          + (servicePackageActivationId ? `&ServicePackageActivationId=${servicePackageActivationId}` : "");

      return this.get(this.getApiUrl(url), "Get deployed service package health", messageHandler);
  }

  public getServiceManifest(appTypeName: string, appTypeVersion: string, serviceManifestName: string, messageHandler?: IResponseMessageHandler): Observable<IRawServiceManifest> {
      let url = "ApplicationTypes/" + encodeURIComponent(appTypeName)
          + "/$/GetServiceManifest";

      let formedUrl = this.getApiUrl(url) + "&ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion)
          + "&ServiceManifestName=" + encodeURIComponent(serviceManifestName);

      return this.get(formedUrl, "Get service manifest for application type", messageHandler);
  }

  public getServiceTypes(appTypeName: string, appTypeVersion: string, messageHandler?: IResponseMessageHandler): Observable<IRawServiceType[]> {
      let url = "ApplicationTypes/" + encodeURIComponent(appTypeName)
          + "/$/GetServiceTypes?ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion);

      let formedUrl = this.getApiUrl(url) + "&ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion);

      return this.get(formedUrl, "Get service types for application type", messageHandler);
  }

  public getDeployedReplicas(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedReplica[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetReplicas";

      let formedUrl = this.getApiUrl(url)
          + "&ServiceManifestName=" + encodeURIComponent(servicePackageName);

      return this.get(formedUrl, "Get replicas on service", messageHandler);
  }

  public getDeployedCodePackages(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedCodePackage[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetCodePackages";

      let formedUrl = this.getApiUrl(url)
          + "&ServiceManifestName=" + encodeURIComponent(servicePackageName);

      return this.get(formedUrl, "Get deployed code packages", messageHandler);
  }

  public getDeployedCodePackage(nodeName: string, applicationId: string, servicePackageName: string, codePackageName: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedCodePackage[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetCodePackages";

      let formedUrl = this.getApiUrl(url)
          + "&ServiceManifestName=" + encodeURIComponent(servicePackageName)
          + "&CodePackageName=" + encodeURIComponent(codePackageName);

      return this.get(formedUrl, "Get deployed code package", messageHandler);
  }

  public getDeployedContainerLogs(nodeName: string, applicationId: string, servicePackageName: string, codePackageName: string, servicePackageActivationId: string, tail: string, messageHandler?: IResponseMessageHandler): Observable<IRawContainerLogs> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetCodePackages"
          + "/$/ContainerLogs";

      let formedUrl = this.getApiUrl(url)
          + "&ServiceManifestName=" + encodeURIComponent(servicePackageName)
          + "&CodePackageName=" + encodeURIComponent(codePackageName)
          + "&ServicePackageActivationId=" + encodeURIComponent(servicePackageActivationId)
          + "&Tail=" + encodeURIComponent(tail);

      return this.get(formedUrl, "Get deployed container logs", messageHandler);
  }

  public restartCodePackage(nodeName: string, applicationId: string, serviceManifestName: string, codePackageName: string, codePackageInstanceId: string, servicePackageActivationId?: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetCodePackages/$/Restart";

      let body: any = {
          "ServiceManifestName": serviceManifestName,
          "CodePackageName": codePackageName,
          "CodePackageInstanceId": codePackageInstanceId
      };

      if (servicePackageActivationId) {
          body["ServicePackageActivationId"] = servicePackageActivationId;
      }

      return this.post(this.getApiUrl(url), "Code package restart", body, messageHandler);
  }

  // PartitionID along with the other params us enough to identify the Replica. Replica/InstanceId is Not unique nor an identifier.
  // TODO: Potential refactor: have this return the singular [by transforming the data we get back] as we expact only a single item in the returned array.
  public getDeployedReplica(nodeName: string, applicationId: string, servicePackageName: string, partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedReplica[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetReplicas";

      let formedUrl = this.getApiUrl(url)
          + "&PartitionId=" + encodeURIComponent(partitionId)
          + "&ServiceManifestName=" + encodeURIComponent(servicePackageName);

      return this.get(formedUrl, "Get deployed replica", messageHandler);
  }

  public getDeployedReplicaDetail(nodeName: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedReplicaDetail> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetPartitions/" + encodeURIComponent(partitionId)
          + "/$/GetReplicas/" + encodeURIComponent(replicaId)
          + "/$/GetDetail";

      return this.get(this.getApiUrl(url), "Get deployed replica detail", messageHandler);
  }

  public getApplicationTypes(appTypeName?: string, messageHandler?: IResponseMessageHandler): Observable<IRawApplicationType[]> {
      if (appTypeName) {
          return this.get(this.getApiUrl("ApplicationTypes/" + encodeURIComponent(appTypeName)), "Get application type");
      }

      return this.get(this.getApiUrl("ApplicationTypes/"), "Get application types", messageHandler);
  }

  public getApplicationManifestForApplicationType(appTypeName: string, appTypeVersion: string, messageHandler?: IResponseMessageHandler): Observable<IRawApplicationManifest> {
      let url = "ApplicationTypes/" + encodeURIComponent(appTypeName)
          + "/$/GetApplicationManifest?ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion);
      return this.get(this.getApiUrl(url), "Get application manifest for application type");
  }

  public provisionApplication(name: string, appTypeName: string, appTypeVersion, messageHandler?: IResponseMessageHandler): Observable<any> {
      let url = "Applications/$/Create";

      let body: any = {
          "Name": name,
          "TypeName": appTypeName,
          "TypeVersion": appTypeVersion
      };

      return this.post(this.getApiUrl(url), "Application instance creation", body, messageHandler);
  }

  public activateNode(nodeName: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/Activate";
      return this.post(this.getApiUrl(url), "Node Activation", null, messageHandler);
  }

  public deactivateNode(nodeName: string, intent: number, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/Deactivate";
      return this.post(this.getApiUrl(url), "Node deactivation", { "DeactivationIntent": intent }, messageHandler);
  }

  public removeNodeState(nodeName: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/RemoveNodeState";
      return this.post(this.getApiUrl(url), "Node state removal", null, messageHandler);
  }

  public getApplications(messageHandler?: IResponseMessageHandler): Observable<IRawApplication[]> {
      return this.getFullCollection<IRawApplication>("Applications/", "Get applications", null, messageHandler);
  }

  public getServices(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawService[]> {
      let url = "Applications/" + encodeURIComponent(applicationId) + "/$/GetServices";
      return this.getFullCollection<IRawService>(url, "Get services", null, messageHandler);
  }

  public getService(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): Observable<IRawService> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId);

      return this.get(this.getApiUrl(url), "Get service", messageHandler);
  }

  public createService(applicationId: string, serviceDescription: IRawCreateServiceDescription, messageHandler?: IResponseMessageHandler): Observable<IRawService> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/$/Create";

      return this.post(this.getApiUrl(url), "Service creation", serviceDescription, messageHandler);
  }

  public createServiceFromTemplate(applicationId: string, serviceDescription: IRawCreateServiceFromTemplateDescription, messageHandler?: IResponseMessageHandler): Observable<IRawService> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/$/CreateFromTemplate";

      return this.post(this.getApiUrl(url), "Service creation", serviceDescription, messageHandler);
  }

  public updateService(applicationId: string, serviceId: string, updateServiceDescription: IRawUpdateServiceDescription, messageHandler?: IResponseMessageHandler): Observable<IRawService> {
      let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}/$/Update`;

      return this.post(this.getApiUrl(url), "Service update", updateServiceDescription, messageHandler);
  }

  public enableApplicationBackup(application: Application, policyName: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Applications/" + encodeURIComponent(application.id) + "/$/EnableBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Enable Application Backup", { BackupPolicyName: policyName }, messageHandler);
  }

  public disableApplicationBackup(application: Application, cleanBackup: boolean, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Applications/" + encodeURIComponent(application.id) + "/$/DisableBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Disable Application Backup", { CleanBackup: cleanBackup }, messageHandler);
  }

  public enableServiceBackup(service: Service, backupPolicyName: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Services/" + encodeURIComponent(service.id) + "/$/EnableBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Enable Service Backup", { BackupPolicyName: backupPolicyName }, messageHandler);
  }

  public disableServiceBackup(service: Service, cleanBackup: boolean, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Services/" + encodeURIComponent(service.id) + "/$/DisableBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Disable Service Backup", { CleanBackup: cleanBackup }, messageHandler);
  }

  public enablePartitionBackup(partition: Partition, backupPolicyName: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Partitions/" + encodeURIComponent(partition.id) + "/$/EnableBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Enable Service Backup", { BackupPolicyName: backupPolicyName }, messageHandler);
  }

  public disablePartitionBackup(partition: Partition, cleanBackup: boolean, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Partitions/" + encodeURIComponent(partition.id) + "/$/DisableBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Disable Service Backup", { CleanBackup: cleanBackup }, messageHandler);
  }

  public suspendApplicationBackup(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Applications/" + encodeURIComponent(applicationId) + "/$/SuspendBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Suspend Application Backup", null, messageHandler);
  }

  public resumeApplicationBackup(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Applications/" + encodeURIComponent(applicationId) + "/$/ResumeBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Resume Application Backup", null, messageHandler);
  }

  public suspendServiceBackup(serviceId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Services/" + encodeURIComponent(serviceId) + "/$/SuspendBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Suspend Service Backup", null, messageHandler);
  }

  public resumeServiceBackup(serviceId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Services/" + encodeURIComponent(serviceId) + "/$/ResumeBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Resume Service Backup", null, messageHandler);
  }

  public suspendPartitionBackup(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Partitions/" + encodeURIComponent(partitionId) + "/$/SuspendBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Suspend Partition Backup", null, messageHandler);
  }

  public resumePartitionBackup(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Partitions/" + encodeURIComponent(partitionId) + "/$/ResumeBackup";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Resume Partition Backup", null, messageHandler);
  }


  public deleteBackupPolicy(backupPolicyName: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "BackupRestore/BackupPolicies/" + encodeURIComponent(backupPolicyName) + "/$/Delete";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Backup Policy deletion", null, messageHandler);
  }

  public updateBackupPolicy(backupPolicy: IRawBackupPolicy, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "BackupRestore/BackupPolicies/" + encodeURIComponent(backupPolicy.Name) + "/$/Update";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Backup Policy updation", backupPolicy, messageHandler);
  }

  public createBackupPolicy(backupPolicy: IRawBackupPolicy, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "BackupRestore/BackupPolicies/$/Create";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Backup Policy creation", backupPolicy, messageHandler);
  }

  public triggerPartitionBackup(partition: Partition, timeOut: number, storage: IRawStorage,  messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Partitions/" + encodeURIComponent(partition.id) + "/$/Backup";
      if (timeOut) {
          url += "?BackupTimeout=" + timeOut.toString();
      }
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Partition Backup trigger", { "BackupStorage": storage }, messageHandler);
  }

  public restorePartitionBackup(partition: Partition, storage: IRawStorage, timeOut: number, backupId: string, backupLocation: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Partitions/" + encodeURIComponent(partition.id) + "/$/Restore";
      if (timeOut) {
          url += "?RestoreTimeout=" + timeOut.toString();
      }
      return this.post(this.getApiUrl(url, RestClientService.apiVersion64), "Partition Backup restore", { "BackupId": backupId, 
                                                                                                          "BackupStorage": storage,
                                                                                                          "BackupLocation": backupLocation }, messageHandler);
  }

  public getServiceDescription(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): Observable<IRawServiceDescription> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/GetDescription";

      return this.get(this.getApiUrl(url), "Get service description", messageHandler);
  }

  public getServiceHealth(applicationId: string, serviceId: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      partitionsHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawServiceHealth> {

      let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}`
          + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}&PartitionsHealthStateFilter=${partitionsHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get service health", messageHandler);
  }

  public deleteService(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/Delete";
      return this.post(this.getApiUrl(url), "Service deletion", null, messageHandler);
  }

  public unprovisionApplicationType(applicationTypeName: string, applicationTypeVersion: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "ApplicationTypes/" + encodeURIComponent(applicationTypeName)
          + "/$/Unprovision";

      return this.post(this.getApiUrl(url), "Application type unprovision", { "ApplicationTypeVersion": applicationTypeVersion }, messageHandler);
  }

  public getApplication(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawApplication> {
      let url = "Applications/" + encodeURIComponent(applicationId) + "/";
      return this.get(this.getApiUrl(url), "Get application", messageHandler);
  }

  public getApplicationHealth(applicationId: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      servicesHealthStateFilter: number = HealthStateFilterFlags.Default,
      deployedApplicationsHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawApplicationHealth> {

      let url = `Applications/${encodeURIComponent(applicationId)}/$/GetHealth`
          + `?EventsHealthStateFilter=${eventsHealthStateFilter}&DeployedApplicationsHealthStateFilter=${deployedApplicationsHealthStateFilter}`
          + `&ServicesHealthStateFilter=${servicesHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get application health", messageHandler);
  }

  public getApplicationUpgradeProgress(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawApplicationUpgradeProgress> {
      let url = "Applications/" + encodeURIComponent(applicationId) + "/$/GetUpgradeProgress";
      return this.get(this.getApiUrl(url), "Get application upgrade progress", messageHandler);
  }

  public deleteApplication(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Applications/" + encodeURIComponent(applicationId) + "/$/Delete";
      return this.post(this.getApiUrl(url), "Application deletion", null, messageHandler);
  }

  public createComposeDeployment(composeDeploymentDescription: IRawCreateComposeDeploymentDescription, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "ComposeDeployments/$/Create";

      return this.put(this.getApiUrl(url, RestClientService.apiVersion60), "Compose application creation", composeDeploymentDescription, messageHandler);
  }

  public deleteComposeApplication(applicationId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "ComposeDeployments/" + encodeURIComponent(applicationId) + "/$/Delete";
      return this.post(this.getApiUrl(url, RestClientService.apiVersion40), "Compose application deletion", null, messageHandler);
  }

  public getPartitions(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): Observable<IRawPartition[]> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/GetPartitions";

      return this.getFullCollection<IRawPartition>(url, "Get partitions", null, messageHandler);
  }

  public getPartition(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawPartition> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/GetPartitions/" + encodeURIComponent(partitionId);

      return this.get(this.getApiUrl(url), "Get partition", messageHandler);
  }

  public getPartitionById(partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawPartition> {
      let url = "Partitions/" + encodeURIComponent(partitionId);

      return this.get(this.getApiUrl(url, RestClientService.apiVersion60), "Get partition by id", messageHandler);
  }

  public getPartitionHealth(applicationId: string, serviceId: string, partitionId: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      replicasHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawPartitionHealth> {

      let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}/$/GetPartitions/${encodeURIComponent(partitionId)}`
          + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}&ReplicasHealthStateFilter=${replicasHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get partition health", messageHandler);
  }

  public getPartitionLoadInformation(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawPartitionLoadInformation> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/GetPartitions/" + encodeURIComponent(partitionId)
          + "/$/GetLoadInformation";

      return this.get(this.getApiUrl(url), "Get partition load information", messageHandler);
  }

  public getReplicasOnPartition(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): Observable<IRawReplicaOnPartition[]> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/GetPartitions/" + encodeURIComponent(partitionId)
          + "/$/GetReplicas";

      return this.getFullCollection<IRawReplicaOnPartition>(url, "Get replicas on partition", null, messageHandler);
  }

  public getReplicaOnPartition(applicationId: string, serviceId: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): Observable<IRawReplicaOnPartition> {
      let url = "Applications/" + encodeURIComponent(applicationId)
          + "/$/GetServices/" + encodeURIComponent(serviceId)
          + "/$/GetPartitions/" + encodeURIComponent(partitionId)
          + "/$/GetReplicas/" + encodeURIComponent(replicaId);

      return this.get(this.getApiUrl(url), "Get replica on partition", messageHandler);
  }

  public getReplicaHealth(applicationId: string, serviceId: string, partitionId: string, replicaId: string,
      eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
      messageHandler?: IResponseMessageHandler): Observable<IRawReplicaHealth> {

      let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}`
          + `/$/GetPartitions/${encodeURIComponent(partitionId)}/$/GetReplicas/${encodeURIComponent(replicaId)}`
          + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}`;

      return this.get(this.getApiUrl(url), "Get replica health", messageHandler);
  }

  public getReplicasOnNode(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): Observable<IRawDeployedReplica[]> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetApplications/" + encodeURIComponent(applicationId)
          + "/$/GetReplicas";

      return this.get(this.getApiUrl(url), "Get replicas on node", messageHandler);
  }

  public deleteReplica(nodeName: string, partitionId: string, replicaId: string, force?: boolean, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = "Nodes/" + encodeURIComponent(nodeName)
          + "/$/GetPartitions/" + encodeURIComponent(partitionId)
          + "/$/GetReplicas/" + encodeURIComponent(replicaId)
          + "/$/Delete";
      if (force) {
          url += "?ForceRemove=true";
      }
      return this.post(this.getApiUrl(url), "Replica deletion", null, messageHandler);
  }

  public getImageStoreContent(path?: string, messageHandler?: IResponseMessageHandler): Observable<IRawImageStoreContent> {
      let url = path ? `ImageStore/${path}` : "ImageStore";
      url += "?timeout=300";
      return this.get(this.getApiUrl(url, RestClientService.apiVersion60), "Get Image Store content", messageHandler);
  }

  public deleteImageStoreContent(path: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      return this.delete(this.getApiUrl(`ImageStore/${path}`, RestClientService.apiVersion60), "Delete Image Store content", messageHandler);
  }

  public getImageStoreFolderSize(path?: string, messageHandler?: IResponseMessageHandler): Observable<IRawStoreFolderSize> {
      let url = (path ? `ImageStore/${path}` : "ImageStore") + "/$/FolderSize";
      url += "?timeout=300";

      return this.get(this.getApiUrl(url, RestClientService.apiVersion65), "Get Image Store Folder Size", messageHandler);
  }

  public getClusterEvents(startTime: Date, endTime: Date, messageHandler?: IResponseMessageHandler): Observable<ClusterEvent[]> {
      return this.getEvents(ClusterEvent, "EventsStore/Cluster/Events", startTime, endTime, messageHandler);
  }

  public getNodeEvents(startTime: Date, endTime: Date, nodeName?: string, messageHandler?: IResponseMessageHandler): Observable<NodeEvent[]> {
      let url = "EventsStore/"
          + "Nodes/"
          + (nodeName ? (encodeURIComponent(nodeName) + "/$/") : "")
          + "Events";
      return this.getEvents(NodeEvent, url, startTime, endTime, messageHandler);
  }

  public getApplicationEvents(startTime: Date, endTime: Date, applicationId?: string, messageHandler?: IResponseMessageHandler): Observable<ApplicationEvent[]> {
      let url = "EventsStore/"
          + "Applications/"
          + (applicationId ? (encodeURIComponent(applicationId) + "/$/") : "")
          + "Events";
      return this.getEvents(ApplicationEvent, url, startTime, endTime, messageHandler);
  }

  public getServiceEvents(startTime: Date, endTime: Date, serviceId?: string, messageHandler?: IResponseMessageHandler): Observable<ServiceEvent[]> {
      let url = "EventsStore/"
          + "Services/"
          + (serviceId ? (encodeURIComponent(serviceId) + "/$/") : "")
          + "Events";
      return this.getEvents(ServiceEvent, url, startTime, endTime, messageHandler);
  }

  public getPartitionEvents(startTime: Date, endTime: Date, partitionId?: string, messageHandler?: IResponseMessageHandler): Observable<PartitionEvent[]> {
      let url = "EventsStore/"
          + "Partitions/"
          + (partitionId ? (encodeURIComponent(partitionId) + "/$/") : "")
          + "Events";
      return this.getEvents(PartitionEvent, url, startTime, endTime, messageHandler);
  }

  public getReplicaEvents(startTime: Date, endTime: Date, partitionId: string, replicaId?: string, messageHandler?: IResponseMessageHandler): Observable<ReplicaEvent[]> {
      let url = "EventsStore/"
          + "Partitions/"
          + encodeURIComponent(partitionId) + "/$/" + "Replicas/"
          + (replicaId ? (encodeURIComponent(replicaId) + "/$/") : "")
          + "Events";
      return this.getEvents(ReplicaEvent, url, startTime, endTime, messageHandler);
  }

  public getCorrelatedEvents(eventInstanceId: string, messageHandler?: IResponseMessageHandler): Observable<FabricEvent[]> {
      let url = "EventsStore/"
          + "CorrelatedEvents/"
          + encodeURIComponent(eventInstanceId) + "/$/"
          + "Events";
      return this.getEvents(FabricEvent, url, null, null, messageHandler);
  }

  public getRepairTasks(messageHandler?: IResponseMessageHandler): Observable<IRawRepairTask[]> {
        let url = `$/GetRepairTaskList`; //additional filters available but not in use. keeping here incase they are needed ?StateFilter=${stateFilter}&TaskIdFilter=${taskIdFilter}&ExecutorFilter=${ExecutorFilter}

        return this.get(this.getApiUrl(url, RestClientService.apiVersion60), "Get repair tasks", messageHandler);
    }

  public restartReplica(nodeName: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): Observable<{}> {
      let url = `Nodes/${nodeName}/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/Restart`;

      return this.post(this.getApiUrl(url, RestClientService.apiVersion60), "Restart replica", null, messageHandler);
  }

  public getClusterVersion(messageHandler?: IResponseMessageHandler): Observable<IRawClusterVersion> {
      let url = `$/GetClusterVersion`;

      return this.get(this.getApiUrl(url, RestClientService.apiVersion64), "Get cluster version", messageHandler);
  }

  private getEvents<T extends FabricEventBase>(eventType: new () => T, url: string, startTime?: Date, endTime?: Date, messageHandler?: IResponseMessageHandler): Observable<T[]> {
      let apiUrl = url;
      if (startTime && endTime) {
          apiUrl = apiUrl
              + "?starttimeutc=" + startTime.toISOString().substr(0, 19) + "Z"
              + "&endtimeutc=" + endTime.toISOString().substr(0, 19) + "Z";
      }

      let fullUrl = this.getApiUrl(apiUrl, RestClientService.apiVersion62Preview, null, true);
      return this.get<IRawList<{}>>(fullUrl, null, messageHandler).pipe(map(response => {
          return new EventsResponseAdapter(eventType).getEvents(response);
        }))
  }

  /**
   * Appends apiVersion and a random token to aid in working with the brower's cache.
   * @param path The Input URI path.
   * @param apiVersion An optional parameter to specify the API Version.  If no API Version specified, defaults to "1.0"  This is due to the platform having independent versions for each type of call.
   */
  private getApiUrl(path: string, apiVersion = RestClientService.defaultApiVersion, continuationToken?: string, skipCacheToken?: boolean): string {
      // token to allow for invalidation of browser api call cache
      return StandaloneIntegration.clusterUrl +
          `/${path}${path.indexOf("?") === -1 ? "?" : "&"}api-version=${apiVersion ? apiVersion : RestClientService.defaultApiVersion}${skipCacheToken === true ? "" : `&_cacheToken=${this.cacheAllowanceToken}`}${continuationToken ? `&ContinuationToken=${continuationToken}` : ""}`;
  }

  private getApiUrl2(path: string, apiVersion = RestClientService.defaultApiVersion, continuationToken?: string, skipCacheToken?: boolean, startDate?: Date, endDate?: Date, maxResults?: number, latest?: boolean): string {
      // token to allow for invalidation of browser api call cache
      let appUrl =  this.getApiUrl(path, apiVersion, continuationToken, false);
      return appUrl +
          `${maxResults === undefined || maxResults === null ? "" : `&MaxResults=${maxResults}`}${(startDate === undefined || startDate === null || endDate === undefined || endDate === null) ? "" : `&StartDateTimeFilter=${startDate.toISOString().substr(0, 19)}Z&EndDateTimeFilter=${endDate.toISOString().substr(0, 19)}Z`}${latest === true ? `&Latest=True` : ""}`;
  }

  private getFullCollection<T>(url: string, apiDesc: string, apiVersion?: string, messageHandler?: IResponseMessageHandler, continuationToken?: string): Observable<T[]> {
      let appUrl = this.getApiUrl(url, apiVersion, continuationToken, false);
      return this.get<IRawCollection<T>>(appUrl, apiDesc, messageHandler).pipe(mergeMap(response => {
        if (response.ContinuationToken) {
            return this.getFullCollection<T>(url, apiDesc, apiVersion, messageHandler, response.ContinuationToken).pipe(mergeMap(items => {
                return of(response.Items.concat(items));
            }));
        }else{
            return of(response.Items);    
        }
    //   }, err => {
    //     return [];
    }))

  }

  private getFullCollection2<T>(url: string, apiDesc: string, apiVersion?: string, messageHandler?: IResponseMessageHandler, continuationToken?: string, startDate?: Date, endDate?: Date, maxResults?: number, latest?: boolean): Observable<T[]> {
      let appUrl = this.getApiUrl2(url, apiVersion, continuationToken, false, startDate, endDate, maxResults, latest);
      return this.get<IRawCollection<T>>(appUrl, apiDesc, messageHandler).pipe(mergeMap(response => {
          if (response.ContinuationToken) {
              return this.getFullCollection<T>(url, apiDesc, apiVersion, messageHandler, response.ContinuationToken).pipe(map(items => {
                  return of(response.Items.concat(items));
              }));
          }
          return of(response.Items);
        }, err => {
          return [];
      }))
  }

  private static baseUrl = "api"

  private get<T>(url: string, apiDesc: string, messageHandler?: IResponseMessageHandler): Observable<T> {
      let result = StandaloneIntegration.isStandalone() ? this.requestAsync<T>({ method: "GET", url: url }) : this.httpClient.get<T>(environment.baseUrl + url);
      if (!messageHandler) {
          messageHandler = ResponseMessageHandlers.getResponseMessageHandler;
      }
      return this.handleResponse<T>(apiDesc, <any>result, messageHandler);
  }

  private post<T>(url: string, apiDesc: string, data?: any, messageHandler?: IResponseMessageHandler): Observable<T> {
      let result = StandaloneIntegration.isStandalone() ? this.requestAsync<T>({ method: "POST", url: url }) : this.httpClient.post<T>(environment.baseUrl  + url, data);
      if (!messageHandler) {
          messageHandler = ResponseMessageHandlers.postResponseMessageHandler;
      }
      return this.handleResponse<T>(apiDesc, <any>result, messageHandler);
  }

  private put<T>(url: string, apiDesc: string, data?: any, messageHandler?: IResponseMessageHandler): Observable<T> {
      let result = StandaloneIntegration.isStandalone() ? this.requestAsync<T>({ method: "PUT", url: url }) : this.httpClient.put<T>(environment.baseUrl  + url, data);
      if (!messageHandler) {
          messageHandler = ResponseMessageHandlers.putResponseMessageHandler;
      }
      return this.handleResponse<T>(apiDesc, <any>result, messageHandler);
  }

  private delete<T>(url: string, apiDesc: string, messageHandler?: IResponseMessageHandler): Observable<T> {
      let result = StandaloneIntegration.isStandalone() ? this.requestAsync<T>({ method: "DELETE", url: url }) : this.httpClient.delete<T>(environment.baseUrl  + url);
      if (!messageHandler) {
          messageHandler = ResponseMessageHandlers.deleteResponseMessageHandler;
      }
      return this.handleResponse<T>(apiDesc, <any>result, messageHandler);
  }

    public requestAsync<T>(request: IHttpRequest): Observable<T> {
        return from(<Promise<T>>new Promise( (resolve, reject) => {
            StandaloneIntegration.getHttpClient()
                .then((client) => client.requestAsync(request))
                .then((response) => {
                    console.log(JSON.stringify(response))

                    //only send the data because we are using Observable<T> instead of Observable<HttpResponse<T>> 
                    resolve(response.data);
                    }
                ,(err: IHttpResponse) => 
                {
                    let r = new HttpErrorResponse({
                        status: err.statusCode,
                        statusText: err.statusMessage,
                    })
                    reject(r) }
                );
        }));
}

  private handleResponse<T>(apiDesc: string, resultPromise: Observable<any>, messageHandler?: IResponseMessageHandler): Observable<T> {
    return resultPromise.pipe(catchError((err: HttpErrorResponse) => {
        console.log(err)
        const header = `${err.status.toString()} : ${apiDesc}`;
        let message = messageHandler.getErrorMessage(apiDesc, err);
            if (message) {
                this.message.showMessage(message, MessageSeverity.Err, header);
            }
    
        if (err.error instanceof Error) {
        // A client-side or network error occurred. Handle it accordingly.
        console.error('An error occurred:', err.error.message);
        this.message.showMessage(err.error.message, MessageSeverity.Err, header);

        } else {
        // The backend returned an unsuccessful response code.
        // The response body may contain clues as to what went wrong,
        this.message.showMessage(JSON.stringify(err.error), MessageSeverity.Err, header);

        console.error(`Backend returned code ${err.status}, body was: ${err.error}`);
        }
    
        // ...optionally return a default fallback value so app can continue (pick one)
        // which could be a default value (which has to be a HttpResponse here)
        // return Observable.of(new HttpResponse({body: [{name: "Default value..."}]}));
        // or simply an empty observable
        return throwError(err);
    }));
    }
}

