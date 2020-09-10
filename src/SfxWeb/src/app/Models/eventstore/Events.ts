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
    private _kind: string;
    private _category?: string;
    private _eventInstanceId: string;
    private _timeStamp: string;
    private _hasCorrelatedEvents?: boolean;
    private _eventProperties: { [key: string]: any; } = {};

    public raw: { [key: string]: any; } = {};
    public get kind() { return this._kind; }
    public get category() { return this._category; }
    public get eventInstanceId() { return this._eventInstanceId; }
    public get timeStamp() { return this._timeStamp; }
    public get timeStampString() {  return TimeUtils.datetimeToString(this._timeStamp); }
    public get hasCorrelatedEvents() { return this._hasCorrelatedEvents; }
    public get eventProperties() { return this._eventProperties; }

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
                this._kind = value;
                return true;
            case 'Category':
                this._category = value;
                return true;
            case 'EventInstanceId':
                this._eventInstanceId = value;
                return true;
            case 'TimeStamp':
                this._timeStamp = value;
                return true;
            case 'HasCorrelatedEvents':
                this._hasCorrelatedEvents = value;
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
    }

    // A temp solution till we have instanceId unique.
    public get uniqueId() { return this.raw.kind + this.raw.eventInstanceId + this.raw.timeStamp; }
    public get id() { return this.raw.eventInstanceId; }
    public get name() { return `${this.raw.kind} (${this.raw.eventInstanceId})`; }
}

export class FabricEvent extends FabricEventBase {
}

export class ClusterEvent extends FabricEventBase {
}

export class NodeEvent extends FabricEventBase {
    private _nodeName: string;

    public get nodeName() { return this._nodeName; }

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'NodeName':
                this._nodeName = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class ApplicationEvent extends FabricEventBase {
    private _applicationId: string;

    public get applicationId() { return this._applicationId; }

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'ApplicationId':
                this._applicationId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class ServiceEvent extends FabricEventBase {
    private _serviceId: string;

    public get serviceId() { return this._serviceId; }

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'ServiceId':
                this._serviceId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class PartitionEvent extends FabricEventBase {
    private _partitionId: string;

    public get partitionId() { return this._partitionId; }

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'PartitionId':
                this._partitionId = value;
                return true;
            default:
                break;
        }

        return false;
    }
}

export class ReplicaEvent extends FabricEventBase {
    private _partitionId: string;
    private _replicaId: string;

    public get partitionId() { return this._partitionId; }
    public get replicaId() { return this._replicaId; }

    protected extractField(name: string, value: any): boolean {
        if (super.extractField(name, value)) {
            return true;
        }

        switch (name) {
            case 'PartitionId':
                this._partitionId = value;
                return true;
            case 'ReplicaId':
                this._replicaId = value;
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

