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
}

export interface IConcurrentEvents extends IRCAItem{
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

export const getSimultaneousEventsForEvent = (configs: IConcurrentEventsConfig[], inputEvents: IRCAItem[], events: IRCAItem[]): IConcurrentEvents[] => {
  /*
      Grab the events that occur concurrently with an inputted current event.
  */
  let simulEvents: IConcurrentEvents[] = [];

  // iterate through all the input events
  inputEvents.forEach(inputEvent => {
    if(simulEvents.some(event => event.eventInstanceId === inputEvent.eventInstanceId)) {
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
                console.log(sourceVal)
              }

              if(typeof sourceVal === "string" &&  sourceVal.includes("Aborting since deactivation failed. Deactivating as part of request from Activator CodePackage."))
              console.log([sourceVal, targetVal])

              if (!Utils.isDefined(sourceVal) || !Utils.isDefined(targetVal) || sourceVal !== targetVal) {
                propMaps = false;
              }else{
                console.log("valid", sourceVal, targetVal)
              }
            });
            if (propMaps) {
              if (relevantEventType.selfTransform) {
                parsed = Transforms.getTransformations(relevantEventType.selfTransform, parsed);
              }

              reason = {
                name: "self",
                reason: null
              } as IConcurrentEvents;

              action = parsed;
              console.log(relevantEventType)
              if(relevantEventType.result) {
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
                reason = getSimultaneousEventsForEvent(configs, [iterEvent], events)[0];
                simulEvents.push(reason);
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
