//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    /**
     * Service fabric REST api client, this should be only be used in DataService.
     */
    export class RestClient {

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
                    $.each(this.allRequestsComplete, (_, cb) => cb());
                    this.allRequestsComplete = [];
                }
            });
        }

        public invalidateBrowserRestResponseCache(): void {
            this.cacheAllowanceToken = Date.now().valueOf();
        }

        public registerRequestStartedCallback(callback: (number) => void): RestClient {
            this.requestStarted.push(callback);
            return this;
        }

        public registerRequestEndedCallback(callback: (number) => void): RestClient {
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
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterHealth> {

            let url = `$/GetClusterHealth?NodesHealthStateFilter=${nodesHealthStateFilter}`
                + `&ApplicationsHealthStateFilter=${applicationsHealthStateFilter}&EventsHealthStateFilter=${eventsHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get cluster health", messageHandler);
        }

        public getClusterManifest(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterManifest> {
            return this.get(this.getApiUrl("$/GetClusterManifest"), "Get cluster manifest", messageHandler);
        }

        public getClusterUpgradeProgress(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterUpgradeProgress> {
            return this.get(this.getApiUrl("$/GetUpgradeProgress"), "Get cluster upgrade progress", messageHandler);
        }

        public getClusterLoadInformation(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterLoadInformation> {
            return this.get(this.getApiUrl("$/GetLoadInformation"), "Get cluster load information", messageHandler);
        }

        public getClusterHealthChunk(healthDescriptor: IClusterHealthChunkQueryDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            return this.post(this.getApiUrl("$/GetClusterHealthChunk"), "Get cluster health chunk", healthDescriptor, messageHandler);
        }

        public createNetwork(networkName: string, networkAddressPrefix: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Resources/Networks/" + encodeURIComponent(networkName);
            let body: any = { "name": networkName, "properties": { "kind": "Local", "networkAddressPrefix": networkAddressPrefix } };
            return this.put(this.getApiUrl(url, RestClient.apiVersion64), "Creating isolated network \"" + networkName + "\" succeeded", body, messageHandler);
        }

        public getNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNetwork> {
            let url = "Resources/Networks/" + encodeURIComponent(networkName) + "/";
            return this.get(this.getApiUrl(url, RestClient.apiVersion64), "Get network", messageHandler);
        }

        public getNetworks(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetwork[]> {
            return this.getFullCollection<IRawNetwork>("Resources/Networks/", "Get networks", RestClient.apiVersion64);
        }

        public deleteNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Resources/Networks/" + encodeURIComponent(networkName);
            return this.delete(this.getApiUrl(url, RestClient.apiVersion64), "Network \"" + networkName + "\" deleted", messageHandler);
        }

        public getNetworksOnApp(appId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetworkOnApp[]> {
            let url = "Applications/" + encodeURIComponent(appId) + "/$/GetNetworks";
            return this.getFullCollection<IRawNetworkOnApp>(url, "Get networks attached to a application", RestClient.apiVersion60);
        }

        public getNetworksOnNode(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetworkOnNode[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetNetworks";
            return this.getFullCollection<IRawNetworkOnNode>(url, "Get networks deployed on a node", RestClient.apiVersion60);
        }

        public getAppsOnNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawAppOnNetwork[]> {
            let url = "Resources/Networks/" + encodeURIComponent(networkName) + "/ApplicationRefs";
            return this.getFullCollection<IRawAppOnNetwork>(url, "Get applications using current network", RestClient.apiVersion64);
        }

        public getNodesOnNetwork(networkName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNodeOnNetwork[]> {
            let url = "Resources/Networks/" + encodeURIComponent(networkName) + "/DeployedNodes";
            return this.getFullCollection<IRawNodeOnNetwork>(url, "Get nodes, current network is deployed on", RestClient.apiVersion64);
        }

        public getDeployedContainersOnNetwork(networkName: string, nodeName: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawDeployedContainerOnNetwork[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetNetworks/" + encodeURIComponent(networkName) + "/$/GetCodePackages";
            return this.getFullCollection<IRawDeployedContainerOnNetwork>(url, "Get containers on network", RestClient.apiVersion60);
        }

        public getNodes(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNode[]> {
            return this.getFullCollection<IRawNode>("Nodes/", "Get nodes");
        }

        public getNode(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNode> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/";
            return this.get(this.getApiUrl(url), "Get node", messageHandler);
        }

        public getNodeHealth(nodeName: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNodeHealth> {

            let url = `Nodes/${encodeURIComponent(nodeName)}/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get node health", messageHandler);
        }

        public getNodeLoadInformation(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawNodeLoadInformation> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetLoadInformation";
            return this.get(this.getApiUrl(url), "Get node load information", messageHandler);
        }

        public restartNode(nodeName: string, nodeInstanceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/Restart";

            let body = {
                "NodeInstanceId": nodeInstanceId
            };

            return this.post(this.getApiUrl(url), "Node restart", body, messageHandler);
        }

        public getDeployedApplications(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedApplication[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/GetApplications";
            return this.get(this.getApiUrl(url), "Get applications", messageHandler);
        }

        public getDeployedApplication(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedApplication> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId);

            return this.get(this.getApiUrl(url), "Get deployed applications", messageHandler);
        }

        public getDeployedApplicationHealth(
            nodeName: string, applicationId: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            deployedServicePackagesHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler
        ): angular.IHttpPromise<IRawApplicationHealth> {

            let url = `Nodes/${encodeURIComponent(nodeName)}/$/GetApplications/${encodeURIComponent(applicationId)}/$/GetHealth`
                + `?EventsHealthStateFilter=${eventsHealthStateFilter}&DeployedServicePackagesHealthStateFilter=${deployedServicePackagesHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get application health", messageHandler);
        }

        public getDeployedServicePackages(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedServicePackage[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetServicePackages";

            return this.get(this.getApiUrl(url), "Get deployed service packages", messageHandler);
        }

        public getDeployedServicePackage(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedServicePackage[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetServicePackages/" + encodeURIComponent(servicePackageName);

            return this.get(this.getApiUrl(url), "Get deployed service package on application", messageHandler);
        }

        public getDeployedServicePackageHealth(nodeName: string, applicationId: string, servicePackageName: string,
            servicePackageActivationId: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedServicePackageHealth> {

            let url = `Nodes/${encodeURIComponent(nodeName)}/$/GetApplications/${encodeURIComponent(applicationId)}`
                + `/$/GetServicePackages/${encodeURI(servicePackageName)}`
                + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}`
                + (servicePackageActivationId ? `&ServicePackageActivationId=${servicePackageActivationId}` : "");

            return this.get(this.getApiUrl(url), "Get deployed service package health", messageHandler);
        }

        public getServiceManifest(appTypeName: string, appTypeVersion: string, serviceManifestName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceManifest> {
            let url = "ApplicationTypes/" + encodeURIComponent(appTypeName)
                + "/$/GetServiceManifest";

            let formedUrl = this.getApiUrl(url) + "&ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion)
                + "&ServiceManifestName=" + encodeURIComponent(serviceManifestName);

            return this.get(formedUrl, "Get service manifest for application type", messageHandler);
        }

        public getServiceTypes(appTypeName: string, appTypeVersion: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceType[]> {
            let url = "ApplicationTypes/" + encodeURIComponent(appTypeName)
                + "/$/GetServiceTypes?ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion);

            let formedUrl = this.getApiUrl(url) + "&ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion);

            return this.get(formedUrl, "Get service types for application type", messageHandler);
        }

        public getDeployedReplicas(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplica[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetReplicas";

            let formedUrl = this.getApiUrl(url)
                + "&ServiceManifestName=" + encodeURIComponent(servicePackageName);

            return this.get(formedUrl, "Get replicas on service", messageHandler);
        }

        public getDeployedCodePackages(nodeName: string, applicationId: string, servicePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedCodePackage[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetCodePackages";

            let formedUrl = this.getApiUrl(url)
                + "&ServiceManifestName=" + encodeURIComponent(servicePackageName);

            return this.get(formedUrl, "Get deployed code packages", messageHandler);
        }

        public getDeployedCodePackage(nodeName: string, applicationId: string, servicePackageName: string, codePackageName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedCodePackage[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetCodePackages";

            let formedUrl = this.getApiUrl(url)
                + "&ServiceManifestName=" + encodeURIComponent(servicePackageName)
                + "&CodePackageName=" + encodeURIComponent(codePackageName);

            return this.get(formedUrl, "Get deployed code package", messageHandler);
        }

        public getDeployedContainerLogs(nodeName: string, applicationId: string, servicePackageName: string, codePackageName: string, servicePackageActivationId: string, tail: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawContainerLogs> {
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

        public restartCodePackage(nodeName: string, applicationId: string, serviceManifestName: string, codePackageName: string, codePackageInstanceId: string, servicePackageActivationId?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
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
        public getDeployedReplica(nodeName: string, applicationId: string, servicePackageName: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplica[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetReplicas";

            let formedUrl = this.getApiUrl(url)
                + "&PartitionId=" + encodeURIComponent(partitionId)
                + "&ServiceManifestName=" + encodeURIComponent(servicePackageName);

            return this.get(formedUrl, "Get deployed replica", messageHandler);
        }

        public getDeployedReplicaDetail(nodeName: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplicaDetail> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetPartitions/" + encodeURIComponent(partitionId)
                + "/$/GetReplicas/" + encodeURIComponent(replicaId)
                + "/$/GetDetail";

            return this.get(this.getApiUrl(url), "Get deployed replica detail", messageHandler);
        }

        public getApplicationTypes(appTypeName?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationType[]> {
            if (appTypeName) {
                return this.get(this.getApiUrl("ApplicationTypes/" + encodeURIComponent(appTypeName)), "Get application type");
            }

            return this.get(this.getApiUrl("ApplicationTypes/"), "Get application types", messageHandler);
        }

        public getApplicationManifestForApplicationType(appTypeName: string, appTypeVersion: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationManifest> {
            let url = "ApplicationTypes/" + encodeURIComponent(appTypeName)
                + "/$/GetApplicationManifest?ApplicationTypeVersion=" + encodeURIComponent(appTypeVersion);
            return this.get(this.getApiUrl(url), "Get application manifest for application type");
        }

        public provisionApplication(name: string, appTypeName: string, appTypeVersion, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<any> {
            let url = "Applications/$/Create";

            let body: any = {
                "Name": name,
                "TypeName": appTypeName,
                "TypeVersion": appTypeVersion
            };

            return this.post(this.getApiUrl(url), "Application instance creation", body, messageHandler);
        }

        public activateNode(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/Activate";
            return this.post(this.getApiUrl(url), "Node Activation", null, messageHandler);
        }

        public deactivateNode(nodeName: string, intent: number, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/Deactivate";
            return this.post(this.getApiUrl(url), "Node deactivation", { "DeactivationIntent": intent }, messageHandler);
        }

        public removeNodeState(nodeName: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Nodes/" + encodeURIComponent(nodeName) + "/$/RemoveNodeState";
            return this.post(this.getApiUrl(url), "Node state removal", null, messageHandler);
        }

        public getApplications(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplication[]> {
            return this.getFullCollection<IRawApplication>("Applications/", "Get applications", null, messageHandler);
        }

        public getServices(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawService[]> {
            let url = "Applications/" + encodeURIComponent(applicationId) + "/$/GetServices";
            return this.getFullCollection<IRawService>(url, "Get services", null, messageHandler);
        }

        public getService(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId);

            return this.get(this.getApiUrl(url), "Get service", messageHandler);
        }

        public createService(applicationId: string, serviceDescription: IRawCreateServiceDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/$/Create";

            return this.post(this.getApiUrl(url), "Service creation", serviceDescription, messageHandler);
        }

        public createServiceFromTemplate(applicationId: string, serviceDescription: IRawCreateServiceFromTemplateDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/$/CreateFromTemplate";

            return this.post(this.getApiUrl(url), "Service creation", serviceDescription, messageHandler);
        }

        public updateService(applicationId: string, serviceId: string, updateServiceDescription: IRawUpdateServiceDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawService> {
            let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}/$/Update`;

            return this.post(this.getApiUrl(url), "Service update", updateServiceDescription, messageHandler);
        }

        public getServiceDescription(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceDescription> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/GetDescription";

            return this.get(this.getApiUrl(url), "Get service description", messageHandler);
        }

        public getServiceHealth(applicationId: string, serviceId: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            partitionsHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawServiceHealth> {

            let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}`
                + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}&PartitionsHealthStateFilter=${partitionsHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get service health", messageHandler);
        }

        public deleteService(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/Delete";
            return this.post(this.getApiUrl(url), "Service deletion", null, messageHandler);
        }

        public unprovisionApplicationType(applicationTypeName: string, applicationTypeVersion: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "ApplicationTypes/" + encodeURIComponent(applicationTypeName)
                + "/$/Unprovision";

            return this.post(this.getApiUrl(url), "Application type unprovision", { "ApplicationTypeVersion": applicationTypeVersion }, messageHandler);
        }

        public getApplication(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplication> {
            let url = "Applications/" + encodeURIComponent(applicationId) + "/";
            return this.get(this.getApiUrl(url), "Get application", messageHandler);
        }

        public getApplicationHealth(applicationId: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            servicesHealthStateFilter: number = HealthStateFilterFlags.Default,
            deployedApplicationsHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationHealth> {

            let url = `Applications/${encodeURIComponent(applicationId)}/$/GetHealth`
                + `?EventsHealthStateFilter=${eventsHealthStateFilter}&DeployedApplicationsHealthStateFilter=${deployedApplicationsHealthStateFilter}`
                + `&ServicesHealthStateFilter=${servicesHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get application health", messageHandler);
        }

        public getApplicationUpgradeProgress(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawApplicationUpgradeProgress> {
            let url = "Applications/" + encodeURIComponent(applicationId) + "/$/GetUpgradeProgress";
            return this.get(this.getApiUrl(url), "Get application upgrade progress", messageHandler);
        }

        public deleteApplication(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Applications/" + encodeURIComponent(applicationId) + "/$/Delete";
            return this.post(this.getApiUrl(url), "Application deletion", null, messageHandler);
        }

        public createComposeDeployment(composeDeploymentDescription: IRawCreateComposeDeploymentDescription, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "ComposeDeployments/$/Create";

            return this.put(this.getApiUrl(url, RestClient.apiVersion60), "Compose application creation", composeDeploymentDescription, messageHandler);
        }

        public deleteComposeApplication(applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "ComposeDeployments/" + encodeURIComponent(applicationId) + "/$/Delete";
            return this.post(this.getApiUrl(url, RestClient.apiVersion40), "Compose application deletion", null, messageHandler);
        }

        public getPartitions(applicationId: string, serviceId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartition[]> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/GetPartitions";

            return this.getFullCollection<IRawPartition>(url, "Get partitions", null, messageHandler);
        }

        public getPartition(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartition> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/GetPartitions/" + encodeURIComponent(partitionId);

            return this.get(this.getApiUrl(url), "Get partition", messageHandler);
        }

        public getPartitionById(partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartition> {
            let url = "Partitions/" + encodeURIComponent(partitionId);

            return this.get(this.getApiUrl(url, RestClient.apiVersion60), "Get partition by id", messageHandler);
        }

        public getPartitionHealth(applicationId: string, serviceId: string, partitionId: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            replicasHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartitionHealth> {

            let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}/$/GetPartitions/${encodeURIComponent(partitionId)}`
                + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}&ReplicasHealthStateFilter=${replicasHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get partition health", messageHandler);
        }

        public getPartitionLoadInformation(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawPartitionLoadInformation> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/GetPartitions/" + encodeURIComponent(partitionId)
                + "/$/GetLoadInformation";

            return this.get(this.getApiUrl(url), "Get partition load information", messageHandler);
        }

        public getReplicasOnPartition(applicationId: string, serviceId: string, partitionId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<IRawReplicaOnPartition[]> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/GetPartitions/" + encodeURIComponent(partitionId)
                + "/$/GetReplicas";

            return this.getFullCollection<IRawReplicaOnPartition>(url, "Get replicas on partition", null, messageHandler);
        }

        public getReplicaOnPartition(applicationId: string, serviceId: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawReplicaOnPartition> {
            let url = "Applications/" + encodeURIComponent(applicationId)
                + "/$/GetServices/" + encodeURIComponent(serviceId)
                + "/$/GetPartitions/" + encodeURIComponent(partitionId)
                + "/$/GetReplicas/" + encodeURIComponent(replicaId);

            return this.get(this.getApiUrl(url), "Get replica on partition", messageHandler);
        }

        public getReplicaHealth(applicationId: string, serviceId: string, partitionId: string, replicaId: string,
            eventsHealthStateFilter: number = HealthStateFilterFlags.Default,
            messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawReplicaHealth> {

            let url = `Applications/${encodeURIComponent(applicationId)}/$/GetServices/${encodeURIComponent(serviceId)}`
                + `/$/GetPartitions/${encodeURIComponent(partitionId)}/$/GetReplicas/${encodeURIComponent(replicaId)}`
                + `/$/GetHealth?EventsHealthStateFilter=${eventsHealthStateFilter}`;

            return this.get(this.getApiUrl(url), "Get replica health", messageHandler);
        }

        public getReplicasOnNode(nodeName: string, applicationId: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawDeployedReplica[]> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetApplications/" + encodeURIComponent(applicationId)
                + "/$/GetReplicas";

            return this.get(this.getApiUrl(url), "Get replicas on node", messageHandler);
        }

        public deleteReplica(nodeName: string, partitionId: string, replicaId: string, force?: boolean, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            let url = "Nodes/" + encodeURIComponent(nodeName)
                + "/$/GetPartitions/" + encodeURIComponent(partitionId)
                + "/$/GetReplicas/" + encodeURIComponent(replicaId)
                + "/$/Delete";
            if (force) {
                url += "?ForceRemove=true";
            }
            return this.post(this.getApiUrl(url), "Replica deletion", null, messageHandler);
        }

        public getImageStoreContent(path?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawImageStoreContent> {
            let url = path ? `ImageStore/${path}` : "ImageStore";
            url += "?timeout=300";
            return this.get(this.getApiUrl(url, RestClient.apiVersion60), "Get Image Store content", messageHandler);
        }

        public deleteImageStoreContent(path: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<{}> {
            return this.delete(this.getApiUrl(`ImageStore/${path}`, RestClient.apiVersion60), "Delete Image Store content", messageHandler);
        }

        public getImageStoreFolderSize(path?: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawStoreFolderSize> {
            let url = (path ? `ImageStore/${path}` : "ImageStore") + "/$/FolderSize";
            url += "?timeout=300";

            return this.get(this.getApiUrl(url, RestClient.apiVersion65), "Get Image Store Folder Size", messageHandler);
        }

        public getClusterEvents(startTime: Date, endTime: Date, messageHandler?: IResponseMessageHandler): angular.IPromise<ClusterEvent[]> {
            return this.getEvents(ClusterEvent, "EventsStore/Cluster/Events", startTime, endTime, messageHandler);
        }

        public getNodeEvents(startTime: Date, endTime: Date, nodeName?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<NodeEvent[]> {
            let url = "EventsStore/"
                + "Nodes/"
                + (nodeName ? (encodeURIComponent(nodeName) + "/$/") : "")
                + "Events";
            return this.getEvents(NodeEvent, url, startTime, endTime, messageHandler);
        }

        public getApplicationEvents(startTime: Date, endTime: Date, applicationId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<ApplicationEvent[]> {
            let url = "EventsStore/"
                + "Applications/"
                + (applicationId ? (encodeURIComponent(applicationId) + "/$/") : "")
                + "Events";
            return this.getEvents(ApplicationEvent, url, startTime, endTime, messageHandler);
        }

        public getServiceEvents(startTime: Date, endTime: Date, serviceId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<ServiceEvent[]> {
            let url = "EventsStore/"
                + "Services/"
                + (serviceId ? (encodeURIComponent(serviceId) + "/$/") : "")
                + "Events";
            return this.getEvents(ServiceEvent, url, startTime, endTime, messageHandler);
        }

        public getPartitionEvents(startTime: Date, endTime: Date, partitionId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<PartitionEvent[]> {
            let url = "EventsStore/"
                + "Partitions/"
                + (partitionId ? (encodeURIComponent(partitionId) + "/$/") : "")
                + "Events";
            return this.getEvents(PartitionEvent, url, startTime, endTime, messageHandler);
        }

        public getReplicaEvents(startTime: Date, endTime: Date, partitionId: string, replicaId?: string, messageHandler?: IResponseMessageHandler): angular.IPromise<ReplicaEvent[]> {
            let url = "EventsStore/"
                + "Partitions/"
                + encodeURIComponent(partitionId) + "/$/" + "Replicas/"
                + (replicaId ? (encodeURIComponent(replicaId) + "/$/") : "")
                + "Events";
            return this.getEvents(ReplicaEvent, url, startTime, endTime, messageHandler);
        }

        public getCorrelatedEvents(eventInstanceId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<FabricEvent[]> {
            let url = "EventsStore/"
                + "CorrelatedEvents/"
                + encodeURIComponent(eventInstanceId) + "/$/"
                + "Events";
            return this.getEvents(FabricEvent, url, null, null, messageHandler);
        }

        public restartReplica(nodeName: string, partitionId: string, replicaId: string, messageHandler?: IResponseMessageHandler): angular.IPromise<{}> {
            let url = `Nodes/${nodeName}/$/GetPartitions/${partitionId}/$/GetReplicas/${replicaId}/$/Restart`;

            return this.post(this.getApiUrl(url, RestClient.apiVersion60), "Restart replica", null, messageHandler);
        }

        public getClusterVersion(messageHandler?: IResponseMessageHandler): angular.IHttpPromise<IRawClusterVersion> {
            let url = `$/GetClusterVersion`;

            return this.get(this.getApiUrl(url, RestClient.apiVersion64), "Get cluster version", messageHandler);
        }

        private getEvents<T extends FabricEventBase>(eventType: new () => T, url: string, startTime?: Date, endTime?: Date, messageHandler?: IResponseMessageHandler): angular.IPromise<T[]> {
            let apiUrl = url;
            if (startTime && endTime) {
                apiUrl = apiUrl
                    + "?starttimeutc=" + startTime.toISOString().substr(0, 19) + "Z"
                    + "&endtimeutc=" + endTime.toISOString().substr(0, 19) + "Z";
            }

            let fullUrl = this.getApiUrl(apiUrl, RestClient.apiVersion62Preview, null, true);
            return this.get<IRawList<{}>>(fullUrl, null, messageHandler)
                .then(response => {
                    return new EventsResponseAdapter(eventType).getEvents(response.data);
                });
        }

        /**
         * Appends apiVersion and a random token to aid in working with the brower's cache.
         * @param path The Input URI path.
         * @param apiVersion An optional parameter to specify the API Version.  If no API Version specified, defaults to "1.0"  This is due to the platform having independent versions for each type of call.
         */
        private getApiUrl(path: string, apiVersion = RestClient.defaultApiVersion, continuationToken?: string, skipCacheToken?: boolean): string {
            // token to allow for invalidation of browser api call cache
            return StandaloneIntegration.clusterUrl +
                `/${path}${path.indexOf("?") === -1 ? "?" : "&"}api-version=${apiVersion ? apiVersion : RestClient.defaultApiVersion}${skipCacheToken === true ? "" : `&_cacheToken=${this.cacheAllowanceToken}`}${continuationToken ? `&ContinuationToken=${continuationToken}` : ""}`;
        }

        private getFullCollection<T>(url: string, apiDesc: string, apiVersion?: string, messageHandler?: IResponseMessageHandler, continuationToken?: string): angular.IPromise<T[]> {
            let appUrl = this.getApiUrl(url, apiVersion, continuationToken);
            return this.get<IRawCollection<T>>(appUrl, apiDesc, messageHandler).then(response => {
                if (response.data.ContinuationToken) {
                    return this.getFullCollection<T>(url, apiDesc, apiVersion, messageHandler, response.data.ContinuationToken).then(items => {
                        return _.union(response.data.Items, items);
                    });
                }
                return response.data.Items;
            });
        }

        private get<T>(url: string, apiDesc: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<T> {
            let result = this.wrapInCallbacks<T>(() => this.httpClient.getAsync(url));
            if (!messageHandler) {
                messageHandler = ResponseMessageHandlers.getResponseMessageHandler;
            }
            this.handleResponse(apiDesc, result, messageHandler);

            // Return original response object
            return result;
        }

        private post<T>(url: string, apiDesc: string, data?: any, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<T> {
            let result = this.wrapInCallbacks<T>(() => this.httpClient.postAsync(url, data));
            if (!messageHandler) {
                messageHandler = ResponseMessageHandlers.postResponseMessageHandler;
            }
            this.handleResponse(apiDesc, result, messageHandler);

            // Return original response object
            return result;
        }

        private put<T>(url: string, apiDesc: string, data?: any, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<T> {
            let result = this.wrapInCallbacks<T>(() => this.httpClient.putAsync(url, data));
            if (!messageHandler) {
                messageHandler = ResponseMessageHandlers.putResponseMessageHandler;
            }
            this.handleResponse(apiDesc, result, messageHandler);

            // Return original response object
            return result;
        }

        private delete<T>(url: string, apiDesc: string, messageHandler?: IResponseMessageHandler): angular.IHttpPromise<T> {
            let result = this.wrapInCallbacks<T>(() => this.httpClient.deleteAsync(url));
            if (!messageHandler) {
                messageHandler = ResponseMessageHandlers.deleteResponseMessageHandler;
            }
            this.handleResponse(apiDesc, result, messageHandler);

            return result;
        }

        private handleResponse(apiDesc: string, resultPromise: ng.IHttpPromise<{}>, messageHandler?: IResponseMessageHandler): void {
            resultPromise.then((response: ng.IHttpPromiseCallbackArg<{}>) => {
                let message = messageHandler.getSuccessMessage(apiDesc, response);
                if (message) {
                    this.message.showMessage(message, MessageSeverity.Info);
                }
            }, (response: ng.IHttpPromiseCallbackArg<any>) => {
                let message = messageHandler.getErrorMessage(apiDesc, response);
                if (message) {
                    this.message.showMessage(message, MessageSeverity.Err);
                }
            });
        }

        private wrapInCallbacks<T>(operation: () => angular.IHttpPromise<T>): angular.IHttpPromise<T> {
            this.requestCount++;
            $.each(this.requestStarted, (_, cb) => cb(this.requestCount));

            let promise = operation();

            promise.finally(() => {
                this.requestCount--;
                $.each(this.requestEnded, (_, cb) => cb(this.requestCount));
            });

            return promise;
        }
    }

    (function () {
        const module = angular.module("restClientService", ["messages", "httpService"]);

        module.factory("restClient", ["httpClient", "message", (httpClient, message) => new RestClient(httpClient, message)]);
    })();
}
