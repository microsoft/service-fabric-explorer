//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class Application extends DataModelBase<IRawApplication> {
        public decorators: IDecorators = {
            decorators: {
                "TypeName": {
                    displayValueInHtml: (value) => HtmlUtils.getLinkHtml(value, this.appTypeViewPath)
                }
            }
        };

        public upgradeProgress: ApplicationUpgradeProgress;
        public services: ServiceCollection;
        public manifest: ApplicationManifest;
        public health: ApplicationHealth;
        public serviceTypes: ServiceTypeCollection;
        public applicationBackupConfigurationInfoCollection: ApplicationBackupConfigurationInfoCollection;
        public backupPolicyName: string;
        public cleanBackup: boolean;

        public constructor(data: DataService, raw?: IRawApplication) {
            super(data, raw);

            this.services = new ServiceCollection(data, this);
            this.health = new ApplicationHealth(data, this, HealthStateFilterFlags.Default, HealthStateFilterFlags.None, HealthStateFilterFlags.Default);
            this.manifest = new ApplicationManifest(data, this);
            this.serviceTypes = new ServiceTypeCollection(data, this);
            this.upgradeProgress = new ApplicationUpgradeProgress(data, this);
            this.applicationBackupConfigurationInfoCollection = new ApplicationBackupConfigurationInfoCollection(data, this);
            this.cleanBackup = false;

            if (this.data.actionsEnabled()) {
                this.setUpActions();
            }
        }

        public get isUpgrading(): boolean {
            return this.raw.Status === AppStatusConstants.Upgrading;
        }

        public get viewPath(): string {
            return this.data.routes.getAppViewPath(this.raw.TypeName, this.id);
        }

        public get appTypeViewPath(): string {
            if (this.raw.TypeName === Constants.SystemAppTypeName) {
                return this.data.routes.getSystemAppsViewPath();
            }
            return this.data.routes.getAppTypeViewPath(this.raw.TypeName);
        }

        public delete(): angular.IPromise<any> {
            let compose = this.raw.ApplicationDefinitionKind === Constants.ComposeApplicationDefinitionKind;
            let action = compose ? this.data.restClient.deleteComposeApplication(this.id) : this.data.restClient.deleteApplication(this.id);

            return action.then(() => {
                this.cleanUpApplicationReplicas();
            });
        }

        public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IApplicationHealthStateFilter {
            let appFilter = _.find(clusterHealthChunkQueryDescription.ApplicationFilters, filter => filter.ApplicationNameFilter === this.name);
            if (!appFilter) {
                appFilter = {
                    ApplicationNameFilter: this.name,
                    ServiceFilters: []
                };
                clusterHealthChunkQueryDescription.ApplicationFilters.push(appFilter);
            }
            if (_.isEmpty(appFilter.ServiceFilters)) {
                appFilter.ServiceFilters = [{
                    HealthStateFilter: HealthStateFilterFlags.All
                }];
            }
            return appFilter;
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplication> {
            return Utils.getHttpResponseData(this.data.restClient.getApplication(this.id, messageHandler));
        }

        public setUpActions() {
            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "deleteApplication",
                "Delete Application",
                "Deleting...",
                () => this.delete(),
                () => true,
                "Confirm Application Deletion",
                `Delete application ${this.name} from cluster ${this.data.$location.host()}?`,
                this.name));

            this.actions.add(new ActionWithDialog(
                this.data.$uibModal,
                this.data.$q,
                "enableApplicationBackup",
                "Enable/Update Application Backup",
                "Enabling Application Backup",
                () => this.data.restClient.enableApplicationBackup(this).then(() => {
                    this.applicationBackupConfigurationInfoCollection.refresh();
                }),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/enableBackup.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this
                    }
                },
                null
            ));
            this.actions.add(new ActionWithDialog(
                this.data.$uibModal,
                this.data.$q,
                "disableApplicationBackup",
                "Disable Application Backup",
                "Disabling Application Backup",
                () => this.data.restClient.disableApplicationBackup(this).then(() => {
                    this.applicationBackupConfigurationInfoCollection.refresh();
                }),
                () => this.applicationBackupConfigurationInfoCollection.collection.length && this.applicationBackupConfigurationInfoCollection.collection[0].raw && this.applicationBackupConfigurationInfoCollection.collection[0].raw.Kind === "Application" && this.applicationBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === "Application",
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/disableBackup.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this
                    }
                },
                null
            ));

            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "suspendApplicationBackup",
                "Suspend Application Backup",
                "Suspending...",
                () => this.data.restClient.suspendApplicationBackup(this.id).then(() => {
                    this.applicationBackupConfigurationInfoCollection.refresh();
                }),
                () => this.applicationBackupConfigurationInfoCollection.collection.length && this.applicationBackupConfigurationInfoCollection.collection[0].raw && this.applicationBackupConfigurationInfoCollection.collection[0].raw.Kind === "Application" && this.applicationBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === "Application" && this.applicationBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === false,
                "Confirm Application Backup Suspension",
                `Suspend application backup for ${this.name} ?`,
                this.name));

            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "resumeApplicationBackup",
                "Resume Application Backup",
                "Resuming...",
                () => this.data.restClient.resumeApplicationBackup(this.id).then(() => {
                    this.applicationBackupConfigurationInfoCollection.refresh();
                }),
                () => this.applicationBackupConfigurationInfoCollection.collection.length && this.applicationBackupConfigurationInfoCollection.collection[0].raw && this.applicationBackupConfigurationInfoCollection.collection[0].raw.Kind === "Application" && this.applicationBackupConfigurationInfoCollection.collection[0].raw.PolicyInheritedFrom === "Application" && this.applicationBackupConfigurationInfoCollection.collection[0].raw.SuspensionInfo.IsSuspended === true,
                "Confirm Application Backup Resumption",
                `Resume application backup for ${this.name} ?`,
                this.name));
        }

        private cleanUpApplicationReplicas() {
            this.data.getNodes(true)
                .then(nodes => {
                    let replicas = [];

                    let replicaQueries = _.map(nodes.collection, (node) =>
                        this.data.restClient.getReplicasOnNode(node.name, this.id)
                            .then((response) => _.forEach(response.data, (replica) => {
                                replicas.push({
                                    Replica: replica,
                                    NodeName: node.name
                                });
                            })));

                    this.data.$q.all(replicaQueries).then(() =>
                        _.forEach(replicas, (replicaInfo) =>
                            this.data.restClient.deleteReplica(
                                replicaInfo.NodeName,
                                replicaInfo.Replica.PartitionId,
                                replicaInfo.Replica.ReplicaId,
                                true /*force*/,
                                ResponseMessageHandlers.silentResponseMessageHandler)));
                });
        }
    }

    // This class is due to the special-ness of the System application.
    export class SystemApplication extends Application {
        public constructor(data: DataService) {
            super(data, {
                Id: Constants.SystemAppId,
                Name: Constants.SystemAppName,
                TypeName: Constants.SystemAppTypeName,
                TypeVersion: "",
                Parameters: [],
                Status: "-1",
                HealthState: "0",
                ApplicationDefinitionKind: ""
            });

            this.isInitialized = false;
        }

        public get status(): ITextAndBadge {
            // Do not show status for system application
            return null;
        }

        public get viewPath(): string {
            return this.data.routes.getSystemAppsViewPath();
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplication> {
            // There is no special API to get system application, so we query its health
            // state and retrieve the health state from there.
            return this.health.refresh(messageHandler).then(health => {
                this.raw.HealthState = health.raw.AggregatedHealthState;
                return this.raw;
            });
        }
    }

    export class ApplicationHealth extends HealthBase<IRawApplicationHealth> {
        public deployedApplicationHealthStates: DeployedApplicationHealthState[] = [];

        public constructor(data: DataService, public parent: Application,
            protected eventsHealthStateFilter: HealthStateFilterFlags,
            protected servicesHealthStateFilter: HealthStateFilterFlags,
            protected deployedApplicationsHealthStateFilter: HealthStateFilterFlags) {
            super(data, parent);
        }

        public get deploymentsHealthState(): ITextAndBadge {
            let deployedAppsHealthStates = _.map(this.raw.DeployedApplicationHealthStates, app => this.valueResolver.resolveHealthStatus(app.AggregatedHealthState));
            return this.valueResolver.resolveHealthStatus(_.max(_.map(deployedAppsHealthStates, healthState => HealthStateConstants.Values[healthState.text])));
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationHealth> {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationHealth(this.parent.id, this.eventsHealthStateFilter,
                this.servicesHealthStateFilter, this.deployedApplicationsHealthStateFilter, messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            super.updateInternal();
            this.deployedApplicationHealthStates = _.map(this.raw.DeployedApplicationHealthStates, healthState => new DeployedApplicationHealthState(this.data, healthState, this));
        }
    }

    export class DeployedApplicationHealthState extends DataModelBase<IRawDeployedApplicationHealthState> {
        public get viewPath(): string {
            return this.data.routes.getDeployedAppViewPath(this.raw.NodeName, this.parent.parent.id);
        }

        public constructor(data: DataService, raw: IRawDeployedApplicationHealthState, public parent: ApplicationHealth) {
            super(data, raw, parent);
        }
    }

    export class ApplicationManifest extends DataModelBase<IRawApplicationManifest> {
        public constructor(data: DataService, public parent: Application) {
            super(data, null, parent);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationManifestForApplicationType(
                this.parent.raw.TypeName, this.parent.raw.TypeVersion, messageHandler));
        }
    }

    export class ApplicationUpgradeProgress extends DataModelBase<IRawApplicationUpgradeProgress> {
        public decorators: IDecorators = {
            hideList: [
                // Unhealthy evaluations are displayed in seperate section in app detail page
                "UnhealthyEvaluations"
            ],
            decorators: {
                "UpgradeDurationInMilliseconds": {
                    displayName: (name) => "Upgrade Duration",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                },
                "UpgradeDomainDurationInMilliseconds": {
                    displayName: (name) => "Upgrade Domain Duration",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                }
            }
        };

        public unhealthyEvaluations: HealthEvaluation[] = [];
        public upgradeDomains: UpgradeDomain[] = [];
        public upgradeDescription: UpgradeDescription;

        public constructor(data: DataService, public parent: Application) {
            super(data, null, parent);
        }

        public get viewPath(): string {
            return this.parent.viewPath;
        }

        public get uniqueId(): string {
            return this.name + "/" + this.raw.TypeName + "/" + this.raw.TargetApplicationTypeVersion;
        }

        public get startTimestampUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.StartTimestampUtc);
        }

        public get failureTimestampUtc(): string {
            return TimeUtils.timestampToUTCString(this.raw.FailureTimestampUtc);
        }

        public get upgradeDuration(): string {
            return TimeUtils.getDuration(this.raw.UpgradeDurationInMilliseconds);
        }

        public get upgradeDomainDuration(): string {
            return TimeUtils.getDuration(this.raw.UpgradeDomainDurationInMilliseconds);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationUpgradeProgress> {
            return Utils.getHttpResponseData(this.data.restClient.getApplicationUpgradeProgress(this.parent.id, messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
                                                                                                    //set depth to 0 and parent ref to null
            this.unhealthyEvaluations = Utils.getParsedHealthEvaluations(this.raw.UnhealthyEvaluations, 0, null, this.data);

            let domains = _.map(this.raw.UpgradeDomains, ud => new UpgradeDomain(this.data, ud));
            let groupedDomains = _.filter(domains, ud => ud.stateName === UpgradeDomainStateNames.Completed)
                .concat(_.filter(domains, ud => ud.stateName === UpgradeDomainStateNames.InProgress))
                .concat(_.filter(domains, ud => ud.name === this.raw.NextUpgradeDomain))
                .concat(_.filter(domains, ud => ud.stateName === UpgradeDomainStateNames.Pending && ud.name !== this.raw.NextUpgradeDomain));

            this.upgradeDomains = groupedDomains;

            if (this.raw.UpgradeDescription) {
                this.upgradeDescription = new UpgradeDescription(this.data, this.raw.UpgradeDescription);
            }
        }
    }
    export class ApplicationBackupConfigurationInfo extends DataModelBase<IRawApplicationBackupConfigurationInfo> {
        public decorators: IDecorators = {
            hideList: [
                "action.Name",
            ]
        };
        public action: ActionWithDialog;
        public constructor(data: DataService, raw: IRawApplicationBackupConfigurationInfo, public parent: Application) {
            super(data, raw, parent);
            this.action = new ActionWithDialog(
                data.$uibModal,
                data.$q,
                raw.PolicyName,
                raw.PolicyName,
                "Creating",
                () => this.data.restClient.deleteBackupPolicy(this.raw.PolicyName),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/backupPolicy.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this.data.getBackupPolicy(this.raw.PolicyName)
                    }
                },
                null);
        }
    }
}

