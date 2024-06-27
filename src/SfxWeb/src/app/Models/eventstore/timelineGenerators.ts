

import { FabricEventBase, ClusterEvent, NodeEvent, ApplicationEvent, FabricEvent, PartitionEvent, ReplicaEvent } from './Events';
import { DataGroup, DataItem, IdType } from 'vis-timeline/peer';
import { DataSet } from 'vis-data';
import padStart from 'lodash/padStart';
import findIndex from 'lodash/findIndex';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { getPeriodicEvent } from './rcaEngine';
import { differConfigs } from './RelatedEventsConfigs';
import { generateTimelineData } from './periodicEventParser';

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
    groups?: DataSet<DataGroup>;
    items?: DataSet<ITimelineItem>;
    start?: Date;
    end?: Date;
    potentiallyMissingEvents?: boolean;
    allowClustering?: boolean;
}

export interface ITimelineItem extends DataItem {
    kind: string
    color?: string;
    groupingClass?: string;
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
      return `<table>
              <tbody>
                ${rows}
              </tbody>
            </table>`;
    }

    private static internalToolTipFormatter = (key: string, data: any) => {
      let value = data;
      if (Array.isArray(data)) {
        value = data.map(arrValue => EventStoreUtils.internalToolTipFormatter('', arrValue)).join('');
      } else if (typeof data === 'object') {
        value = EventStoreUtils.internalToolTipFormatterObject(data);
      }
      return `<tr>
                <td class="margin-bottom"> ${key} </td>
                <td class="nested-row">
                  <div class="margin-right"> : </div class="white-space"> ${value} </td>
              </tr>`;
    }

    /*
    Produces an html string used for vis.js timeline tooltips.
    */
    public static tooltipFormat = (data: Record<string, any> , start: string, end: string = '', title: string= ''): string => {

        const outline = EventStoreUtils.internalToolTipFormatterObject(data);
        return `<div class="inner-tooltip">
                  ${title.length > 0 ? title + '<br>' : ''}
                  Start (local time): ${start}
                  <br>
                  ${ end ? 'End (local time): ' + end + '<br>' : ''}
                  <b>
                    Details
                  </b>
                  <br>
                  ${outline}
                </div>`;
    }

    public static singleItemStyleOverride = (color: string) => {
      return `background-color:${color};`
    }

    public static parseUpgradeAndRollback(rollbackCompleteEvent: FabricEventBase, eventIndex: number, rollbackStartedEvent: ClusterEvent, items: DataSet<ITimelineItem>,
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
                id: `${eventIndex}---${rollbackStartedEvent.eventInstanceId}`,
                content: 'Upgrade rolling forward failed',
                start: upgradeStart,
                end: rollbackStarted,
                kind: rollbackCompleteEvent.kind,
                group,
                type: 'range',
                className: 'red'
            });
        }

        const label = `rolling back to ${rollbackCompleteEvent.eventProperties[targetVersionProperty]}`;

        // roll back
        items.add({
            id: `0${eventIndex}---${rollbackCompleteEvent.eventInstanceId}`,
            content: label,
            start: rollbackStarted,
            end: rollbackEnd,
            kind: rollbackCompleteEvent.kind,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(rollbackCompleteEvent.eventProperties, rollbackStarted, rollbackEnd),
            className: 'orange'
        });

    }

    public static parseUpgradeDomain(event: FabricEventBase, eventIndex: number, items: DataSet<ITimelineItem>, group: string, targetVersionProperty: string): void {
        const end = event.timeStamp;
        const endDate = new Date(end);
        const duration = event.eventProperties.UpgradeDomainElapsedTimeInMs;

        const start = new Date(endDate.getTime() - duration).toISOString();
        const label = event.eventProperties.UpgradeDomains;

        items.add({
            id: `${eventIndex}---${event.eventInstanceId}`,
            content: label,
            start,
            end,
            kind: event.kind,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end),
            className: 'green'
        });
    }

    // Mainly used for if there is a current upgrade in progress.
    public static parseUpgradeStarted(event: FabricEventBase, eventIndex: number, items: DataSet<ITimelineItem>, endOfRange: Date, group: string, targetVersionProperty: string): void {

        const end = endOfRange.toISOString();
        const start = event.timeStamp;
        const content = `Upgrading to ${event.eventProperties[targetVersionProperty]}`;

        items.add({
            id: `${eventIndex}---${event.eventInstanceId}`,
            content,
            start,
            end,
            kind: event.kind,
            group,
            type: 'range',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end),
            className: 'blue'
        });
    }

    public static parseUpgradeCompleted(event: FabricEventBase, eventIndex: number, items: DataSet<ITimelineItem>, group: string, targetVersionProperty: string): void {
        const rollBack = event.kind === 'ClusterUpgradeRollbackCompleted';

        const end = event.timeStamp;
        const endDate = new Date(end);
        const duration = event.eventProperties.OverallUpgradeElapsedTimeInMs;

        const start = new Date(endDate.getTime() - duration).toISOString();
        const content = `${rollBack ? 'Upgrade Rolling back' : 'Upgrade rolling forward'} to ${event.eventProperties[targetVersionProperty]}`;

        items.add({
            id: `${eventIndex}---${event.eventInstanceId}`,
            content,
            start,
            end,
            kind: event.kind,
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

export abstract class TimeLineGeneratorBase<T> {
    consume(events: T[], startOfRange: Date, endOfRange: Date): ITimelineData {
         throw new Error('NotImplementedError');
    }

    generateTimeLineData(events: T[], startOfRange?: Date, endOfRange?: Date, nestedGroupLabel?: string): ITimelineData {
        const data = this.consume(events, startOfRange, endOfRange);
        EventStoreUtils.addSubGroups(data.groups);
        /*
            When we have more than one event type on the timeline we should group them by type to make it easier to visualize.
            If we set a nestedGroupLabel a group with the name of the event type will be created and gather all of its events.
        */
        if (nestedGroupLabel){
            const nestedElementGroup: DataGroup = {
                id: nestedGroupLabel,
                content: nestedGroupLabel,
                nestedGroups: []
            };

            // We should not add the already nested groups to the new event type one.
            let groupsAlreadyNested: IdType[] = [];
            data.groups.forEach(group => {
                nestedElementGroup.nestedGroups.push(group.id);
                if (group.nestedGroups){
                    groupsAlreadyNested = groupsAlreadyNested.concat(group.nestedGroups);
                }
            });
            // If the group is already nested, we remove it from the nested groups of the new one.
            nestedElementGroup.nestedGroups = nestedElementGroup.nestedGroups.filter(group => !groupsAlreadyNested.includes(group));

            data.groups.add(nestedElementGroup);
        }
        return data;
    }

}


export class ClusterTimelineGenerator extends TimeLineGeneratorBase<ClusterEvent> {
    static readonly upgradeDomainLabel = 'Cluster Upgrade Domains';
    static readonly clusterUpgradeLabel = 'Cluster Upgrades';
    static readonly seedNodeStatus = 'Seed Node Warnings';

    consume(events: ClusterEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
      const items = new DataSet<ITimelineItem>();

        // state necessary for some events
        let previousClusterHealthReport: ClusterEvent;
        let previousClusterUpgrade: ClusterEvent;
        let upgradeClusterStarted: ClusterEvent;
        const clusterRollBacks: Record<string, {complete: ClusterEvent, start?: ClusterEvent}> = {};

        events.forEach((event, index) => {
            // we want the oldest cluster upgrade started before finding any previousClusterUpgrade
            // this means we should have an ongoing cluster upgrade
            if ( (event.kind === 'ClusterUpgradeStarted' || event.kind === 'ClusterUpgradeRollbackStarted') && !previousClusterUpgrade ) {
                upgradeClusterStarted = event;
            }else if (event.kind === 'ClusterUpgradeDomainCompleted') {
                EventStoreUtils.parseUpgradeDomain(event, index, items, ClusterTimelineGenerator.upgradeDomainLabel, 'TargetClusterVersion');
            }else if (event.kind === 'ClusterUpgradeCompleted') {
                EventStoreUtils.parseUpgradeCompleted(event, index, items, ClusterTimelineGenerator.clusterUpgradeLabel, 'TargetClusterVersion');
                previousClusterUpgrade = event;
            }else if (event.kind === 'ClusterNewHealthReport') {
                this.parseSeedNodeStatus(event, index, items, previousClusterHealthReport, endOfRange);
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
            EventStoreUtils.parseUpgradeAndRollback(data.complete, events.indexOf(data.complete), data.start, items, startOfRange,
                                                            ClusterTimelineGenerator.clusterUpgradeLabel, 'TargetClusterVersion');
        });

        // Display a pending upgrade
        if (upgradeClusterStarted) {
            EventStoreUtils.parseUpgradeStarted(upgradeClusterStarted, events.indexOf(upgradeClusterStarted), items, endOfRange, ClusterTimelineGenerator.clusterUpgradeLabel, 'TargetClusterVersion');
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

    parseSeedNodeStatus(event: ClusterEvent, eventIndex: number, items: DataSet<ITimelineItem>, previousClusterHealthReport: ClusterEvent, endOfRange: Date): void {
        if (event.eventProperties.HealthState === 'Warning') {
            // for end date if we dont have a previously seen health report(list iterates newest to oldest) then we know its still the ongoing state
            const end = previousClusterHealthReport ? previousClusterHealthReport.timeStamp : endOfRange.toISOString();
            const content = `${event.eventProperties.HealthState}`;

            items.add({
                id: `${eventIndex}---${event.eventInstanceId}`,
                content,
                start: event.timeStamp,
                end,
                kind: event.kind,
                group: ClusterTimelineGenerator.seedNodeStatus,
                type: 'range',
                title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp, end),
                className: 'orange'
            });
        }
    }
}

const NodeUp = 'NodeUp';
const NodeDown = 'NodeDown';
const NodeDeactivateCompleted = 'NodeDeactivateCompleted';
const NodeRemovedFromCluster = 'NodeRemovedFromCluster';
const NodeAddedToCluster = 'NodeAddedToCluster';
const NodeOpenFailed = "NodeOpenFailed";
export class NodeTimelineGenerator extends TimeLineGeneratorBase<NodeEvent> {
  static readonly NodesDownLabel = 'Node Down';
  static readonly NodesRemoved = 'Node Removed';
  static readonly NodesAdded = 'Node Added';
  static readonly NodesFailedToOpenLabel = 'Nodes Failed to Open';
  static readonly NodesAddedToClusterLabel = 'Nodes Added to cluster';
  static readonly NodesRemovedFromClusterLabel = 'Nodes removed from cluster';
  static readonly transitions = [NodeUp, NodeDown, NodeDeactivateCompleted, NodeRemovedFromCluster, NodeAddedToCluster, NodeOpenFailed];

  generateNodeOpenFailedEvent(event: NodeEvent, eventIndex: number) {
    const item = {
      id: `${eventIndex}---${event.eventInstanceId}`,
      start: event.timeStamp,
      group: NodeTimelineGenerator.NodesFailedToOpenLabel,
      type: 'point',
      kind: event.kind,
      title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp, null, `${event.nodeName} failed to open with ${event.eventProperties['Error']}.`),
      className: 'red-point',
      subgroup: 'stack',
      content: ''
    };
    return item;
  }

  generateAddOrRemovedNodeEvent(event: NodeEvent, eventIndex: number, added: boolean = true) {
    const label = `Node ${event.nodeName} ${added ? 'added to' : 'removed from'} cluster`;
    const item = {
      id: `${eventIndex}---${event.eventInstanceId}`,
      start: event.timeStamp,
      group: added ? NodeTimelineGenerator.NodesAddedToClusterLabel : NodeTimelineGenerator.NodesRemovedFromClusterLabel,
      type: 'point',
      kind: event.kind,
      title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp, null, label),
      className: 'orange-point',
      subgroup: 'stack',
      content: ''
    };
    return item;
  };

  generateDownNodeEvent(event: NodeEvent, eventIndex: number, start: string, end: string, additionalContext?: string) {
    const label = `Node ${event.nodeName} down${additionalContext ? (" " + additionalContext) : ''}`;
    const item = {
      id: `${eventIndex}---${event.eventInstanceId}`,
      content: label,
      start,
      end,
      kind: event.kind,
      group: NodeTimelineGenerator.NodesDownLabel,
      type: 'range',
      title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end, label),
      className: additionalContext ? 'darkorange' : 'red',
      subgroup: 'stack'
    };
    return item;
  };

  generateNodeDisablingEvent(event: NodeEvent, eventIndex: number) {
    const label = `Node ${event.nodeName} Disabling with intent ${event.eventProperties.EffectiveDeactivateIntent}`;
    const start = event.eventProperties.StartTime;
    const end = event.timeStamp;
    const item = {
      id: `${eventIndex}---${event.eventInstanceId}`,
      content: label,
      start,
      end,
      kind: event.kind,
      group: NodeTimelineGenerator.NodesDownLabel,
      type: 'range',
      title: EventStoreUtils.tooltipFormat(event.eventProperties, start, end, label),
      className: 'yellow',
      subgroup: 'stack'
    };
    return item;
  };

    consume(events: NodeEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
        events = events.sort((a,b) => Date.parse(b.timeStamp) - Date.parse(a.timeStamp))

        const nodeEventMap: Record<string, NodeEvent[]> = {};
        let failedToOpen = false; //only add the failed to open events group if we see any
        let addedToCluster = false;
        let removedFromCluster = false;
        //split node events by nodename, much simpler since we dont do any cross node checks
        events.forEach(event => {
          if(!(event.nodeName in nodeEventMap)) {
            nodeEventMap[event.nodeName] = [];
          }
          nodeEventMap[event.nodeName].push(event);
        });

        const items = new DataSet<ITimelineItem>();


        Object.keys(nodeEventMap).forEach(nodeName => {
          const nodeEvents = nodeEventMap[nodeName];

          //hold onto the last "state" node i.e up or down to put bounds on unexpected down events
          let lastTransitionEvent: NodeEvent = null;

          let lastUpEvent: NodeEvent;
          let lastDownEvent: {event: NodeEvent, end: string} = null;
          let lastRemoved: NodeEvent;
          //repeat item filter
          const seenIds = new Set();

          //we only care about transitionevents and specific ones, reverse order to make node events easier to parse and filter out repeat deactivate events
          nodeEvents.filter(event => event.category === 'StateTransition' && NodeTimelineGenerator.transitions.includes(event.kind)).reverse().filter(event => {
            //remove duplicates until the runtime does not produce them.
            if(event.kind === NodeDeactivateCompleted) {
              const uniqueId = event.eventProperties.BatchIdsWithDeactivateIntent;
              if(seenIds.has(event.eventProperties.BatchIdsWithDeactivateIntent) ) {
                return false;
              }else{
                seenIds.add(uniqueId);
                return true;
              }
            }else{
              return true;
            }
          }).reverse().forEach((event, index) => {
            if (event.kind === NodeDown) {
                if(lastRemoved) {
                  items.add(this.generateDownNodeEvent(event, index, event.timeStamp, lastRemoved.timeStamp, 'and removed from the cluster'));
                  lastUpEvent = null;
                  lastDownEvent = null;
                  lastRemoved = null;

                } else if (lastDownEvent) {
                  items.add(this.generateDownNodeEvent(event, index, event.timeStamp, lastDownEvent.end));
                  lastUpEvent = null;
                  lastDownEvent = null;
                }else if (lastUpEvent) {
                  lastDownEvent = { event, end: lastUpEvent.timeStamp };
                  lastUpEvent = null;
                } else {
                  let end = endOfRange.toISOString()
                  if(lastTransitionEvent) {
                    end = lastTransitionEvent.timeStamp;
                  }
                  lastDownEvent = { event, end };
                }
                lastTransitionEvent = event;
            }

            if(event.kind === 'NodeUp') {
              if(lastDownEvent) {
                items.add(this.generateDownNodeEvent(lastDownEvent.event, index, lastDownEvent.event.timeStamp, lastDownEvent.end));
                lastDownEvent = null;
              }

              lastUpEvent = event;
              lastTransitionEvent = event;
            }

            if(event.kind === NodeRemovedFromCluster) {
              removedFromCluster = true;
              lastRemoved = event;
              items.add(this.generateAddOrRemovedNodeEvent(event, index, false));
            }

            if(event.kind === NodeAddedToCluster) {
              addedToCluster = true;
              items.add(this.generateAddOrRemovedNodeEvent(event, index, true));
              if(lastDownEvent) {
                lastDownEvent = null;
              }
              lastUpEvent = null;
            }

            if(event.kind === NodeDeactivateCompleted) {
              //dont show node down if its expected
              if(event.eventProperties.EffectiveDeactivateIntent === 'RemoveNode') {
                //TODO add a removed and down event?
                items.add(this.generateNodeDisablingEvent(event, index));

                lastDownEvent = null;
              }else {
                if(lastDownEvent) {
                  items.add(this.generateDownNodeEvent(lastDownEvent.event, events.indexOf(lastDownEvent.event), lastDownEvent.event.timeStamp, lastDownEvent.end, `with intent disabled ${event.eventProperties.EffectiveDeactivateIntent}`));
                  items.add(this.generateNodeDisablingEvent(event, index));
                  lastDownEvent = null;
                  lastUpEvent = null;
                }else{
                  items.add(this.generateDownNodeEvent(event, index, event.eventProperties['StartTime'] as string, event.timeStamp as string, `with intent disabled ${event.eventProperties.EffectiveDeactivateIntent}`));
                }
              }
            }

            if(event.kind === NodeOpenFailed) {
              items.add(this.generateNodeOpenFailedEvent(event, index));
              failedToOpen = true;
            }
          })

          if(lastDownEvent) {
            items.add(this.generateDownNodeEvent(lastDownEvent.event, events.indexOf(lastDownEvent.event), lastDownEvent.event.timeStamp, lastDownEvent.end));
          }

          if(lastUpEvent) {
            items.add(this.generateDownNodeEvent(lastUpEvent, events.indexOf(lastUpEvent), lastUpEvent.eventProperties.LastNodeDownAt, lastUpEvent.timeStamp));
          }
        })

        const groups = new DataSet<DataGroup>([
          {id: NodeTimelineGenerator.NodesDownLabel, content: NodeTimelineGenerator.NodesDownLabel, subgroupStack: {stack: true}},
        ]);

        if(addedToCluster) {
          groups.add({
            id: NodeTimelineGenerator.NodesAddedToClusterLabel, content: NodeTimelineGenerator.NodesAddedToClusterLabel
          })
        }

        if(removedFromCluster) {
          groups.add({
            id: NodeTimelineGenerator.NodesRemovedFromClusterLabel, content: NodeTimelineGenerator.NodesRemovedFromClusterLabel
          })
        }

        if(failedToOpen) {
          groups.add({
            id: NodeTimelineGenerator.NodesFailedToOpenLabel, content: NodeTimelineGenerator.NodesFailedToOpenLabel
          })
        }

        return {
            groups,
            items,
            potentiallyMissingEvents: false
        };
    }
}

export class ApplicationTimelineGenerator extends TimeLineGeneratorBase<ApplicationEvent> {
    static readonly upgradeDomainLabel = 'Application Upgrade Domains';
    static readonly applicationUpgradeLabel = 'Application Upgrades';
    static readonly applicationPrcoessExitedLabel = 'Application Process Exited';
    static readonly applicationContainerExitedLabel = 'Container Process Exited';

    consume(events: ApplicationEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
      const items = new DataSet<ITimelineItem>();

        // state necessary for some events
        let previousApplicationUpgrade: ApplicationEvent;
        let upgradeApplicationStarted: ApplicationEvent;

        const applicationRollBacks: Record<string, {complete: ApplicationEvent, start?: ApplicationEvent}> = {};
        const processExitedGroups: Record<string, DataGroup> = {};
        const containerExitedGroups: Record<string, DataGroup> = {};

        events.forEach((event, index) => {
            // we want the oldest upgrade started before finding any previousApplicationUpgrade
            // this means we should have an ongoing application upgrade
            if ( (event.kind === 'ApplicationUpgradeStarted' || event.kind === 'ApplicationUpgradeRollbackStarted') && !previousApplicationUpgrade ) {
                upgradeApplicationStarted = event;
            }else if (event.kind === 'ApplicationUpgradeDomainCompleted') {
                EventStoreUtils.parseUpgradeDomain(event, index, items, ApplicationTimelineGenerator.upgradeDomainLabel, 'ApplicationTypeVersion');
            }else if (event.kind === 'ApplicationUpgradeCompleted') {
                EventStoreUtils.parseUpgradeCompleted(event, index, items, ApplicationTimelineGenerator.applicationUpgradeLabel, 'ApplicationTypeVersion');
                upgradeApplicationStarted = null;
                previousApplicationUpgrade = event;
            }else if (event.kind === 'ApplicationProcessExited') {
                this.parseApplicationProcessExited(event, index, items, processExitedGroups);
            }else if(event.kind === "ApplicationContainerInstanceExited") {
              this.parseApplicationProcessExited(event, index, items, containerExitedGroups);
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
            EventStoreUtils.parseUpgradeAndRollback(data.complete, events.indexOf(data.complete), data.start, items, startOfRange, ApplicationTimelineGenerator.applicationUpgradeLabel, 'ApplicationTypeVersion');
        });

        // Display a pending upgrade
        if (upgradeApplicationStarted) {
            EventStoreUtils.parseUpgradeStarted(upgradeApplicationStarted, events.indexOf(upgradeApplicationStarted), items, endOfRange, ApplicationTimelineGenerator.applicationUpgradeLabel, 'ApplicationTypeVersion');
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

        const nestedContainerProcessExited: DataGroup = {
            id: ApplicationTimelineGenerator.applicationContainerExitedLabel,
            nestedGroups: [],
            content: ApplicationTimelineGenerator.applicationContainerExitedLabel,
        };

          Object.keys(containerExitedGroups).forEach(groupName => {
            nestedContainerProcessExited.nestedGroups.push(groupName);
            groups.add(containerExitedGroups[groupName]);
        });

        groups.add(nestedContainerProcessExited);

        return {
            groups,
            items,
            potentiallyMissingEvents: false
        };
    }


    parseApplicationProcessExited(event: FabricEventBase, eventIndex: number, items: DataSet<ITimelineItem>, processExitedGroups: Record<string, DataGroup>) {
        const groupLabel = `${event.eventProperties.ServicePackageName}`;
        processExitedGroups[groupLabel] = {id: groupLabel, content: groupLabel};

        const start = event.timeStamp;
        const label = event.eventProperties.ExeName;

        items.add({
            id: `${eventIndex}---${event.eventInstanceId}`,
            content: '',
            start,
            kind: event.kind,
            group: groupLabel,
            type: 'point',
            className: event.eventProperties.UnexpectedTermination ? 'red-point' : 'green-point',
            title: EventStoreUtils.tooltipFormat(event.eventProperties, start, null, 'Primary swap to ' + label),
        });
    }

    parseContainerExited(event: FabricEventBase, eventIndex: number, items: DataSet<ITimelineItem>, processExitedGroups: Record<string, DataGroup>) {
      const groupLabel = `${event.eventProperties.ServicePackageName}`;
      processExitedGroups[groupLabel] = {id: groupLabel, content: groupLabel};

      const start = event.timeStamp;
      const label = event.eventProperties.ExeName;

      items.add({
          id: `${eventIndex}---${event.eventInstanceId}`,
          content: '',
          start,
          kind: event.kind,
          group: groupLabel,
          type: 'point',
          className: event.eventProperties.UnexpectedTermination ? 'red-point' : 'green-point',
          title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp),
      });
  }
}

export class PartitionTimelineGenerator extends TimeLineGeneratorBase<PartitionEvent> {
    static readonly swapPrimaryLabel = 'Primary Swap';
    static readonly swapPrimaryDurations = 'Swap Primary phases';

    consume(events: PartitionEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
      const items = new DataSet<ITimelineItem>();

        events.forEach( (event, index) => {
            if (event.category === 'StateTransition' && event.eventProperties.ReconfigType === 'SwapPrimary') {
                const end = event.timeStamp;
                const endDate = new Date(end);
                const duration = event.eventProperties.TotalDurationMs;
                const start = new Date(endDate.getTime() - duration).toISOString();
                const label = event.eventProperties.NodeName;

                items.add({
                    kind: 'primaryswap',
                    id: `${index}---${event.eventInstanceId}`,
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

        const periodicEventResults = getPeriodicEvent(differConfigs, events);

        const groups = new DataSet<DataGroup>([
            {id: PartitionTimelineGenerator.swapPrimaryLabel, content: PartitionTimelineGenerator.swapPrimaryLabel},
        ]);


        periodicEventResults.forEach(result => {
          const timelineData = generateTimelineData(result.events, result.config, startOfRange, endOfRange);
          timelineData.groups.forEach(group => {
            groups.add(group)
          })

          timelineData.items.forEach(event => {
            items.add(event);
          })
        })
        return {
            groups,
            items
        };
    }
}

export class ReplicaTimelineGenerator extends TimeLineGeneratorBase<ReplicaEvent> {
  consume(events: ReplicaEvent[], startOfRange: Date, endOfRange: Date): ITimelineData {
    let sawNamingMetricsId = "";
    const items = new DataSet<ITimelineItem>();

    events.forEach( (event, index) => {
        if (event.kind === 'NamingMetricsReported') {
            sawNamingMetricsId = event.partitionId +  'namingMetric';
            items.add({
                kind: sawNamingMetricsId,
                id: `${index}---${event.eventInstanceId}`,
                content: 'naming metric',
                start: event.timeStamp,
                group: PartitionTimelineGenerator.swapPrimaryLabel,
                type: 'point',
                title: EventStoreUtils.tooltipFormat(event.eventProperties, event.timeStamp, null, 'naming metric'),
                className: 'green'
            });
        }
    });

    const groups = new DataSet<DataGroup>();

    if(sawNamingMetricsId.length > 0) {
      groups.add({
        id: sawNamingMetricsId,
        content: "Naming Metric report"
      })
    }

    return {
      groups,
      items
    }
  }
}

export class RepairTaskTimelineGenerator extends TimeLineGeneratorBase<RepairTask>{

    consume(tasks: RepairTask[], startOfRange: Date, endOfRange: Date): ITimelineData{
      const items = new DataSet<ITimelineItem>();
      const groups = new DataSet<DataGroup>();

        tasks.forEach((task, index) => {
            items.add({
                id: `${index}---${task.raw.TaskId}`,
                content: task.raw.TaskId,
                start: task.startTime ,
                end: task.inProgress ? new Date() : new Date(task.raw.History.CompletedUtcTimestamp),
                type: 'range',
                kind: "RepairJob",
                group: 'job',
                subgroup: 'stack',
                className: task.inProgress ? 'blue' : task.raw.ResultStatus === 'Succeeded' ? 'green' : 'red',
                title: EventStoreUtils.tooltipFormat(task.raw, new Date(task.raw.History.ExecutingUtcTimestamp).toLocaleString(),
                                                            new Date(task.raw.History.CompletedUtcTimestamp).toLocaleString()),
            });
        });
        groups.add({
            id: 'job',
            content: 'Job History',
            subgroupStack: {stack: true}
        });

        return {
            groups,
            items,
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
function parseAndAddGroupIdByString(event: FabricEvent, groupIds: any, query: string, prefixId: string): string {
    const properties = query.split(',');

    // the accumulated path of the events property values
    let constructedPath = prefixId;

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

export function parseEventsGenerically(events: FabricEvent[], textSearch: string, idPrefix: string = Math.random().toString()): ITimelineData {
  const items = new DataSet<ITimelineItem>();
  const groupIds: any[] = [];

    events.forEach( (event, index) => {
       const groupId = parseAndAddGroupIdByString(event, groupIds, textSearch, idPrefix);
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

       const item: ITimelineItem = {
            content: '',
            id: `${index}---${event.eventInstanceId}`,
            start: event.timeStamp,
            kind: event.kind,
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
