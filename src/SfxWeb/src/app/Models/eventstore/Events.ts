import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { DataModelBase } from '../DataModels/Base';
import { DataService } from 'src/app/services/data.service';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export interface IFabricEventMetadata {
    kind: string;
    eventInstanceId: string;
    timeStamp: string;
    hasCorrelatedEvents?: boolean;
}

export interface IEventPropertiesCollection {
    eventProperties: { [key: string]: any; };
}

export abstract class FabricEventBase implements IFabricEventMetadata, IEventPropertiesCollection {
    public hasCorrelatedEvents: boolean;
    public eventProperties: { [key: string]: any; } = {};
    public kind: string;
    public eventInstanceId: string;
    public timeStamp: string;
    public category: string;
    public raw: { [key: string]: any; } = {};
    public get timeStampString() {  return TimeUtils.datetimeToString(this.timeStamp); }
    public time: Date;

    public fillFromJSON(responseItem: any) {
        this.raw = responseItem;
        for (const property in responseItem) {
            if (!this.extractField(property, responseItem[property])) {
                this.eventProperties[property] = responseItem[property];
            }
        }
    }

    protected extractField(name: string, value: any): boolean {
        switch (name) {
            case 'Kind':
                this.kind = value;
                return true;
            case 'Category':
                this.category = value;
                return true;
            case 'EventInstanceId':
                this.eventInstanceId = value;
                return true;
            case 'TimeStamp':
                this.timeStamp = value;
                this.time = new Date(this.timeStamp)
                return true;
            case 'HasCorrelatedEvents':
                this.hasCorrelatedEvents = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class FabricEventInstanceModel<T extends FabricEventBase> extends DataModelBase<T> {
    // Initially keep additional details collapsed.
    public isSecondRowCollapsed = true;
    public constructor(data: DataService, raw: T) {
        super(data, raw);
        this.eventInstanceId = this.raw.eventInstanceId;
    }

    // A temp solution till we have instanceId unique.
    public get uniqueId() { return this.raw.kind + this.raw.eventInstanceId + this.raw.timeStamp; }
    public get id() { return this.raw.eventInstanceId; }
    public get name() { return `${this.raw.kind} (${this.raw.eventInstanceId})`; }
    public eventInstanceId: string;
}

export class FabricEvent extends FabricEventBase {
}

export class ClusterEvent extends FabricEventBase {
}

export class NodeEvent extends FabricEventBase {
    public nodeName: string;

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'NodeName':
                this.nodeName = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class ApplicationEvent extends FabricEventBase {
    public applicationId: string;

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'ApplicationId':
                this.applicationId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class ServiceEvent extends FabricEventBase {
    public serviceId: string;

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'ServiceId':
                this.serviceId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class PartitionEvent extends FabricEventBase {
    public partitionId: string;

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'PartitionId':
                this.partitionId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class ReplicaEvent extends FabricEventBase {
    public partitionId: string;
    public replicaId: string;

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'PartitionId':
                this.partitionId = value;
                return true;
            case 'ReplicaId':
                this.replicaId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class EventsResponseAdapter<T extends FabricEventBase> {
    public constructor(private eventType: new () => T) {
    }

    public getEvents(responseItems: any[]): T[]  {
        return responseItems.map(item => {
            const eventObj = new this.eventType();
            eventObj.fillFromJSON(item);
            return eventObj;
        });
    }
}

