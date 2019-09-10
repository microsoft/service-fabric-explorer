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

        public get kind() { return this._kind; }
        public get category() { return this._category; }
        public get eventInstanceId() { return this._eventInstanceId; }
        public get timeStamp() { return this._timeStamp; }
        public get timeStampString() { return TimeUtils.datetimeToString(this._timeStamp); }
        public get hasCorrelatedEvents() { return this._hasCorrelatedEvents; }
        public get eventProperties() { return this._eventProperties; }

        public fillFromJSON(responseItem: any) {
            for (const property in responseItem) {
                if (!this.extractField(property, responseItem[property])) {
                    this.eventProperties[property] = responseItem[property];
                }
            }
        }

        protected extractField(name: string, value: any): boolean {
            switch (name) {
                case "Kind":
                    this._kind = value;
                    return true;
                case "Category":
                    this._category = value;
                    return true;
                case "EventInstanceId":
                    this._eventInstanceId = value;
                    return true;
                case "TimeStamp":
                    this._timeStamp = value;
                    return true;
                case "HasCorrelatedEvents":
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
        public isSecondRowCollapsed: boolean = true;
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
                case "NodeName":
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
                case "ApplicationId":
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
                case "ServiceId":
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
                case "PartitionId":
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
                case "PartitionId":
                    this._partitionId = value;
                    return true;
                case "ReplicaId":
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

    export interface ITimelineData {
        groups: vis.DataSet<vis.DataGroup>;
        items: vis.DataSet<vis.DataItem>;
        start?: Date;
        end?: Date;
    }

    export interface ITimelineDataGenerator<T extends FabricEventBase>{

        consume(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData;
    }

    let tooltipFormat = (event: FabricEventBase, start: string, end: string = "", title: string= ""): string => {

        const rows = Object.keys(event.eventProperties).map(key => `<tr><td style="word-break: keep-all;">${key}</td><td> : ${event.eventProperties[key]}</td></tr>`).join("");

        const outline = `<table style="word-break: break-all;"><tbody>${rows}</tbody></table>`;

        return `<div class="tooltip-test">${title.length > 0 ? title + "<br>" : ""}Start: ${start} <br>${ end ? "End: " + end + "<br>" : ""}<b style="text-align: center;">Details</b><br>${outline}</div>`;
    };

    export class NodeTimelineGenerator implements ITimelineDataGenerator<NodeEvent> {
        static readonly NodesDownLabel = "Node Down";

        consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
            let items = new vis.DataSet<vis.DataItem>();

            let previousTransitions: Record<string, NodeEvent> = {};

            events.forEach( event => {
                if (event.category === "StateTransition") {
                    //check for current state
                    if (event.kind === "NodeDown") {
                        const end = previousTransitions[event.nodeName]? previousTransitions[event.nodeName].timeStamp : endOfRange.toISOString();
                        const start = event.timeStamp;
                        const label = "Node " + event.nodeName + " down";
                        items.add({
                            id: event.eventInstanceId + label,
                            content: label,
                            start: start,
                            end: end,
                            group: NodeTimelineGenerator.NodesDownLabel,
                            type: "range",
                            title: tooltipFormat(event, start, end, label),
                            className: "red"
                        });
                    }

                    if(event.kind === "NodeUp") {
                        previousTransitions[event.nodeName] = event;
                    }
                };
            });

            let groups = new vis.DataSet<vis.DataGroup>([
                {id: NodeTimelineGenerator.NodesDownLabel, content: NodeTimelineGenerator.NodesDownLabel},
            ]);

            return {
                groups,
                items
            };
        }

    }


    export class ClusterTimelineGenerator implements ITimelineDataGenerator<ClusterEvent> {
        static readonly upgradeDomainLabel = "Upgrade Domains";
        static readonly clusterUpgradeLabel = "Cluster Upgrades";
        static readonly seedNodeStatus = "Seed Node Warnings";

        consume(events: ClusterEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
            let items = new vis.DataSet<vis.DataItem>();

            //state necessary for some events
            let previousClusterHealthReport: ClusterEvent;
            let previousClusterUpgrade: ClusterEvent;
            let upgradeClusterStarted: ClusterEvent;
            let clusterRollBacks: Record<string, {complete: ClusterEvent, start?: ClusterEvent}> = {};

            events.forEach( event => {
                //we want the oldest cluster upgrade started before finding any previousClusterUpgrade
                //this means we should have an ongoing cluster upgrade
                if ( (event.kind === "ClusterUpgradeStarted" || event.kind === "ClusterUpgradeRollbackStarted") && !previousClusterUpgrade ) {
                    upgradeClusterStarted = event;
                }else if (event.kind === "ClusterUpgradeDomainCompleted") {
                    this.parseClusterUpgradeDomain(event, items);
                }else if (event.kind === "ClusterUpgradeCompleted") {
                    this.parseClusterUpgradeCompleted(event, items);
                    previousClusterUpgrade = event;
                }else if (event.kind === "ClusterNewHealthReport") {
                    this.parseSeedNodeStatus(event, items, previousClusterHealthReport, endOfRange);
                    previousClusterHealthReport = event;
                }

                //handle roll backs alone
                if(event.kind === "ClusterUpgradeRollbackCompleted"){
                    previousClusterUpgrade = event;
                    clusterRollBacks[event.eventInstanceId] = {complete: event};
                }else if(event.kind === "ClusterUpgradeRollbackStarted" && event.eventInstanceId in clusterRollBacks){
                    clusterRollBacks[event.eventInstanceId]["start"] = event;
                }
            });

            //we have to parse cluster upgrade roll backs into 2 seperate events and require 2 seperate events to piece together
            //we gather them up and add them at the end so we can get corresponding events
            Object.keys(clusterRollBacks).forEach(eventInstanceId => {
                const data = clusterRollBacks[eventInstanceId];
                this.parseClusterUpgradeAndRollback(data.complete, data.start, items, startOfRange);
            })

            //Display a pending upgrade
            if(upgradeClusterStarted) {
                this.parseClusterUpgradeStarted(upgradeClusterStarted, items, endOfRange);
            }

            let groups = new vis.DataSet<vis.DataGroup>([
                {id: ClusterTimelineGenerator.upgradeDomainLabel, content: ClusterTimelineGenerator.upgradeDomainLabel},
                {id: ClusterTimelineGenerator.clusterUpgradeLabel, content: ClusterTimelineGenerator.clusterUpgradeLabel},
                {id: ClusterTimelineGenerator.seedNodeStatus, content: ClusterTimelineGenerator.seedNodeStatus}
            ]);

            console.log(items);

            return {
                groups,
                items
            };
        }

        parseClusterUpgradeAndRollback(rollbackCompleteEvent: ClusterEvent, rollbackStartedEvent: ClusterEvent, items: vis.DataSet<vis.DataItem>, startOfRange: Date){
            const rollbackEnd = rollbackCompleteEvent.timeStamp;

            let rollbackStarted = startOfRange.toISOString();
            //wont always get this event
            if(rollbackStartedEvent){
                rollbackStarted = rollbackStartedEvent.timeStamp;
                const rollbackStartedDate = new Date(rollbackEnd);
                const upgradeDuration = rollbackCompleteEvent.eventProperties["OverallUpgradeElapsedTimeInMs"];
    
                const upgradeStart = new Date(rollbackStartedDate.getTime() - upgradeDuration).toISOString();
                //roll forward
                items.add({
                    id: rollbackCompleteEvent.eventInstanceId + "upgrade",
                    content: "upgrade rolling forward failed",
                    start: upgradeStart,
                    end: rollbackStarted,
                    group: ClusterTimelineGenerator.clusterUpgradeLabel,
                    type: "range",
                    className: "red"
                });
            }

            const label = `rolling back to ${rollbackCompleteEvent.eventProperties["TargetClusterVersion"]}`;

            //roll back
            items.add({
                id: rollbackCompleteEvent.eventInstanceId + label,
                content: label,
                start: rollbackStarted,
                end: rollbackEnd,
                group: ClusterTimelineGenerator.clusterUpgradeLabel,
                type: "range",
                title: tooltipFormat(rollbackCompleteEvent, rollbackStarted, rollbackEnd),
                className: "orange"
            });

        }

        parseClusterUpgradeDomain(event: ClusterEvent, items: vis.DataSet<vis.DataItem>): void {
            const end = event.timeStamp;
            const endDate = new Date(end);
            const duration = event.eventProperties["UpgradeDomainElapsedTimeInMs"];

            const start = new Date(endDate.getTime() - duration).toISOString();
            const label = event.eventProperties["UpgradeDomains"];
            items.add({
                id: event.eventInstanceId + label + event.eventProperties["TargetClusterVersion"],
                content: label,
                start: start,
                end: end,
                group: ClusterTimelineGenerator.upgradeDomainLabel,
                type: "range",
                title: tooltipFormat(event, start, end),
                className: "green"
            });
        }

        //Mainly used for if there is a current upgrade in progress.
        parseClusterUpgradeStarted(event: ClusterEvent, items: vis.DataSet<vis.DataItem>, endOfRange: Date): void {

            let end = endOfRange.toISOString();
            const start = event.timeStamp;
            const content = `Upgrading to ${event.eventProperties["TargetClusterVersion"]}`;

            items.add({
                id: event.eventInstanceId + content,
                content,
                start,
                end,
                group: ClusterTimelineGenerator.clusterUpgradeLabel,
                type: "range",
                title: tooltipFormat(event, start, end),
                className: "blue"
            });
        }

        parseClusterUpgradeCompleted(event: ClusterEvent, items: vis.DataSet<vis.DataItem>): void {
            const rollBack = event.kind === "ClusterUpgradeRollbackCompleted";

            const end = event.timeStamp;
            const endDate = new Date(end);
            const duration = event.eventProperties["OverallUpgradeElapsedTimeInMs"];

            const start = new Date(endDate.getTime() - duration).toISOString();
            const content = `${rollBack ? "upgrade Rolling back" : "Upgrade rolling forward"} to ${event.eventProperties["TargetClusterVersion"]}`;

            items.add({
                id: event.eventInstanceId + content,
                content,
                start,
                end,
                group: ClusterTimelineGenerator.clusterUpgradeLabel,
                type: "range",
                title: tooltipFormat(event, start, end),
                className: rollBack  ? "orange" : "green"
            }); 
        }

        parseSeedNodeStatus(event: ClusterEvent, items: vis.DataSet<vis.DataItem>, previousClusterHealthReport: ClusterEvent, endOfRange: Date): void {
            if (event.eventProperties["HealthState"] === "Warning") {
                //for end date if we dont have a previously seen health report(list iterates newest to oldest) then we know its still the ongoing state
                let end = previousClusterHealthReport ? previousClusterHealthReport.timeStamp : endOfRange.toISOString();
                const content = `${event.eventProperties["HealthState"]}`;

                items.add({
                    id: event.eventInstanceId + content,
                    content,
                    start: event.timeStamp,
                    end: end,
                    group: ClusterTimelineGenerator.seedNodeStatus,
                    type: "range",
                    title: tooltipFormat(event, event.timeStamp, end),
                    className: "orange"
                });
            }
        }
    }



    export class PartitionTimelineGenerator implements ITimelineDataGenerator<NodeEvent> {
        static readonly swapPrimaryLabel = "Primay Swap";
        static readonly swapPrimaryDurations = "Swap Primary phases";

        consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
            let items = new vis.DataSet<vis.DataItem>();

            events.forEach( event => {
                if (event.category === "StateTransition" && event.eventProperties["ReconfigType"] === "SwapPrimary") {
                    const end = event.timeStamp;
                    const endDate = new Date(end);
                    const duration = event.eventProperties["TotalDurationMs"];
                    const start = new Date(endDate.getTime() - duration).toISOString();
                    const label = event.eventProperties["NodeName"];

                    items.add({
                        id: event.eventInstanceId + label,
                        content: label,
                        start: start,
                        end: end,
                        group: PartitionTimelineGenerator.swapPrimaryLabel,
                        type: "range",
                        title: tooltipFormat(event, start, end, "Primary swap to " + label),
                        className: "green"
                    });

                };
            });

            let groups = new vis.DataSet<vis.DataGroup>([
                {id: PartitionTimelineGenerator.swapPrimaryLabel, content: PartitionTimelineGenerator.swapPrimaryLabel},
            ]);

            return {
                groups,
                items
            };        
        }

    }


    export class ApplicationTimelineGenerator implements ITimelineDataGenerator<ApplicationEvent> {
        static readonly swapPrimaryLabel = "Primay Swap";
        static readonly swapPrimaryDurations = "Swap Primary phases";

        consume(events: ApplicationEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
            let items = new vis.DataSet<vis.DataItem>();

            events.forEach( event => {
                if (event.category === "StateTransition" && event.eventProperties["ReconfigType"] === "SwapPrimary") {
                    const end = event.timeStamp;
                    const endDate = new Date(end);
                    const duration = event.eventProperties["TotalDurationMs"];
                    const start = new Date(endDate.getTime() - duration).toISOString();
                    const label = event.eventProperties["NodeName"];

                    items.add({
                        id: event.eventInstanceId + label,
                        content: label,
                        start: start,
                        end: end,
                        group: PartitionTimelineGenerator.swapPrimaryLabel,
                        type: "range",
                        title: tooltipFormat(event, start, end, "Primary swap to " + label),
                        className: "green"
                    })
                };
            });

            let groups = new vis.DataSet<vis.DataGroup>([
                {id: PartitionTimelineGenerator.swapPrimaryLabel, content: PartitionTimelineGenerator.swapPrimaryLabel},
            ]);

            return {
                groups,
                items
            };        
        }

    }


}
