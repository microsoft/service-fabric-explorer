import { IRawApplication, IRawApplicationHealth, IRawApplicationManifest, IRawDeployedApplicationHealthState, IRawApplicationUpgradeProgress, IRawApplicationBackupConfigurationInfo } from '../RawDataTypes';
import { DataModelBase, IDecorators } from './Base';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { ServiceTypeCollection, ApplicationBackupConfigurationInfoCollection } from './collections/Collections';
import { DataService } from 'src/app/services/data.service';
import { HealthStateFilterFlags, IClusterHealthChunkQueryDescription, IApplicationHealthStateFilter } from '../HealthChunkRawDataTypes';
import { AppStatusConstants, Constants, HealthStateConstants, UpgradeDomainStateNames } from 'src/app/Common/Constants';
import { IResponseMessageHandler, ResponseMessageHandlers } from 'src/app/Common/ResponseMessageHandlers';
import { ITextAndBadge } from 'src/app/Utils/ValueResolver';
import { HealthBase } from './HealthEvent';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { HealthEvaluation, UpgradeDescription, UpgradeDomain } from './Shared';
import { Utils } from 'src/app/Utils/Utils';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HealthUtils } from 'src/app/Utils/healthUtils';
import { ServiceCollection } from './collections/ServiceCollection';
import { ActionWithConfirmationDialog, IsolatedAction } from '../Action';
import   isEmpty from 'lodash/isEmpty';
import { ViewBackupComponent } from 'src/app/modules/backup-restore/view-backup/view-backup.component';
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

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

        if (this.data.actionsAdvancedEnabled()) {
            this.setAdvancedActions();
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

    public delete(): Observable<any> {
        let compose = this.raw.ApplicationDefinitionKind === Constants.ComposeApplicationDefinitionKind;
        let action = compose ? this.data.restClient.deleteComposeApplication(this.id) : this.data.restClient.deleteApplication(this.id);

        return action.pipe(map(() => {
            this.cleanUpApplicationReplicas();
        }));
    }

    public addHealthStateFiltersForChildren(clusterHealthChunkQueryDescription: IClusterHealthChunkQueryDescription): IApplicationHealthStateFilter {
        let appFilter = clusterHealthChunkQueryDescription.ApplicationFilters.find(filter => filter.ApplicationNameFilter === this.name);
        if (!appFilter) {
            appFilter = {
                ApplicationNameFilter: this.name,
                ServiceFilters: []
            };
            clusterHealthChunkQueryDescription.ApplicationFilters.push(appFilter);
        }
        if (isEmpty(appFilter.ServiceFilters)) {
            appFilter.ServiceFilters = [{
                HealthStateFilter: HealthStateFilterFlags.All
            }];
        }
        return appFilter;
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplication> {
        return this.data.restClient.getApplication(this.id, messageHandler);
    }

    public removeAdvancedActions(): void {
        this.actions.collection = this.actions.collection.filter(action => ["enableApplicationBackup", "disableApplicationBackup", "suspendApplicationBackup", "suspendApplicationBackup"].indexOf(action.name) === -1);
    }

    private setUpActions(): void {
        if (this.raw.TypeName === Constants.SystemAppTypeName) {
            return;
        }
        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            "deleteApplication",
            "Delete Application",
            "Deleting...",
            () => this.delete(),
            () => true,
            "Confirm Application Deletion",
            `Delete application ${this.name} from cluster ${window.location.host}?`,
            this.name));
    }

    private setAdvancedActions(): void {
        if (this.raw.TypeName === Constants.SystemAppTypeName) {
            return;
        }
    }

    //TODO TEST AND FIND OUT WHAT THIS IS
    private cleanUpApplicationReplicas() {
        this.data.getNodes(true)
            .subscribe(nodes => {
                let replicas = [];

                let replicaQueries = nodes.collection.map((node) =>
                    this.data.restClient.getReplicasOnNode(node.name, this.id)
                        .pipe(catchError(err => of([])), 
                            map((response) => (response || []).forEach((replica) => {
                                replicas.push({
                                    Replica: replica,
                                    NodeName: node.name
                                });
                            }))
                        )
                    );

                forkJoin(replicaQueries).pipe(map(() => {
                    replicas.forEach(replicaInfo =>
                        this.data.restClient.deleteReplica(
                            replicaInfo.NodeName,
                            replicaInfo.Replica.PartitionId,
                            replicaInfo.Replica.ReplicaId,
                            true /*force*/,
                            ResponseMessageHandlers.silentResponseMessageHandler).subscribe() )
                })).subscribe();
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

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplication> {
        // There is no special API to get system application, so we query its health
        // state and retrieve the health state from there.
        return this.health.refresh(messageHandler).pipe(map(health => {
            this.raw.HealthState = health.raw.AggregatedHealthState;
            return this.raw;
        }));
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
        let deployedAppsHealthStates = this.raw.DeployedApplicationHealthStates.map(app => this.valueResolver.resolveHealthStatus(app.AggregatedHealthState));
        return this.valueResolver.resolveHealthStatus(Utils.max(deployedAppsHealthStates.map( healthState => HealthStateConstants.Values[healthState.text])).toString());
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplicationHealth> {
        return this.data.restClient.getApplicationHealth(this.parent.id, this.eventsHealthStateFilter,
            this.servicesHealthStateFilter, this.deployedApplicationsHealthStateFilter, messageHandler);
    }

    protected updateInternal(): Observable<any> | void {
        super.updateInternal();
        this.deployedApplicationHealthStates = this.raw.DeployedApplicationHealthStates.map(healthState => new DeployedApplicationHealthState(this.data, healthState, this));
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

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.restClient.getApplicationManifestForApplicationType(
            this.parent.raw.TypeName, this.parent.raw.TypeVersion, messageHandler);
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

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplicationUpgradeProgress> {
        return this.data.restClient.getApplicationUpgradeProgress(this.parent.id, messageHandler);
    }

    protected updateInternal(): Observable<any> | void {
                                                                                                //set depth to 0 and parent ref to null
        this.unhealthyEvaluations = HealthUtils.getParsedHealthEvaluations(this.raw.UnhealthyEvaluations, 0, null, this.data);

        let domains = this.raw.UpgradeDomains.map(ud => new UpgradeDomain(this.data, ud));
        let groupedDomains = domains.filter(ud => ud.stateName === UpgradeDomainStateNames.Completed)
            .concat(domains.filter(ud => ud.stateName === UpgradeDomainStateNames.InProgress))
            .concat(domains.filter(ud => ud.name === this.raw.NextUpgradeDomain))
            .concat(domains.filter(ud => ud.stateName === UpgradeDomainStateNames.Pending && ud.name !== this.raw.NextUpgradeDomain));

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

    public action: IsolatedAction;
    public constructor(data: DataService, raw: IRawApplicationBackupConfigurationInfo, public parent: Application) {
        super(data, raw, parent);
        this.action = new IsolatedAction(
            data.dialog,
            "deleteBackupPolicy",
            "Delete Backup Policy",
            "Deleting",
            {
                backup: raw,
                delete: () => data.restClient.deleteBackupPolicy(this.raw.PolicyName)
            },
            ViewBackupComponent,
            () => true,
            () => this.data.restClient.getBackupPolicy(this.raw.PolicyName).pipe(map(data => {
                this.action.data.backup = data;
            }))
            );
    }

    public get uniqueId(): string {
        return this.raw.PolicyName + '-' + this.raw.Kind;
    }
}


