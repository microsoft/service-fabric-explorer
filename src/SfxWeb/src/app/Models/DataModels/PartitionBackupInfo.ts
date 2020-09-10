import { PartitionBackupCollection, SinglePartitionBackupCollection } from './collections/Collections';
import { IRawStorage, IRawPartitionBackupConfigurationInfo, IRawBackupProgressInfo, IRawRestoreProgressInfo, IRawPartitionBackup } from '../RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { Partition } from './Partition';
import { DataModelBase, IDecorators } from './Base';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { IsolatedAction } from '../Action';
import { ViewBackupComponent } from 'src/app/modules/backup-restore/view-backup/view-backup.component';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class PartitionBackupInfo {
    public partitionBackupConfigurationInfo: PartitionBackupConfigurationInfo;
    public partitionBackupList: PartitionBackupCollection;
    public latestPartitionBackup: SinglePartitionBackupCollection;
    public backupPolicyName: string;
    public cleanBackup: boolean;
    public storage: IRawStorage;
    public backupId: string;
    public backupLocation: string;
    public partitionBackupProgress: PartitionBackupProgress;
    public partitionRestoreProgress: PartitionRestoreProgress;
    public BackupTimeout: number;
    public RestoreTimeout: number;

    public constructor(data: DataService, public parent: Partition) {

        this.partitionBackupConfigurationInfo = new PartitionBackupConfigurationInfo(data, this);
        this.partitionBackupProgress = new PartitionBackupProgress(data, this);
        this.partitionRestoreProgress = new PartitionRestoreProgress(data, this);
        this.partitionBackupList = new PartitionBackupCollection(data, this);
        this.latestPartitionBackup = new SinglePartitionBackupCollection(data, this);
        this.cleanBackup = false;
    }
}

export class PartitionBackupConfigurationInfo extends DataModelBase<IRawPartitionBackupConfigurationInfo> {
    public decorators: IDecorators = {
        hideList: [
            'ServiceName',
            'PartitionId'
        ]
    };

    public constructor(data: DataService, public parent: PartitionBackupInfo) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawPartitionBackupConfigurationInfo> {
        return this.data.restClient.getPartitionBackupConfigurationInfo(this.parent.parent.id, messageHandler);
    }
}

export class PartitionBackupProgress extends DataModelBase<IRawBackupProgressInfo> {

    public constructor(data: DataService, public parent: PartitionBackupInfo) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawBackupProgressInfo> {
        return this.data.restClient.getPartitionBackupProgress(this.parent.parent.id, messageHandler);
    }
}

export class PartitionRestoreProgress extends DataModelBase<IRawRestoreProgressInfo> {

    public constructor(data: DataService, public parent: PartitionBackupInfo) {
        super(data, null, parent);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawRestoreProgressInfo> {
        return this.data.restClient.getPartitionRestoreProgress(this.parent.parent.id, messageHandler);
    }
}

export class PartitionBackup extends DataModelBase<IRawPartitionBackup> {
    public decorators: IDecorators = {
        hideList: [
            'ApplicationName',
            'ServiceName',
            'PartitionInformation',
        ]
    };
    public action: IsolatedAction;
    public constructor(data: DataService, raw: IRawPartitionBackup, public parent: PartitionBackupInfo) {
        super(data, raw, parent);
        if (raw) {
            this.action = new IsolatedAction(
                data.dialog,
                raw.BackupId,
                raw.BackupId,
                raw.BackupId,
                {},
                ViewBackupComponent,
                () => true
            );
        } else {
            this.action = null;
        }
    }

    public get uniqueId(): string {
        return this.raw.BackupId;
    }
}


