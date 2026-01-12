// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

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
import { RoutesService } from 'src/app/services/routes.service';

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
    }

    public get isStatefulService(): boolean {
        return ServiceKindRegexes.Stateful.test(this.raw.ServiceKind);
    }

    public get isStatelessService(): boolean {
        return ServiceKindRegexes.Stateless.test(this.raw.ServiceKind);
    }

    public get isSelfReconfiguringService(): boolean {
        return ServiceKindRegexes.SelfReconfiguring.test(this.raw.ServiceKind);
    }

    public get id(): string {
        return this.partitionInformation.id;
    }

    public get name(): string {
        return this.raw.PartitionInformation.Name || this.raw.PartitionInformation.Id;
    }

    public get viewPath(): string {
        return RoutesService.getPartitionViewPath(this.parent.parent.raw.TypeName, this.parent.parent.id, this.parent.id, this.id);
    }

    public get IsStatefulServiceAndSystemService(): boolean {
        return this.isStatefulService && this.parent.parent.raw.TypeName !== 'System';
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<IRawPartition> {
        return this.data.restClient.getPartition(this.parent.parent.id, this.parent.id, this.id, messageHandler);
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
        hideList: ['PartitionId']
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
