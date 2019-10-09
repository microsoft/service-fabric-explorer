import { DataModelBase, IDecorators } from "./Base";
import { IRawService, IRawUpdateServiceDescription, IRawServiceHealth, IRawServiceDescription, IRawServiceType, IRawServiceManifest, IRawCreateServiceDescription, IRawServiceBackupConfigurationInfo, IRawCreateServiceFromTemplateDescription } from '../RawDataTypes';
import { PartitionCollection, ServiceBackupConfigurationInfoCollection } from './Collections';
import { DataService } from 'src/app/services/data.service';
import { HealthStateFilterFlags, IClusterHealthChunkQueryDescription, IServiceHealthStateFilter } from '../HealthChunkRawDataTypes';
import { ServiceKindRegexes, Constants, FabricEnumValues } from 'src/app/Common/Constants';
import { Utils } from 'src/app/Utils/Utils';
import { DeployedServicePackage } from './DeployedServicePackage';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Application } from './Application';
import { Observable } from 'rxjs';
import { HealthBase } from './HealthEvent';
import { ApplicationType } from './ApplicationType';
import { mergeMap } from 'rxjs/operators';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class Service extends DataModelBase<IRawService> {
    public decorators: IDecorators = {
        hideList: [
            "IsServiceGroup"
        ]
    };

    public partitions: PartitionCollection;
    public health: ServiceHealth;
    public description: ServiceDescription;
    public serviceBackupConfigurationInfoCollection: ServiceBackupConfigurationInfoCollection;
    public backupPolicyName: string;
    public cleanBackup: boolean;

    public constructor(data: DataService, raw: IRawService, public parent: Application) {
        super(data, raw, parent);

        this.partitions = new PartitionCollection(this.data, this);
        this.health = new ServiceHealth(this.data, this, HealthStateFilterFlags.Default, HealthStateFilterFlags.None);
        this.description = new ServiceDescription(this.data, this);
        this.serviceBackupConfigurationInfoCollection = new ServiceBackupConfigurationInfoCollection(data, this);

        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }

        if (this.data.actionsAdvancedEnabled()) {
            this.setAdvancedActions();
        }

        this.cleanBackup = false;
    }

    public get isStatefulService(): boolean {
        return ServiceKindRegexes.Stateful.test(this.raw.ServiceKind);
    }

    public get isStatelessService(): boolean {
        return ServiceKindRegexes.Stateless.test(this.raw.ServiceKind);
    }

    public get serviceKindInNumber(): number {
        return this.raw.ServiceKind === Constants.ServiceKindStateful ? 2 : 1;
    }

    public get viewPath(): string {
        return this.data.routes.getServiceViewPath(this.parent.raw.TypeName, this.parent.id, this.id);
    }

    public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IServiceHealthStateFilter {
        let appFilter = this.parent.addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription);
        let serviceFilter = _.find(appFilter.ServiceFilters, filter => filter.ServiceNameFilter === this.name);
        if (!serviceFilter) {
            serviceFilter = {
                ServiceNameFilter: this.name,
                PartitionFilters: []
            };
            appFilter.ServiceFilters.push(serviceFilter);
        }
        if (serviceFilter.PartitionFilters.length === 0) {
            serviceFilter.PartitionFilters = [{
                HealthStateFilter: HealthStateFilterFlags.All
            }];
        }
        return serviceFilter;
    }

    public updateService(updateServiceDescription: IRawUpdateServiceDescription): Observable<any> {
        return this.data.restClient.updateService(this.parent.id, this.id, updateServiceDescription);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawService> {
        return Utils.getHttpResponseData(this.data.restClient.getService(this.parent.id, this.id, messageHandler));
    }

    public removeAdvancedActions(): void {
        this.actions.collection = this.actions.collection.filter(action => ["enableServiceBackup", "disableServiceBackup", "suspendServiceBackup", "resumeServiceBackup"].indexOf(action.name) === -1);
    }

    private setUpActions(): void {
        if (this.parent.raw.TypeName === Constants.SystemAppTypeName) {
            return;
        }

        //TODO 
        // this.actions.add(new ActionWithConfirmationDialog(
        //     this.data.$uibModal,
        //     this.data.$q,
        //     "deleteService",
        //     "Delete Service",
        //     "Deleting",
        //     () => this.delete(),
        //     () => true,
        //     "Confirm Service Deletion",
        //     `Delete service ${this.name} from cluster ${this.data.$location.host()}?`,
        //     this.name
        // ));
    }

    private setAdvancedActions(): void {
        if (this.parent.raw.TypeName === Constants.SystemAppTypeName || this.isStatelessService) {
            return;
        }

        //TODO 
        // this.actions.add(new ActionWithDialog(
        //     this.data.$uibModal,
        //     this.data.$q,
        //     "enableServiceBackup",
        //     "Enable/Update Service Backup",
        //     "Enabling Service Backup",
        //     () => this.data.restClient.enableServiceBackup(this).then(() => {
        //         this.serviceBackupConfigurationInfoCollection.refresh();
        //     }),
        //     () => true,
        //     <angular.ui.bootstrap.IModalSettings>{
        //         templateUrl: "partials/enableBackup.html",
        //         controller: ActionController,
        //         resolve: {
        //             action: () => this
        //         }
        //     },
        //     null
        // ));

        // this.actions.add(new ActionWithDialog(
        //     this.data.$uibModal,
        //     this.data.$q,
        //     "disableServiceBackup",
        //     "Disable Service Backup",
        //     "Disabling Service Backup",
        //     () => this.data.restClient.disableServiceBackup(this).then(() => {
        //         this.serviceBackupConfigurationInfoCollection.refresh();
        //     }),
        //     () => this.serviceBackupConfigurationInfoCollection.collection.length && this.serviceBackupConfigurationInfoCollection.collection[0].raw && this.serviceBackupConfigurationInfoCollection.collection[0].raw.Kind === "Service" && this.serviceBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === "Service",
        //     <angular.ui.bootstrap.IModalSettings>{
        //         templateUrl: "partials/disableBackup.html",
        //         controller: ActionController,
        //         resolve: {
        //             action: () => this
        //         }
        //     },
        //     null
        // ));

        // this.actions.add(new ActionWithConfirmationDialog(
        //     this.data.$uibModal,
        //     this.data.$q,
        //     "suspendServiceBackup",
        //     "Suspend Service Backup",
        //     "Suspending...",
        //     () => this.data.restClient.suspendServiceBackup(this.id).then(() => {
        //         this.serviceBackupConfigurationInfoCollection.refresh();
        //     }),
        //     () => this.serviceBackupConfigurationInfoCollection.collection.length && this.serviceBackupConfigurationInfoCollection.collection[0].raw && this.serviceBackupConfigurationInfoCollection.collection[0].raw.Kind === "Service" && this.serviceBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === "Service" && this.serviceBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === false,
        //     "Confirm Service Backup Suspension",
        //     `Suspend service backup for ${this.name} ?`,
        //     this.name));

        // this.actions.add(new ActionWithConfirmationDialog(
        //     this.data.$uibModal,
        //     this.data.$q,
        //     "resumeServiceBackup",
        //     "Resume Service Backup",
        //     "Resuming...",
        //     () => this.data.restClient.resumeServiceBackup(this.id).then(() => {
        //         this.serviceBackupConfigurationInfoCollection.refresh();
        //     }),
        //     () => this.serviceBackupConfigurationInfoCollection.collection.length && this.serviceBackupConfigurationInfoCollection.collection[0].raw && this.serviceBackupConfigurationInfoCollection.collection[0].raw.Kind === "Service" && this.serviceBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === "Service" && this.serviceBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === true,
        //     "Confirm Service Backup Resumption",
        //     `Resume service backup for ${this.name} ?`,
        //     this.name));
    }

    private delete(): Observable<any> {
        return this.data.restClient.deleteService(this.parent.id, this.id);
    }
}

export class ServiceHealth extends HealthBase<IRawServiceHealth> {
    public constructor(data: DataService, public parent: Service,
        protected eventsHealthStateFilter: HealthStateFilterFlags,
        protected partitionsHealthStateFilter: HealthStateFilterFlags) {
        super(data, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawServiceHealth> {
        return Utils.getHttpResponseData(this.data.restClient.getServiceHealth(this.parent.parent.id, this.parent.id,
            this.eventsHealthStateFilter, this.partitionsHealthStateFilter, messageHandler));
    }
}

export class ServiceDescription extends DataModelBase<IRawServiceDescription> {
    public decorators: IDecorators = {
        hideList: [
            "ServiceKind",
            "ServiceName",
            "ServiceTypeName",
            "HasPersistedState",
            "IsDefaultMoveCostSpecified",
            "Flags"
        ],
        decorators: {
            "DefaultMoveCost": {
                displayName: (name) => "Move Cost"
            }
        }
    };

    public constructor(data: DataService, public parent: Service) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawServiceDescription> {
        return Utils.getHttpResponseData(this.data.restClient.getServiceDescription(this.parent.parent.id, this.parent.id, messageHandler));
    }
}

export class ServiceType extends DataModelBase<IRawServiceType> {
    public manifest: ServiceManifest;

    public constructor(data: DataService, raw: IRawServiceType, public parent: ApplicationType | Application) {
        super(data, raw, parent);

        this.manifest = new ServiceManifest(this.data, this);

        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public get serviceKind(): string {
        return this.raw.ServiceTypeDescription.IsStateful ? Constants.ServiceKindStateful : Constants.ServiceKindStateless;
    }

    public get serviceKindInNumber(): number {
        return this.serviceKind === Constants.ServiceKindStateful ? 2 : 1;
    }

    public get name(): string {
        return this.raw.ServiceTypeDescription.ServiceTypeName;
    }

    public createService(description: CreateServiceDescription): Observable<any> {
        let createServicePromise = null;
        if (description.createFromTemplate) {
            createServicePromise = this.data.restClient.createServiceFromTemplate(description.application.id, description.createFromTemplateDescription);
        } else {
            createServicePromise = this.data.restClient.createService(description.application.id, description.createDescription);
        }

        return createServicePromise;
    }

    private setUpActions() {
        // TODO
        // if (this.parent instanceof Application) {
        //     this.actions.add(new ActionCreateService(this.data.$uibModal, this.data.$q, this));
        // }
    }
}

export class ServiceManifest extends DataModelBase<IRawServiceManifest> {
    public packages: ServiceTypePackage[] = [];

    public constructor(data: DataService, public parent: DeployedServicePackage | ServiceType) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawServiceManifest> {
        if (this.parent instanceof ServiceType) {
            let serviceType = <ServiceType>(this.parent);
            let appType = <ApplicationType>serviceType.parent;
            return this.getServiceManifest(serviceType.parent.name, appType.raw.Version, serviceType.raw.ServiceManifestName, messageHandler);
        } else {
            let deployedService = <DeployedServicePackage>(this.parent);
            return this.data.getApp(deployedService.parent.raw.Id, false, messageHandler).pipe(mergeMap(app => {
                return this.getServiceManifest(app.raw.TypeName, app.raw.TypeVersion, deployedService.name, messageHandler);
            }));
        }
    }

    protected updateInternal(): Observable<any> | void {
        let $xml = $($.parseXML(this.raw.Manifest));
        let $packType = $xml.find("CodePackage");

        let packages = [];
        $packType.forEach( (item) => {
            packages.push(new ServiceTypePackage(this.data, "Code", item.getAttribute("Name"), item.getAttribute("Version")));
        });

        $packType = $xml.find("ConfigPackage");
        $packType.forEach((item) => {
            packages.push(new ServiceTypePackage(this.data, "Config", item.getAttribute("Name"), item.getAttribute("Version")));
        });

        this.packages = packages;
    }

    private getServiceManifest(appTypeName: string, appTypeVersion: string, manifestName: string,
        messageHandler?: IResponseMessageHandler): Observable<IRawServiceManifest> {
        return Utils.getHttpResponseData(this.data.restClient.getServiceManifest(appTypeName, appTypeVersion, manifestName, messageHandler));
    }
}

export class ServiceTypePackage extends DataModelBase<any> {
    public constructor(data: DataService, public Type: string, public Name: string, public Version: string) {
        super(data, Type);
    }

    public get id(): string {
        return this.Type + " " + this.Name + " " + this.Version;
    }
}

export class ActionCreateService extends ActionWithDialog {
    public description: CreateServiceDescription;

    constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, public serviceType: ServiceType) {
        super($uibModal,
            $q,
            "createService",
            "Create",
            "Creating",
            () => serviceType.createService(this.description).then(() => {
                if (this.description) {
                    // when success, reset the dialog
                    this.description.reset();
                }
            }),
            () => true,
            <angular.ui.bootstrap.IModalSettings>{
                templateUrl: "partials/create-service-dialog.html",
                controller: ActionController,
                size: "lg",
                backdrop: "static", // Clicking outside of the dialog does not close it
                resolve: {
                    action: () => this
                }
            }
        );

        this.description = new CreateServiceDescription(serviceType, <Application>serviceType.parent);
    }
}

export class ActionScaleService extends ActionWithDialog {
    public updateServiceDescription: IRawUpdateServiceDescription;

    constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, service: Service) {
        super($uibModal,
            $q,
            "scaleService",
            "Scale Service",
            "Scaling Service",
            () => service.updateService(this.updateServiceDescription),
            () => service.isStatelessService,
            <angular.ui.bootstrap.IModalSettings>{
                templateUrl: "partials/scale-service-dialog.html",
                controller: ActionController,
                resolve: {
                    action: () => this
                }
            },
            () => {
                // Before opening the dialog, refresh service description to get its updated instance count
                return service.description.ensureInitialized().then(() => {
                    this.updateServiceDescription.InstanceCount = service.description.raw.InstanceCount;
                });
            }
        );

        this.updateServiceDescription = <IRawUpdateServiceDescription>{
            ServiceKind: service.serviceKindInNumber,
            Flags: 0x01, // Update InstanceCount flag
            InstanceCount: 0
        };
    }
}

export class CreateServiceDescription {
    public raw: IRawCreateServiceDescription;

    public initializationData: string;
    public createFromTemplate: boolean;
    public isAdvancedOptionCollapsed: boolean;

    public get createDescription(): IRawCreateServiceDescription {
        let descriptionCloned = _.cloneDeep(this.raw);
        let flags = 0;
        if (this.raw.ReplicaRestartWaitDurationSeconds !== null) {
            flags ^= 0x01;
        } else {
            delete descriptionCloned.ReplicaRestartWaitDurationSeconds;
        }
        if (this.raw.QuorumLossWaitDurationSeconds !== null) {
            flags ^= 0x02;
        } else {
            delete descriptionCloned.QuorumLossWaitDurationSeconds;
        }
        if (this.raw.StandByReplicaKeepDurationSeconds !== null) {
            flags ^= 0x04;
        } else {
            delete descriptionCloned.StandByReplicaKeepDurationSeconds;
        }
        descriptionCloned.Flags = flags;
        descriptionCloned.InitializationData = Utils.hexToBytes(this.initializationData);
        return descriptionCloned;
    }

    public get createFromTemplateDescription(): IRawCreateServiceFromTemplateDescription {
        return <IRawCreateServiceFromTemplateDescription>{
            ApplicationName: this.raw.ApplicationName,
            ServiceName: this.raw.ServiceName,
            ServiceTypeName: this.raw.ServiceTypeName,
            ServicePackageActivationMode: this.raw.ServicePackageActivationMode,
            InitializationData: Utils.hexToBytes(this.initializationData)
        };
    }

    public get servicePartitionKinds(): string[] {
        return FabricEnumValues.ServicePartitionKinds;
    }

    public get servicePackageActivationModes(): string[] {
        return FabricEnumValues.ServicePackageActivationModes;
    }

    public get placementPolicies(): string[] {
        return FabricEnumValues.PlacementPolicies;
    }

    public get serviceCorrelationSchemes(): string[] {
        return FabricEnumValues.ServiceCorrelationSchemes;
    }

    public get serviceLoadMetricWeights(): string[] {
        return FabricEnumValues.ServiceLoadMetricWeights;
    }

    public get serviceNamePattern(): string {
        return `^${_.escapeRegExp(this.raw.ApplicationName)}.+`;
    }

    public constructor(public serviceType: ServiceType, public application: Application) {
        this.reset();
    }

    public toggleAdvancedOptions(): void {
        if (!this.createFromTemplate) {
            this.isAdvancedOptionCollapsed = !this.isAdvancedOptionCollapsed;
        }
    }

    public addName(): void {
        this.raw.PartitionDescription.Names.push("");
    }

    public addPlacementPolicy(): void {
        this.raw.ServicePlacementPolicies.push({
            Type: "1"
        });
    }

    public addServiceCorrelation(): void {
        this.raw.CorrelationScheme.push({
            ServiceName: "",
            Scheme: "1"
        });
    }

    public addLoadMetric(): void {
        this.raw.ServiceLoadMetrics.push({
            Name: "",
            Weight: "1",
            PrimaryDefaultLoad: null,
            SecondaryDefaultLoad: null
        });
    }

    public reset(): void {
        this.initializationData = "";
        this.createFromTemplate = false;
        this.isAdvancedOptionCollapsed = true;
        this.raw = {
            ServiceKind: this.serviceType.serviceKindInNumber,
            ApplicationName: this.application.name,
            ServiceName: `${this.application.name}/${this.serviceType.name}`,
            ServiceTypeName: this.serviceType.name,
            InitializationData: [],
            PartitionDescription: {
                PartitionScheme: "1",
                Count: 1,
                Names: [],
                LowKey: "",
                HighKey: ""
            },
            Flags: 0,
            ReplicaRestartWaitDurationSeconds: null,
            QuorumLossWaitDurationSeconds: null,
            StandByReplicaKeepDurationSeconds: null,
            TargetReplicaSetSize: 1,
            MinReplicaSetSize: 1,
            HasPersistedState: this.serviceType.raw.ServiceTypeDescription.HasPersistedState,
            InstanceCount: 1,
            PlacementConstraints: "",
            CorrelationScheme: [],
            ServiceLoadMetrics: [],
            ServicePlacementPolicies: [],
            ServicePackageActivationMode: "0",
            ServiceDnsName: ""
        };
    }
}
// export class ServiceBackupConfigurationInfo extends DataModelBase<IRawServiceBackupConfigurationInfo> {
//     public decorators: IDecorators = {
//         hideList: [
//             "action.Name",
//         ]
//     };
//     public action: ActionWithDialog;
//     public constructor(data: DataService, raw: IRawServiceBackupConfigurationInfo, public parent: Service) {
//         super(data, raw, parent);
//         this.action = new ActionWithDialog(
//             data.$uibModal,
//             data.$q,
//             raw.PolicyName,
//             raw.PolicyName,
//             "Creating",
//             () => this.data.restClient.deleteBackupPolicy(this.raw.PolicyName),
//             () => true,
//             <angular.ui.bootstrap.IModalSettings>{
//                 templateUrl: "partials/backupPolicy.html",
//                 controller: ActionController,
//                 resolve: {
//                     action: () => this.data.getBackupPolicy(this.raw.PolicyName)
//                 }
//             },
//             null);
//     }
// }


