import { Transforms } from "src/app/Utils/Transforms";
import { Utils } from "src/app/Utils/Utils";
import { IEventPropertiesCollection } from "./Events";

export interface IPropertyMapping {
  sourceProperty: any;
  targetProperty: any;
  sourceTransform?: ITransform[]; //used to describe source transformations that we want to make
  targetTransform?: ITransform[]; //used to describe target transformations that we want to make
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
            let propMaps = true;
            let mappings = relevantEventType.propertyMappings;
            mappings.forEach(mapping => {
              let sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
              let targetVal = mapping.targetProperty;

              if (mapping.sourceTransform) {
                sourceVal = Transforms.getTransformations(mapping.sourceTransform, sourceVal);
              }

              if (!Utils.isDefined(sourceVal) || !Utils.isDefined(targetVal) || sourceVal !== targetVal) {
                propMaps = false;
              } else {
              }
            });
            if (propMaps) {
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
          events.forEach(iterEvent => {
            if (relevantEventType.eventType == iterEvent.kind) {
              // see if each property mapping holds true
              let valid = true;
              let mappings = relevantEventType.propertyMappings;
              mappings.forEach(mapping => {
                let sourceVal = Utils.result(inputEvent, mapping.sourceProperty);
                if (mapping.sourceTransform) {
                  sourceVal = Transforms.getTransformations(mapping.sourceTransform, sourceVal);
                }

                let targetVal = Utils.result(iterEvent, mapping.targetProperty);
                if (mapping.targetTransform) {
                  targetVal = Transforms.getTransformations(mapping.targetTransform, targetVal);
                }

                if (!Utils.isDefined(sourceVal) || !Utils.isDefined(targetVal) || sourceVal !== targetVal) {
                  valid = false;
                }
              });

              if (valid) {
                const existingEvent = findEvent(simulEvents, iterEvent);
                if(existingEvent) {
                  reason = existingEvent;
                }else{
                  //generate events needed to build chain
                  const reasons = getSimultaneousEventsForEvent(configs, [iterEvent], events, simulEvents);
                  reasons.forEach(event => {
                    if(!findEvent(simulEvents, event)) {
                      simulEvents.push(event)
                    }
                  })
                  reason = reasons.find(e => e.eventInstanceId === iterEvent.eventInstanceId);
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
