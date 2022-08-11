import { Transforms } from "src/app/Utils/Transforms";
import { Utils } from "src/app/Utils/Utils";
import { FabricEventBase } from "./Events";

export interface IPropertyMapping {
  sourceProperty: any;
  targetProperty: any;
}

export interface ITransform {
  type: string;
  value: any;
}

export interface IRelevantEventsConfig {
  eventType: string;
  propertyMappings: IPropertyMapping[];
  selfTransform?: ITransform[]; //used to describe self transformations that we want to make to strings
  sourceTransform?: ITransform[]; //used to describe source transformations that we want to make
  targetTransform?: ITransform[]; //used to describe target transformations that we want to make
}

export interface IConcurrentEventsConfig {
  eventType: string; // the event type we are investigating
  relevantEventsType: IRelevantEventsConfig[]; // possible causes we are considering
  result: string; //resulting property we want to display for events (ex. Repair Jobs action)
}

export interface IConcurrentEvents extends FabricEventBase {
  name?: string;
  reason: IConcurrentEvents // possibly related events now this could be recursive, i.e a node is down but that node down concurrent event would have its own info on whether it was due to a restart or a cluster upgrade
  reasonForEvent: string;
}

export interface IRCAItem extends IConcurrentEvents {
  reasonForEvent: string;
}

export interface IVisEvent {
  eventInstanceId: string;
  visPresent: boolean;
  visEvent: IConcurrentEvents;
}

export const getSimultaneousEventsForEvent = (configs: IConcurrentEventsConfig[], inputEvents: IRCAItem[], events: IRCAItem[]): IConcurrentEvents[] => {
  /*
      Grab the events that occur concurrently with an inputted current event.
  */
  let simulEvents: IConcurrentEvents[] = [];
  let addedEvents: IRCAItem[] = [];
  let action = "";
  let parsed = "";

  // iterate through all the input events
  inputEvents.forEach(inputEvent => {
    // iterate through all configurations
    configs.forEach(config => {
      if (config.eventType == inputEvent.kind) {
        // iterate through all events to find relevant ones
        if (Utils.result(inputEvent, config.result)) {
          parsed = Utils.result(inputEvent, config.result);
          action = parsed;
        }
        inputEvent.reasonForEvent = action;
        config.relevantEventsType.forEach(relevantEventType => {
          if (relevantEventType.eventType == "self") {
            let propMaps = true;
            let mappings = relevantEventType.propertyMappings;
            mappings.forEach(mapping => {
              let sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
              let targetVal = mapping.targetProperty;

              if (!Utils.isDefined(sourceVal) || !Utils.isDefined(targetVal) || sourceVal !== targetVal) {
                propMaps = false;
              }
            });
            if (propMaps) {
              if (relevantEventType.selfTransform) {
                parsed = Transforms.getTransformations(relevantEventType.selfTransform, parsed);
              }

              inputEvent.reason = {
                name: "self",
                reason: null
              } as IConcurrentEvents;
              action = parsed;
              inputEvent.reasonForEvent = action;
            }
          }
          events.forEach(iterEvent => {
            if (relevantEventType.eventType == iterEvent.kind) {
              // see if each property mapping holds true
              let valid = true;
              let mappings = relevantEventType.propertyMappings;
              mappings.forEach(mapping => {
                let sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
                if (relevantEventType.sourceTransform) {
                  sourceVal = Transforms.getTransformations(relevantEventType.sourceTransform, sourceVal);
                }

                let targetVal = Utils.result(iterEvent, mapping.targetProperty);
                if (relevantEventType.targetTransform) {
                  targetVal = Transforms.getTransformations(relevantEventType.targetTransform, targetVal);
                }

                if (!Utils.isDefined(sourceVal) || !Utils.isDefined(targetVal) || sourceVal !== targetVal) {
                  valid = false;
                }
              });

              if (valid) {
                inputEvent.reason = iterEvent;
                addedEvents.push(iterEvent);
              }
            }
          });
        });
      }
    });
    simulEvents.push(inputEvent);
  });

  if (addedEvents.length > 0) getSimultaneousEventsForEvent(configs, addedEvents, events);
  return simulEvents;
}
