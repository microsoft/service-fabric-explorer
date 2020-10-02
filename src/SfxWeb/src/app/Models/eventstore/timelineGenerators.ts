

import { FabricEventBase, ClusterEvent, NodeEvent, ApplicationEvent, FabricEvent } from './Events';
import { DataGroup, DataItem, DataSet } from 'vis-timeline/standalone/esm';
import padStart from 'lodash/padStart';
import findIndex from 'lodash/findIndex';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';

/*
    NOTES:
    Reference for understanding the timeline rendering library https://visjs.github.io/vis-timeline/docs/timeline/
    high level concerns:
    Currently there are 2 "versions" of the timeline event generation.
    1. Applies some level of parsing event/multiple events to create one entry on the timeline.
       This is currently only used on significant items
    2. Generically applies all events to the timeline. Some level of customization is available to drive their
        appearance from information on the event. Currently by adding "Duration", "Status", "Description" properties.
        Ideally enough flexibility is applied to the generic handling to have all logic driven from there and no needing
        to update SFX except for updating to look for more fields.

        To handle the generic approach there is a distinction for what is allowed to "stack" on the graph.
        Point based events are intended to not be allowed to stack and only let range based events stack for visibility.
        The current approach for handling this is by adding 2 subgroupStack groups of "stack" and "noStack", where only stack
        allows for that group to not overlap. This solution works because we dont currently have any subgroups defined otherwise.
    */

export interface ITimelineData {
    groups: DataSet<DataGroup>;
    items: DataSet<DataItem>;
    start?: Date;
    end?: Date;
    potentiallyMissingEvents?: boolean;
}

export interface ITimelineDataGenerator<T extends FabricEventBase>{

    /*
    Take a list of events, assuming events are sorted most recent to oldest and creates and produces timeline formatted events.
    */
    consume(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData;
}

export class EventStoreUtils {

    private static internalToolTipFormatterObject = (data: any) => {
        const rows = Object.keys(data).map(key => EventStoreUtils.internalToolTipFormatter(key, data[key])).join('');
        return`<table style="word-break: break-all;"><tbody>${rows}</tbody></table>`;
    }

    private static internalToolTipFormatter = (key: string, data: any) => {
        let value = data;
        if (Array.isArray(data) ) {
            value = data.map(arrValue => EventStoreUtils.internalToolTipFormatter('', arrValue)).join('');
        }else if (typeof data === 'object') {
            value = EventStoreUtils.internalToolTipFormatterObject(data);
        }
        return`<tr style="padding: 0 5 px; bottom-border: 1px solid gray"><td style="word-break: keep-all;">${key}</td><td style="display:flex; flex-direction: row; "> <div style="margin-right: 4px">:</div> ${value}</td></tr>`;
    }

    /*
    Produces an html string used for vis.js timeline tooltips.
    */
    public static tooltipFormat = (data: Record<string, any> , start: string, end: string = '', title: string= ''): string => {

        const outline = EventStoreUtils.internalToolTipFormatterObject(data);

        // tslint:disable-next-line:max-line-length
        return `<div class="tooltip-test">${title.length > 0 ? title + '<br>' : ''}Start: ${start} <br>${ end ? 'End: ' + end + '<br>' : ''}<b style="text-align: center;">Details</b><br>${outline}</div>`;
    }

    public static parseUpgradeAndRollback(rollbackCompleteEvent: FabricEventBase, rollbackStartedEvent: ClusterEvent, items: DataSet<DataItem>,
                                          startOfRange: Date, group: string, targetVersionProperty: string) {
        const rollbackEnd = rollbackCompleteEvent.timeStamp;

        let rollbackStarted = startOfRange.toISOString();
        // wont always get this event because of the time range that can be selected where we only get the
        // rollback completed which leaves us missing some of the info.
        if (rollbackStartedEvent) {
            rollbackStarted = rollbackStartedEvent.timeStamp;
            const rollbackStartedDate = new Date(rollbackEnd);
            const upgradeDuration = rollbackCompleteEvent.eventProperties.OverallUpgradeElapsedTimeInMs;

            const upgradeStart = new Date(rollbackStartedDate.getTime() - upgradeDuration).toISOString();
            // roll forward
            items.add({
                id: rollbackCompleteEvent.eventInstanceId + 'upgrade',
                content: 'Upgrade rolling forward failed',
                start: upgradeStart,
                end: rollbackStarted,
                group,
                type: 'range',
                className: 'red'
            });
        }

        const label = `rolling back to ${rollbackCompleteEvent.eventProperties[targetVersionProperty]}`;

        // roll back
        items.add({
            id: rollbackCompleteEvent.eventInstanceId + label,
            content: label,
            start: rollbackStarted,
            end: rollbackEnd,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(rollbackCompleteEvent.eventProperties, rollbackStarted, rollbackEnd),
            className: 'orange'
        });

    }

    public static parseUpgradeDomain(event: FabricEventBase, items: DataSet<DataItem>, group: string, targetVersionProperty: string): void {
        const end = event.timeStamp;
        const endDate = new Date(end);
        const duration = event.eventProperties.UpgradeDomainElapsedTimeInMs;

        const start = new Date(endDate.getTime() - duration).toISOString();
        const label = event.eventProperties.UpgradeDomains;
        items.add({
            id: event.eventInstanceId + label + event.eventProperties[targetVersionProperty],
            content: label,
            start,
            end,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end),
            className: 'green'
        });
    }

    // Mainly used for if there is a current upgrade in progress.
    public static parseUpgradeStarted(event: FabricEventBase, items: DataSet<DataItem>, endOfRange: Date, group: string, targetVersionProperty: string): void {

        const end = endOfRange.toISOString();
        const start = event.timeStamp;
        const content = `Upgrading to ${event.eventProperties[targetVersionProperty]}`;

        items.add({
            id: event.eventInstanceId + content,
            content,
            start,
            end,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end),
            className: 'blue'
        });
    }

    public static parseUpgradeCompleted(event: FabricEventBase, items: DataSet<DataItem>, group: string, targetVersionProperty: string): void {
        const rollBack = event.kind === 'ClusterUpgradeRollbackCompleted';

        const end = event.timeStamp;
        const endDate = new Date(end);
        const duration = event.eventProperties.OverallUpgradeElapsedTimeInMs;

        const start = new Date(endDate.getTime() - duration).toISOString();
        const content = `${rollBack ? 'Upgrade Rolling back' : 'Upgrade rolling forward'} to ${event.eventProperties[targetVersionProperty]}`;

        items.add({
            id: event.eventInstanceId + content,
            content,
            start,
            end,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end),
            className: rollBack  ? 'orange' : 'green'
        });
    }

    /*
    add the subgroup stacking to every group so now we can always reliably place stacking/nonstacking items in any group.
    */
    public static addSubGroups(groups: DataSet<DataGroup>): void {
        groups.forEach(group => {
            group.subgroupStack = {stack: true, noStack: false };
            groups.update(group);
        });
    }
}

export abstract class TimeLineGeneratorBase<T extends FabricEventBase> {
    consume(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData {
         throw new Error('NotImplementedError');
    }

    generateTimeLineData(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData {
        const data = this.consume(events, startOfRange, endOfRange);
        EventStoreUtils.addSubGroups(data.groups);
        return data;
    }

}


export class ClusterTimelineGenerator extends TimeLineGeneratorBase<ClusterEvent> {
    static readonly upgradeDomainLabel = 'Upgrade Domains';
    static readonly clusterUpgradeLabel = 'Cluster Upgrades';
    static readonly seedNodeStatus = 'Seed Node Warnings';

    consume(events: ClusterEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
        const items = new DataSet<DataItem>();

        // state necessary for some events
        let previousClusterHealthReport: ClusterEvent;
        let previousClusterUpgrade: ClusterEvent;
        let upgradeClusterStarted: ClusterEvent;
        const clusterRollBacks: Record<string, {complete: ClusterEvent, start?: ClusterEvent}> = {};

        events.forEach( event => {
            // we want the oldest cluster upgrade started before finding any previousClusterUpgrade
            // this means we should have an ongoing cluster upgrade
            if ( (event.kind === 'ClusterUpgradeStarted' || event.kind === 'ClusterUpgradeRollbackStarted') && !previousClusterUpgrade ) {
                upgradeClusterStarted = event;
            }else if (event.kind === 'ClusterUpgradeDomainCompleted') {
                EventStoreUtils.parseUpgradeDomain(event, items, ClusterTimelineGenerator.upgradeDomainLabel, 'TargetClusterVersion');
            }else if (event.kind === 'ClusterUpgradeCompleted') {
                EventStoreUtils.parseUpgradeCompleted(event, items, ClusterTimelineGenerator.clusterUpgradeLabel, 'TargetClusterVersion');
                previousClusterUpgrade = event;
            }else if (event.kind === 'ClusterNewHealthReport') {
                this.parseSeedNodeStatus(event, items, previousClusterHealthReport, endOfRange);
                previousClusterHealthReport = event;
            }

            // handle roll backs alone
            if (event.kind === 'ClusterUpgradeRollbackCompleted') {
                previousClusterUpgrade = event;
                clusterRollBacks[event.eventInstanceId] = {complete: event};
            }else if (event.kind === 'ClusterUpgradeRollbackStarted' && event.eventInstanceId in clusterRollBacks) {
                clusterRollBacks[event.eventInstanceId].start = event;
            }
        });

        // we have to parse cluster upgrade roll backs into 2 seperate events and require 2 seperate events to piece together
        // we gather them up and add them at the end so we can get corresponding events
        Object.keys(clusterRollBacks).forEach(eventInstanceId => {
            const data = clusterRollBacks[eventInstanceId];
            // this.parseClusterUpgradeAndRollback(data.complete, data.start, items, startOfRange);
            EventStoreUtils.parseUpgradeAndRollback(data.complete, data.start, items, startOfRange,
                                                            ClusterTimelineGenerator.clusterUpgradeLabel, 'TargetClusterVersion');
        });

        // Display a pending upgrade
        if (upgradeClusterStarted) {
            EventStoreUtils.parseUpgradeStarted(upgradeClusterStarted, items, endOfRange, ClusterTimelineGenerator.clusterUpgradeLabel, 'TargetClusterVersion');
        }

        const groups = new DataSet<DataGroup>([
            {id: ClusterTimelineGenerator.upgradeDomainLabel, content: ClusterTimelineGenerator.upgradeDomainLabel},
            {id: ClusterTimelineGenerator.clusterUpgradeLabel, content: ClusterTimelineGenerator.clusterUpgradeLabel},
            {id: ClusterTimelineGenerator.seedNodeStatus, content: ClusterTimelineGenerator.seedNodeStatus}
        ]);

        return {
            groups,
            items
        };
    }

    parseSeedNodeStatus(event: ClusterEvent, items: DataSet<DataItem>, previousClusterHealthReport: ClusterEvent, endOfRange: Date): void {
        if (event.eventProperties.HealthState === 'Warning') {
            // for end date if we dont have a previously seen health report(list iterates newest to oldest) then we know its still the ongoing state
            const end = previousClusterHealthReport ? previousClusterHealthReport.timeStamp : endOfRange.toISOString();
            const content = `${event.eventProperties.HealthState}`;

            items.add({
                id: event.eventInstanceId + content,
                content,
                start: event.timeStamp,
                end,
                group: ClusterTimelineGenerator.seedNodeStatus,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp, end),
                className: 'orange'
            });
        }
    }
}
export class NodeTimelineGenerator extends TimeLineGeneratorBase<NodeEvent> {
    static readonly NodesDownLabel = 'Node Down';
    static readonly transitions = ['NodeDeactivateStarted'];

    consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
        const items = new DataSet<DataItem>();

        // keep track of node up events incase we have nodes where they started in a down state before the selected time
        // so that we know we need to chart a down node from the start of the timeline.
        const nodeUpEvents: Record<string, NodeEvent> = {};
        const previousTransitions: Record<string, NodeEvent> = {};
        let potentiallyMissingEvents = false;

        events.forEach( event => {
            if (event.category === 'StateTransition') {
                // check for current state
                if (event.kind === 'NodeDown') {
                    // we need to track for events that should not show up between node down and up events to know if data is missing
                    const previousTransition = previousTransitions[event.nodeName];
                    if (previousTransition && previousTransition.kind !== 'NodeUp') {
                        potentiallyMissingEvents = true;
                    }

                    // remove node up events if we find a node down event.
                    if (event.nodeName in nodeUpEvents) {
                        delete nodeUpEvents[event.nodeName];
                    }
                    const end = previousTransition ? previousTransition.timeStamp : endOfRange.toISOString();
                    const start = event.eventProperties.LastNodeUpAt;
                    const label = `Node ${event.nodeName} down`;
                    items.add({
                        id: event.eventInstanceId + label,
                        content: label,
                        start,
                        end,
                        group: NodeTimelineGenerator.NodesDownLabel,
                        type: 'range',
                        title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end, label),
                        className: 'red',
                        subgroup: 'stack'
                    });
                }

                if (event.kind === 'NodeUp') {
                    previousTransitions[event.nodeName] = event;
                    if (event.nodeName in nodeUpEvents) {
                        potentiallyMissingEvents = true;
                    }
                    nodeUpEvents[event.nodeName] = event;
                }
            }

            if (NodeTimelineGenerator.transitions.includes(event.kind) ) {
                previousTransitions[event.nodeName] = event;
            }
        });

        // add any left over node up events to the chart.
        Object.keys(nodeUpEvents).forEach(key => {
            const event = nodeUpEvents[key];
            const label = `Node ${event.nodeName} down`;
            items.add({
                id: event.eventInstanceId + label,
                content: label,
                start: event.eventProperties.LastNodeDownAt,
                end: event.timeStamp,
                group: NodeTimelineGenerator.NodesDownLabel,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(event.eventProperties, event.eventProperties.LastNodeDownAt, event.timeStamp, label),
                className: 'red',
                subgroup: 'stack'
            });
        });

        const groups = new DataSet<DataGroup>([
            {id: NodeTimelineGenerator.NodesDownLabel, content: NodeTimelineGenerator.NodesDownLabel, subgroupStack: {stack: true}},
        ]);

        return {
            groups,
            items,
            potentiallyMissingEvents
        };
    }
}

export class ApplicationTimelineGenerator extends TimeLineGeneratorBase<ApplicationEvent> {
    static readonly upgradeDomainLabel = 'Upgrade Domains';
    static readonly applicationUpgradeLabel = 'Application Upgrades';
    static readonly applicationPrcoessExitedLabel = 'Application Process Exited';

    consume(events: ApplicationEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
        const items = new DataSet<DataItem>();

        // state necessary for some events
        let previousApplicationUpgrade: ApplicationEvent;
        let upgradeApplicationStarted: ApplicationEvent;
        const applicationRollBacks: Record<string, {complete: ApplicationEvent, start?: ApplicationEvent}> = {};
        const processExitedGroups: Record<string, DataGroup> = {};

        events.forEach( event => {
            // we want the oldest upgrade started before finding any previousApplicationUpgrade
            // this means we should have an ongoing application upgrade
            if ( (event.kind === 'ApplicationUpgradeStarted' || event.kind === 'ApplicationUpgradeRollbackStarted') && !previousApplicationUpgrade ) {
                upgradeApplicationStarted = event;
            }else if (event.kind === 'ApplicationUpgradeDomainCompleted') {
                EventStoreUtils.parseUpgradeDomain(event, items, ApplicationTimelineGenerator.upgradeDomainLabel, 'ApplicationTypeVersion');
            }else if (event.kind === 'ApplicationUpgradeCompleted') {
                EventStoreUtils.parseUpgradeCompleted(event, items, ApplicationTimelineGenerator.applicationUpgradeLabel, 'ApplicationTypeVersion');
                previousApplicationUpgrade = event;
            }else if (event.kind === 'ApplicationProcessExited') {
                this.parseApplicationProcessExited(event, items, processExitedGroups);
            }

            // handle roll backs alone
            if (event.kind === 'ApplicationUpgradeRollbackCompleted') {
                previousApplicationUpgrade = event;
                applicationRollBacks[event.eventInstanceId] = {complete: event};
            }else if (event.kind === 'ApplicationUpgradeRollbackStarted' && event.eventInstanceId in applicationRollBacks) {
                applicationRollBacks[event.eventInstanceId].start = event;
            }
        });

        // we have to parse application upgrade roll backs into 2 seperate events and require 2 seperate events to piece together
        // we gather them up and add them at the end so we can get corresponding events
        Object.keys(applicationRollBacks).forEach(eventInstanceId => {
            const data = applicationRollBacks[eventInstanceId];
            EventStoreUtils.parseUpgradeAndRollback(data.complete, data.start, items, startOfRange, ApplicationTimelineGenerator.applicationUpgradeLabel, 'ApplicationTypeVersion');
        });

        // Display a pending upgrade
        if (upgradeApplicationStarted) {
            EventStoreUtils.parseUpgradeStarted(upgradeApplicationStarted, items, endOfRange, ApplicationTimelineGenerator.applicationUpgradeLabel, 'ApplicationTypeVersion');
        }

        const groups = new DataSet<DataGroup>([
            {id: ApplicationTimelineGenerator.upgradeDomainLabel, content: ApplicationTimelineGenerator.upgradeDomainLabel},
            {id: ApplicationTimelineGenerator.applicationUpgradeLabel, content: ApplicationTimelineGenerator.applicationUpgradeLabel},
        ]);

        const nestedApplicationProcessExited: DataGroup = {
            id: ApplicationTimelineGenerator.applicationPrcoessExitedLabel,
            nestedGroups: [],
            content: ApplicationTimelineGenerator.applicationPrcoessExitedLabel,
        };
        Object.keys(processExitedGroups).forEach(groupName => {
            nestedApplicationProcessExited.nestedGroups.push(groupName);
            groups.add(processExitedGroups[groupName]);
        });

        groups.add(nestedApplicationProcessExited);

        return {
            groups,
            items
        };
    }


    parseApplicationProcessExited(event: FabricEventBase, items: DataSet<DataItem>, processExitedGroups: Record<string, DataGroup>) {

        const groupLabel = `${event.eventProperties.ServicePackageName}`;
        processExitedGroups[groupLabel] = {id: groupLabel, content: groupLabel};

        const start = event.timeStamp;
        const label = event.eventProperties.ExeName;

        items.add({
            id: event.eventInstanceId + label,
            content: '',
            start,
            group: groupLabel,
            type: 'point',
            className: 'red-point',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, null, 'Primary swap to ' + label),
        });
    }
}

export class PartitionTimelineGenerator extends TimeLineGeneratorBase<NodeEvent> {
    static readonly swapPrimaryLabel = 'Primary Swap';
    static readonly swapPrimaryDurations = 'Swap Primary phases';

    consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
        const items = new DataSet<DataItem>();

        events.forEach( event => {
            if (event.category === 'StateTransition' && event.eventProperties.ReconfigType === 'SwapPrimary') {
                const end = event.timeStamp;
                const endDate = new Date(end);
                const duration = event.eventProperties.TotalDurationMs;
                const start = new Date(endDate.getTime() - duration).toISOString();
                const label = event.eventProperties.NodeName;

                items.add({
                    id: event.eventInstanceId + label,
                    content: label,
                    start,
                    end,
                    group: PartitionTimelineGenerator.swapPrimaryLabel,
                    type: 'range',
                    title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end, 'Primary swap to ' + label),
                    className: 'green'
                });

            }
        });

        const groups = new DataSet<DataGroup>([
            {id: PartitionTimelineGenerator.swapPrimaryLabel, content: PartitionTimelineGenerator.swapPrimaryLabel},
        ]);

        return {
            groups,
            items
        };
    }
}

/**
 * Take a csv string and parses the event into groups with nested references to properties specified in the query string.
 * i.e "Category, Kind"
 *   The layout is set to look like
 *   Category1
 *       Category1 - kind 1
 *       category1 - kind 2
 *    Category2
 *       Category2 - kind 1
 *       category2 - kind 2
 */
function parseAndAddGroupIdByString(event: FabricEvent, groupIds: any, query: string): string {
    const properties = query.split(',');

    // the accumulated path of the events property values
    let constructedPath = '';

    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];

        // if the event doesnt have the property, exist early below and give an empty string groupId so that it doesnt get charted
        if (prop in event.raw) {
            const currentPath = `${constructedPath} ${event.raw[prop]}`;

            if (findIndex(groupIds, (g: DataGroup) => g.id === currentPath) === -1) {

                const content = padStart('', i * 3) + event.raw[prop].toString();
                const childGroup: DataGroup = {id: currentPath, content };

                // "leaf" rows dont have nested rows
                if ( (i + 1) < properties.length) {
                    childGroup.nestedGroups = [];
                }

                // "root" rows dont have parents
                if (i > 0) {
                    const parentGroup = groupIds[findIndex(groupIds, (g: DataGroup) => g.id === constructedPath)];
                    parentGroup.nestedGroups.push(childGroup.id);
                }

                groupIds.push(childGroup);
            }

            constructedPath = currentPath;

        }else {
            i = properties.length;
            constructedPath = '';
        }
    }

    return constructedPath;
}

export function parseEventsGenerically(events: FabricEvent[], textSearch: string = ''): ITimelineData {
    const items = new DataSet<DataItem>();
    const groupIds: any[] = [];

    events.forEach( (event, index) => {
       const groupId = parseAndAddGroupIdByString(event, groupIds,  textSearch);
       let color = 'white';
       if ('Status' in event.eventProperties) {
            try {
                const status = event.eventProperties.Status;
                if (status === 'Ok') {
                    color = 'green';
                } else if (status === 'Warning') {
                    color = 'orange';
                } else if (status === 'Error') {
                    color = 'red';
                }
            }catch (e) {}
        }else {
            if (HtmlUtils.eventTypesUtil.isResolved(event)) {
                color = 'green';
            } else if (HtmlUtils.eventTypesUtil.isWarning(event)) {
                color = 'orange';
            } else if (HtmlUtils.eventTypesUtil.isError(event)) {
                color = 'red';
            }
        }

       const item: DataItem = {
            content: '',
            id: index,
            start: event.timeStamp,
            group: groupId,
            type: 'point',
            title: EventStoreUtils.tooltipFormat(event.raw, event.timeStamp),
            className: `${color}-point`,
            subgroup: 'noStack'
        };

        // optional event properties for higher degree of configuration
       if ('Duration' in event.eventProperties) {
            // only display a description for range based events
            if ('Description' in event.eventProperties) {
                try {
                    item.content = event.eventProperties.Description;
                }catch (e) {}
            }

            try {
                const duration = event.eventProperties.Duration;
                const end = event.timeStamp;
                const endDate = new Date(end);
                const start = new Date(endDate.getTime() - duration).toISOString();

                if (duration < 0) {
                    item.start = end;
                    item.end = start;
                    item.title = EventStoreUtils.tooltipFormat(event.raw, start, end, item.content);
                }else {
                    item.start = start;
                    item.end = end;
                    item.title = EventStoreUtils.tooltipFormat(event.raw, end, start, item.content);
                }

                item.type = 'range';
                item.className = color;
                item.subgroup = 'stack';
            }catch (e ) {}
        }

       items.add(item);
    });

    const groups = new DataSet<DataGroup>(groupIds);
    EventStoreUtils.addSubGroups(groups);

    return {
        groups,
        items
    };
}
