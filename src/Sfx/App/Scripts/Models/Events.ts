//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IFabricEventMetadata {
        kind: string;
        eventInstanceId: string;
        timeStamp: string;
        hasCorrelatedEvents?: boolean;
    }

    export class EventProperty {
        readonly name: string;
        readonly value: any;

        public constructor(name: string, value: any) {
            this.name = name;
            this.value = value;
        }
    }

    export interface IEventPropertiesCollection {
        eventProperties: EventProperty[];
    }

    export abstract class FabricEventBase implements IFabricEventMetadata, IEventPropertiesCollection {
        private _kind: string;
        private _eventInstanceId: string;
        private _timeStamp: string;
        private _hasCorrelatedEvents?: boolean;
        private _eventProperties: EventProperty[] = [];

        public get kind() { return this._kind; }
        public get eventInstanceId() { return this._eventInstanceId; }
        public get timeStamp() { return this._timeStamp; }
        public get hasCorrelatedEvents() { return this._hasCorrelatedEvents; }
        public get eventProperties() { return this._eventProperties; }

        public fillFromJSON(responseItem: any) {
            for (const property in responseItem) {
                if (!this.extractField(property, responseItem[property])) {
                    this.eventProperties.push(
                        new EventProperty(
                            property,
                            responseItem[property]));
                }
            }
        }

        protected extractField(name: string, value: any): boolean {
            if (name === "Kind") {
                this._kind = value;
                return true;
            } else if (name === "EventInstanceId") {
                this._eventInstanceId = value;
                return true;
            } else if (name === "TimeStamp") {
                this._timeStamp = value;
                return true;
            } else if (name === "HasCorrelatedEvents") {
                this._hasCorrelatedEvents = value;
                return true;
            }
            return false;
        }
    }

    export class FabricEventInstanceModel<T extends FabricEventBase> extends DataModelBase<T> {
        public constructor(data: DataService, raw: T) {
            super(data, raw);
        }

        public get uniqueId() { return this.raw.eventInstanceId; }
        public get id() { return this.raw.eventInstanceId; }
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

            if (name === "NodeName") {
                this._nodeName = value;
                return true;
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

            if (name === "ApplicationId") {
                this._applicationId = value;
                return true;
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

            if (name === "ServiceId") {
                this._serviceId = value;
                return true;
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

            if (name === "PartitionId") {
                this._partitionId = value;
                return true;
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

            if (name === "PartitionId") {
                this._partitionId = value;
                return true;
            } else if (name === "ReplicaId") {
                this._replicaId = value;
                return true;
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

}
