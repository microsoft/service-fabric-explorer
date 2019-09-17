//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

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

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartition> {
            return Utils.getHttpResponseData(this.data.restClient.getPartition(this.parent.parent.id, this.parent.id, this.id, messageHandler));
        }

        public removeAdvancedActions(): void {
            this.actions.collection = this.actions.collection.filter(action => ["enablePartitionBackup", "disablePartitionBackup", "suspendPartitionBackup", "resumePartitionBackup", "triggerPartitionBackup", "restorePartitionBackup"].indexOf(action.name) === -1);
        }

        public setAdvancedActions(): void {
            if (this.isStatelessService || this.parent.parent.raw.TypeName === Constants.SystemAppTypeName) {
                return;
            }

            this.actions.add(new ActionWithDialog(
                this.data.$uibModal,
                this.data.$q,
                "enablePartitionBackup",
                "Enable/Update Partition Backup",
                "Enabling Partition Backup",
                () => this.data.restClient.enablePartitionBackup(this).then(() => {
                    this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
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
                "disablePartitionBackup",
                "Disable Partition Backup",
                "Disabling Partition Backup",
                () => this.data.restClient.disablePartitionBackup(this).then(() => {
                    this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
                }),
                () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition",
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
                "suspendPartitionBackup",
                "Suspend Partition Backup",
                "Suspending...",
                () => this.data.restClient.suspendPartitionBackup(this.id).then(() => {
                    this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
                }),
                () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === false,
                "Confirm Partition Backup Suspension",
                `Suspend partition backup for ${this.name} ?`,
                this.name));

            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "resumePartitionBackup",
                "Resume Partition Backup",
                "Resuming...",
                () => this.data.restClient.resumePartitionBackup(this.id).then(() => {
                    this.partitionBackupInfo.partitionBackupConfigurationInfo.refresh();
                }),
                () => this.partitionBackupInfo.partitionBackupConfigurationInfo.raw && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.Kind === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.PolicyInheritedFrom === "Partition" && this.partitionBackupInfo.partitionBackupConfigurationInfo.raw.SuspensionInfo.IsSuspended === true,
                "Confirm Partition Backup Resumption",
                `Resume partition backup for ${this.name} ?`,
                this.name));

            this.actions.add(new ActionWithDialog(
                this.data.$uibModal,
                this.data.$q,
                "triggerPartitionBackup",
                "Trigger Partition Backup",
                "Triggering Partition Backup",
                () => this.data.restClient.triggerPartitionBackup(this),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/triggerPartitionBackup.html",
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
                "restorePartitionBackup",
                "Restore Partition Backup",
                "Restoring Partition Backup",
                () => this.data.restClient.restorePartitionBackup(this),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/restorePartitionBackup.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this
                    }
                },
                null
            ));
        }
    }

    export class PartitionHealth extends HealthBase<IRawPartitionHealth> {
        public constructor(data: DataService, public parent: Partition,
            protected eventsHealthStateFilter: HealthStateFilterFlags,
            protected replicasHealthStateFilter: HealthStateFilterFlags) {
            super(data, parent);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionHealth> {
            return Utils.getHttpResponseData(this.data.restClient.getPartitionHealth(this.parent.parent.parent.id, this.parent.parent.id, this.parent.id,
                this.eventsHealthStateFilter, this.replicasHealthStateFilter, messageHandler));
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

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawPartitionLoadInformation> {
            return Utils.getHttpResponseData(this.data.restClient.getPartitionLoadInformation(
                this.parent.parent.parent.id, this.parent.parent.id, this.parent.id, messageHandler));
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.primaryLoadMetricReports = _.map(this.raw.PrimaryLoadMetricReports, report => new LoadMetricReport(this.data, report));
            this.secondaryLoadMetricReports = _.map(this.raw.SecondaryLoadMetricReports, report => new LoadMetricReport(this.data, report));
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
}

