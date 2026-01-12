// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Transforms } from "src/app/Utils/Transforms";
import { Utils } from "src/app/Utils/Utils";
import { IEventPropertiesCollection } from "./Events";
import { IAnalysisResultDiff, IDiffAnalysis } from "./rcaEngineConfigurations";

export interface IPropertyMapper {
  staticValue?: any;
  property?: any;
  transforms?: ITransform[]; //used to describe source transformations that we want to make
}

export interface IPropertyMapping {
  source: IPropertyMapper;
  target: IPropertyMapper;
}

export interface ITransform {
  type: string;
  value?: any;
}

export interface IRelevantEventsConfig {
  eventType: string;
  propertyMappings: IPropertyMapping[];
  selfTransform?: ITransform[]; //used to describe self transformations that we want to make to strings
  result?: string;
}

export interface IConcurrentEventsConfig {
  eventType: string; // the event type we are investigating
  relevantEventsType: IRelevantEventsConfig[]; // possible causes we are considering
  result: string; //resulting property we want to display for events (ex. Repair Jobs action)
  resultTransform?: ITransform[]; //used to describe result transformations that we want to make
}

export interface IConcurrentEvents extends IRCAItem {
  reason: IConcurrentEvents // possibly related events now this could be recursive, i.e a node is down but that node down concurrent event would have its own info on whether it was due to a restart or a cluster upgrade
  reasonForEvent: string;
  inputEvent: IRCAItem;
}

export interface IRCAItem extends IEventPropertiesCollection {
  kind: string;
  name?: string;
  eventInstanceId: string;
  timeStamp: string;
}

export const getAndTransform = (event: IRCAItem, config: IPropertyMapper) => {
  let sourceVal = Utils.isDefined(config.staticValue) ? config.staticValue : Utils.result(event, config.property);
  if (config.transforms) {
    sourceVal = Transforms.getTransformations(config.transforms || [], sourceVal);
  }

  return sourceVal;
}
/***
 * Check if two events match using the mappings config
  ***/
export const validMappings = (sourceEvent: IRCAItem, targetEvent: IRCAItem, config: IRelevantEventsConfig): boolean => {
  let valid = true;
  let mappings = config.propertyMappings;
  mappings.forEach(mapping => {
    let sourceVal = getAndTransform(sourceEvent, mapping.source);
    let targetVal = getAndTransform(targetEvent, mapping.target);

    if (!Utils.isDefined(sourceVal) || !Utils.isDefined(targetVal) || sourceVal !== targetVal) {
      valid = false;
    }
  });

  return valid;
}

export const getSimultaneousEventsForEvent = (configs: IConcurrentEventsConfig[], inputEvents: IRCAItem[], events: IRCAItem[], existingEvents?: IConcurrentEvents[]): IConcurrentEvents[] => {
  /*
      Grab the events that occur concurrently with an inputted current event.
  */
  let simulEvents: IConcurrentEvents[] = existingEvents || [];

  const findEvent = (events: IConcurrentEvents[], event: IRCAItem) => {
    return events.find(e => e.eventInstanceId === event.eventInstanceId);
  }

  // iterate through all the input events
  inputEvents.forEach(inputEvent => {
    if (findEvent(simulEvents, inputEvent)) {
      return;
    }

    let action = "";
    let reasonForEvent = "";
    let reason = null;
    let moreSpecificReason = "";

    // iterate through all configurations
    configs.forEach(config => {
      let parsed = "";
      if (config.eventType == inputEvent.kind) {
        // iterate through all events to find relevant ones
        if (Utils.result(inputEvent, config.result)) {
          parsed = Utils.result(inputEvent, config.result);
          if (config.resultTransform) {
            parsed = Transforms.getTransformations(config.resultTransform, parsed);
          }
          action = parsed;
        }

        reasonForEvent = action;
        config.relevantEventsType.forEach(relevantEventType => {
          if (relevantEventType.eventType == "self") {
            if (validMappings(inputEvent, inputEvent, relevantEventType)) {
              if (relevantEventType.selfTransform) {
                parsed = Transforms.getTransformations(relevantEventType.selfTransform, parsed);
              }

              if(!reason) {
                reason = {
                  name: "self",
                  reason: null
                } as IConcurrentEvents;
              }

              action = parsed;
              if (relevantEventType.result) {
                moreSpecificReason = relevantEventType.result;
              }

              reasonForEvent = action;
            }
          }
          events.forEach(targetEvent => {
            if (relevantEventType.eventType == targetEvent.kind) {
              // see if each property mapping holds true
              if (validMappings(inputEvent, targetEvent, relevantEventType)) {
                const existingEvent = findEvent(simulEvents, targetEvent);
                if (existingEvent) {
                  reason = existingEvent;
                } else {
                  //generate events needed to build chain
                  const reasons = getSimultaneousEventsForEvent(configs, [targetEvent], events, simulEvents);
                  reasons.forEach(event => {
                    if (!findEvent(simulEvents, event)) {
                      simulEvents.push(event)
                    }
                  })
                  reason = reasons.find(e => e.eventInstanceId === targetEvent.eventInstanceId);
                }
              }
            }
          });
        });
      }
    });

    simulEvents.push({
      kind: inputEvent.kind,
      name: inputEvent.name,
      reason,
      reasonForEvent: moreSpecificReason || reasonForEvent,
      eventInstanceId: inputEvent.eventInstanceId,
      timeStamp: inputEvent.timeStamp,
      eventProperties: inputEvent.eventProperties,
      inputEvent
    });
  });

  return simulEvents;
}

export const getPeriodicEvent = (configs: IDiffAnalysis[], inputEvents: IRCAItem[]): IAnalysisResultDiff[] => {
  const results = configs.map(config => {
    return {
      config,
      events: []
    }
  })

  inputEvents.forEach(event => {
    results.forEach(config => {
      if(config.config.eventType === event.kind && validMappings(event, event, config.config)) {
        config.events.push(event);
      }
    })
  })

  return results;
}
