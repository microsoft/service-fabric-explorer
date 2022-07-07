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
                ],
            }, 
            {
                eventType: "self",
                propertyMappings: [
                    {
                        sourceProperty: "raw.ExitCode",
                        targetProperty: "7148"
                    }
                ],
                action: "Aborting since deactivation failed."
            },
            {
                eventType: "self",
                propertyMappings: [
                    {
                        sourceProperty: "raw.ExitCode",
                        targetProperty: "0"
                    }
                ],
                action: "Unexpected Termination - Please look at your application logs/dump or debug your code package for more details."
            }
        ],
        "result": ""
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
                ],
            }
        ],
        "result": ""
    },
    {
        "eventType": "NodeDeactivateStarted",
        "relevantEventsType" : [
            {
                eventType: "RepairTask",
                propertyMappings: [
                    {
                        sourceProperty: "raw.BatchId",
                        targetProperty: "raw.TaskId"
                    }
                ],
            }
        ],
        "result": ""
    },
    {
        "eventType": "RepairTask",
        "relevantEventsType" : [
        ],
        "result": "raw.Action"
    },  
];