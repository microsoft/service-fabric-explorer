import { IRawPartition, IRawPartitionHealth, IRawPartitionInformation, IRawPartitionLoadInformation, IRawLoadMetricReport } from '../RawDataTypes';
import { DataModelBase, IDecorators } from './Base';
import { ReplicaOnPartitionCollection } from './collections/Collections';
import { DataService } from 'src/app/services/data.service';
import { Service } from './Service';
import { HealthStateFilterFlags } from '../HealthChunkRawDataTypes';
import { ServiceKindRegexes, Constants, ServicePartitionKindRegexes } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { HealthBase } from './HealthEvent';
import { PartitionBackupInfo } from './PartitionBackupInfo';
import { Observable } from 'rxjs';
import { ActionWithConfirmationDialog, ActionWithDialog, IsolatedAction } from '../Action';
import { mergeMap } from 'rxjs/operators';
import { PartitionEnableBackUpComponent } from 'src/app/modules/backup-restore/partition-enable-back-up/partition-enable-back-up.component';
import { PartitionDisableBackUpComponent } from 'src/app/modules/backup-restore/partition-disable-back-up/partition-disable-back-up.component';
import { PartitionTriggerBackUpComponent } from 'src/app/modules/backup-restore/partition-trigger-back-up/partition-trigger-back-up.component';
import { PartitionRestoreBackUpComponent } from 'src/app/modules/backup-restore/partition-restore-back-up/partition-restore-back-up.component';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class Partition extends DataModelBase<IRawPartition> {
    public partitionInformation: PartitionInformation;
    public replicas: ReplicaOnPartitionCollection;
    public loadInformation: PartitionLoadInformation;
    public health: PartitionHealth;
    public partitionBackupInfo: PartitionBackupInfo;

    public constructor(data: DataService, raw: IRawPartition, public parent: Service) {
        super(data, raw, parent);

        this.partitionInformation = new PartitionInformation(this.data, raw.PartitionInformation);
        this.replicas = new ReplicaOnPartitionCollection(this.data, this);
        this.loadInformation = new PartitionLoadInformation(this.data, this);
        this.health = new PartitionHealth(this.data, this, HealthStateFilterFlags.Default, HealthStateFilterFlags.None);
        this.partitionBackupInfo = new PartitionBackupInfo(this.data, this);

        if (this.data.actionsAdvancedEnabled()) {
            this.setAdvancedActions();
        }
    }

    public get isStatefulService(): boolean {
        return ServiceKindRegexes.Stateful.test(this.raw.ServiceKind);
    }

    public get isStatelessService(): boolean {
        return ServiceKindRegexes.Stateless.test(this.raw.ServiceKind);
    }

    public get id(): string {
        return this.partitionInformation.id;
    }

    public get name(): string {
        return this.raw.PartitionInformation.Name || this.raw.PartitionInformation.Id;
    }

    public get viewPath(): string {
        return this.data.routes.getPartitionViewPath(this.parent.parent.raw.TypeName, this.parent.parent.id, this.parent.id, this.id);
    }

    public get IsStatefulServiceAndSystemService(): Boolean {
        return this.isStatefulService && this.parent.parent.raw.TypeName !== "System";
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawPartition> {
        return this.data.restClient.getPartition(this.parent.parent.id, this.parent.id, this.id, messageHandler);
    }

    public removeAdvancedActions(): void {
        this.actions.collection = this.actions.collection.filter(action => ["enablePartitionBackup", "disablePartitionBackup", "suspendPartitionBackup", "resumePartitionBackup", "triggerPartitionBackup", "restorePartitionBackup"].indexOf(action.name) === -1);
    }

    public setAdvancedActions(): void {
        if (this.isStatelessService || this.parent.parent.raw.TypeName === Constants.SystemAppTypeName) {
            return;
        }

        this.actions.add(new IsolatedAction(
            this.data.dialog,
            "enablePartitionBackup",
            "Enable/Update Partition Backup",
            "Enabling Partition Backup",
            {},
            PartitionEnableBackUpComponent,
            () => true
            // () => this.data.restClient.enablePartitionBackup(this).subscribe(() => {
            //     this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
            // }),
            // () => true,
            // <angular.ui.bootstrap.IModalSettings>{
            //     templateUrl: "partials/enableBackup.html",
            //     controller: ActionController,
            //     resolve: {
            //         action: () => this
            //     }
            // },
            // null
        ));

        this.actions.add(new IsolatedAction(
            this.data.dialog,
            "disablePartitionBackup",
            "Disable Partition Backup",
            "Disabling Partition Backup",
            {},
            PartitionDisableBackUpComponent,
            () => true
            // () => this.data.restClient.disablePartitionBackup(this).subscribe(() => {
            //     this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
            // }),
            // () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition",
            // <angular.ui.bootstrap.IModalSettings>{
            //     templateUrl: "partials/disableBackup.html",
            //     controller: ActionController,
            //     resolve: {
            //         action: () => this
            //     }
            // },
            // null
        ));

        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            "suspendPartitionBackup",
            "Suspend Partition Backup",
            "Suspending...",
            () => this.data.restClient.suspendPartitionBackup(this.id).pipe(mergeMap(() => {
                return this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
            })),
            () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === false,
            "Confirm Partition Backup Suspension",
            `Suspend partition backup for ${this.name} ?`,
            this.name));

        this.actions.add(new ActionWithConfirmationDialog(
            this.data.dialog,
            "resumePartitionBackup",
            "Resume Partition Backup",
            "Resuming...",
            () => this.data.restClient.resumePartitionBackup(this.id).pipe(mergeMap(() => {
                return this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
            })),
            () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === true,
            "Confirm Partition Backup Resumption",
            `Resume partition backup for ${this.name} ?`,
            this.name));

        this.actions.add(new IsolatedAction(
            this.data.dialog,
            "triggerPartitionBackup",
            "Trigger Partition Backup",
            "Triggering Partition Backup",
            {},
            PartitionTriggerBackUpComponent,
            () => true
            // () => this.data.restClient.triggerPartitionBackup(this),
            // () => true,
            // <angular.ui.bootstrap.IModalSettings>{
            //     templateUrl: "partials/triggerPartitionBackup.html",
            //     controller: ActionController,
            //     resolve: {
            //         action: () => this
            //     }
            // },
            // null
        ));

        this.actions.add(new IsolatedAction(
            this.data.dialog,
            "restorePartitionBackup",
            "Restore Partition Backup",
            "Restoring Partition Backup",
            {},
            PartitionRestoreBackUpComponent,
            () => true
            // () => this.data.restClient.restorePartitionBackup(this),
            // () => true,
            // <angular.ui.bootstrap.IModalSettings>{
            //     templateUrl: "partials/restorePartitionBackup.html",
            //     controller: ActionController,
            //     resolve: {
            //         action: () => this
            //     }
            // },
            // null
        ));
    }
}

export class PartitionHealth extends HealthBase<IRawPartitionHealth> {
    public constructor(data: DataService, public parent: Partition,
        protected eventsHealthStateFilter: HealthStateFilterFlags,
        protected replicasHealthStateFilter: HealthStateFilterFlags) {
        super(data, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawPartitionHealth> {
        return this.data.restClient.getPartitionHealth(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id,
            this.eventsHealthStateFilter, this.replicasHealthStateFilter, messageHandler);
    }
}

export class PartitionInformation extends DataModelBase<IRawPartitionInformation> {
    public constructor(data: DataService, raw: IRawPartitionInformation) {
        super(data, raw);
    }

    public get isPartitionKindInt64Range(): boolean {
        return ServicePartitionKindRegexes.Int64Range.test(this.raw.ServicePartitionKind);
    }

    public get isPartitionKindNamed(): boolean {
        return ServicePartitionKindRegexes.Named.test(this.raw.ServicePartitionKind);
    }
}

export class PartitionLoadInformation extends DataModelBase<IRawPartitionLoadInformation> {
    public decorators: IDecorators = {
        hideList: ["PartitionId"]
    };

    public primaryLoadMetricReports: LoadMetricReport[] = [];
    public secondaryLoadMetricReports: LoadMetricReport[] = [];

    public constructor(data: DataService, public parent: Partition) {
        super(data, null, parent);
    }

    public get isValid(): boolean {
        return this.isInitialized && (this.primaryLoadMetricReports.length > 0 || this.secondaryLoadMetricReports.length > 0);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawPartitionLoadInformation> {
        return this.data.restClient.getPartitionLoadInformation(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, messageHandler);
    }

    protected updateInternal(): Observable<any> | void {
        this.primaryLoadMetricReports = this.raw.PrimaryLoadMetricReports.map(report => new LoadMetricReport(this.data, report));
        this.secondaryLoadMetricReports = this.raw.SecondaryLoadMetricReports.map(report => new LoadMetricReport(this.data, report));
    }
}

export class LoadMetricReport extends DataModelBase<IRawLoadMetricReport> {
    public constructor(data: DataService, raw: IRawLoadMetricReport) {
        super(data, raw);
    }

    public get lastReportedUtc(): string {
        return TimeUtils.timestampToUTCString(this.raw.LastReportedUtc);
    }
}
