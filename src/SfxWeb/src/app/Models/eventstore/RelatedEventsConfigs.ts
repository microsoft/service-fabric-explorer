import { AppInsightsErrorHandler } from "src/app/error-handling";
import { IConcurrentEventsConfig } from "src/app/modules/event-store/event-store/event-store.component";
import { IRelevantEventsConfig } from "src/app/modules/event-store/event-store/event-store.component";

export let RelatedEventsConfigs : IConcurrentEventsConfig[] = [
    {
        "eventType": "ApplicationProcessExited",
        "relevantEventsType": [
            {
                eventType: "NodeDown",
                propertyMappings: [
                    {
                        sourceProperty: "nodeName", 
                        targetProperty: "nodeName"
                    }
                ]
            }
        ]
    },
    {
        "eventType": "NodeDown",
        "relevantEventsType": [
            {
                eventType: "NodeDeactivateStarted",
                propertyMappings: [
                    {
                        sourceProperty: "nodeName",
                        targetProperty: "nodeName"
                    },
                    {
                        sourceProperty: "raw.NodeInstance",
                        targetProperty: "raw.NodeInstance"
                    }
                ]                    
            }
        ]
    },    
];