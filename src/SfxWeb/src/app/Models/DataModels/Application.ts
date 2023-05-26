import { IRawApplication, IRawApplicationHealth, IRawApplicationManifest, IRawDeployedApplicationHealthState,
         IRawApplicationUpgradeProgress, IRawApplicationBackupConfigurationInfo, IRawUpgradeDomainProgress } from '../RawDataTypes';
import { DataModelBase, IDecorators } from './Base';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { ServiceTypeCollection, ApplicationBackupConfigurationInfoCollection } from './collections/Collections';
import { DataService } from 'src/app/services/data.service';
import { HealthStateFilterFlags, IClusterHealthChunkQueryDescription, IApplicationHealthStateFilter } from '../HealthChunkRawDataTypes';
import { AppStatusConstants, ClusterUpgradeStates, Constants, HealthStateConstants, UpgradeDomainStateNames, UpgradeDomainStateRegexes } from 'src/app/Common/Constants';
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
import isEmpty from 'lodash/isEmpty';
import { ViewBackupComponent } from 'src/app/modules/backup-restore/view-backup/view-backup.component';
import { RoutesService } from 'src/app/services/routes.service';
// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class Application extends DataModelBase<IRawApplication> {
    public decorators: IDecorators = {
        decorators: {

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
        return RoutesService.getAppViewPath(this.raw.TypeName, this.id);
    }

    public get appTypeViewPath(): string {
        if (this.raw.TypeName === Constants.SystemAppTypeName) {
            return RoutesService.getSystemAppsViewPath();
        }
        return RoutesService.getAppTypeViewPath(this.raw.TypeName);
    }

    public delete(): Observable<any> {
        const compose = this.raw.ApplicationDefinitionKind === Constants.ComposeApplicationDefinitionKind;
        const action = compose ? this.data.restClient.deleteComposeApplication(this.id) : this.data.restClient.deleteApplication(this.id);

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
        return this.data.restClient.getApplication(this.id, this.data.readOnlyHeader, messageHandler);
    }

    private setUpActions(): void {
        if (this.raw.TypeName === Constants.SystemAppTypeName) {
            return;
        }
        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            'deleteApplication',
            'Delete Application',
            'Deleting...',
            () => this.delete(),
            () => true,
            'Confirm Application Deletion',
            `Delete application ${this.name} from cluster ${window.location.host}?`,
            this.name));
    }

    private setAdvancedActions(): void {
        if (this.raw.TypeName === Constants.SystemAppTypeName) {
            return;
        }
    }

    // TODO TEST AND FIND OUT WHAT THIS IS
    private cleanUpApplicationReplicas() {
        this.data.getNodes(true)
            .subscribe(nodes => {
                const replicas = [];

                const replicaQueries = nodes.collection.map((node) =>
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
                            ResponseMessageHandlers.silentResponseMessageHandler).subscribe() );
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
            TypeVersion: '',
            Parameters: [],
            Status: '-1',
            HealthState: '0',
            ApplicationDefinitionKind: ''
        });

        this.isInitialized = false;
    }

    public get status(): ITextAndBadge {
        // Do not show status for system application
        return null;
    }

    public get viewPath(): string {
        return RoutesService.getSystemAppsViewPath();
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
        const deployedAppsHealthStates = this.raw.DeployedApplicationHealthStates.map(app => this.valueResolver.resolveHealthStatus(app.AggregatedHealthState));
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
        return RoutesService.getDeployedAppViewPath(this.raw.NodeName, this.parent.parent.id);
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
            'UnhealthyEvaluations'
        ],
        decorators: {
            UpgradeDurationInMilliseconds: {
                displayName: (name) => 'Upgrade Duration',
                displayValue: (value) => TimeUtils.getDuration(value)
            },
            UpgradeDomainDurationInMilliseconds: {
                displayName: (name) => 'Upgrade Domain Duration',
                displayValue: (value) => TimeUtils.getDuration(value)
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
        return this.name + '/' + this.raw.TypeName + '/' + this.raw.TargetApplicationTypeVersion;
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


    public get isUpgrading() {
      return UpgradeDomainStateRegexes.InProgress.test(this.raw.UpgradeState) || this.raw.UpgradeState === ClusterUpgradeStates.RollingForwardPending;
    }

    public getUpgradeDomainTimeout(): number {
      return TimeUtils.getDurationMilliseconds(this.raw.UpgradeDescription.MonitoringPolicy.UpgradeDomainTimeoutInMilliseconds);
    }

    public get currentDomainTime(): number {
        return TimeUtils.getDurationMilliseconds(this.raw.UpgradeDomainDurationInMilliseconds);
    }

    public getUpgradeTimeout(): number {
        return TimeUtils.getDurationMilliseconds(this.raw.UpgradeDescription.MonitoringPolicy.UpgradeTimeoutInMilliseconds);
    }

    public get upgradeTime(): number {
        return TimeUtils.getDurationMilliseconds(this.raw.UpgradeDurationInMilliseconds);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawApplicationUpgradeProgress> {
        return this.data.restClient.getApplicationUpgradeProgress(this.parent.id, messageHandler);
    }

    public get isUDUpgrade(): boolean {
      return !this.raw.IsNodeByNode;
    }

    public get nodesInProgress() {
      if (this.isUDUpgrade) {
        return this.raw.CurrentUpgradeDomainProgress;
      }else{
        return this.raw.CurrentUpgradeUnitsProgress;
      }
    }

    public get isAtHealthCheckPhase() {
      return Utils.isDefined(this.raw.HealthCheckPhase) &&
             this.raw?.HealthCheckPhase !== "Invalid";
    }

    protected updateInternal(): Observable<any> | void {
                                                                                                // set depth to 0 and parent ref to null
        this.unhealthyEvaluations = HealthUtils.getParsedHealthEvaluations(this.raw.UnhealthyEvaluations, 0, null, this.data);

        const upgradeUnits = this.isUDUpgrade ? this.raw.UpgradeDomains : this.raw.UpgradeUnits;

        const domains = upgradeUnits.map(ud => new UpgradeDomain(this.data, ud, !this.isUDUpgrade));
        const groupedDomains = domains.filter(ud => ud.stateName === UpgradeDomainStateNames.Completed)
            .concat(domains.filter(ud => ud.stateName === UpgradeDomainStateNames.InProgress))
            .concat(domains.filter(ud => ud.name === this.raw.NextUpgradeDomain))
            .concat(domains.filter(ud => ud.stateName === UpgradeDomainStateNames.Pending && ud.name !== this.raw.NextUpgradeDomain))
            .concat(domains.filter(ud => ud.stateName === UpgradeDomainStateNames.Failed));

        this.upgradeDomains = groupedDomains;

        if (this.raw.UpgradeDescription) {
            this.upgradeDescription = new UpgradeDescription(this.data, this.raw.UpgradeDescription);
        }
    }
}
export class ApplicationBackupConfigurationInfo extends DataModelBase<IRawApplicationBackupConfigurationInfo> {
    public decorators: IDecorators = {
        hideList: [
            'action.Name',
        ]
    };

    public action: IsolatedAction;
    public constructor(data: DataService, raw: IRawApplicationBackupConfigurationInfo, public parent: Application) {
        super(data, raw, parent);
        this.action = new IsolatedAction(
            data.dialog,
            'deleteBackupPolicy',
            'Delete Backup Policy',
            'Deleting',
            {
                backup: raw,
                delete: () => data.restClient.deleteBackupPolicy(this.raw.PolicyName)
            },
            ViewBackupComponent,
            () => true,
            () => this.data.restClient.getBackupPolicy(this.raw.PolicyName).pipe(map(resp => {
                this.action.data.backup = resp;
            }))
            );
    }

    public get uniqueId(): string {
        return this.raw.PolicyName + '-' + this.raw.Kind;
    }
}


