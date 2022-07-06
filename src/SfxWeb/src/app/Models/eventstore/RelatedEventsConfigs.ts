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
            }
        ],
        "result": "",
        "hasExitedCode": "raw.ExitCode"
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
        "result": "",
        "hasExitedCode": null
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
        "result": "",
        "hasExitedCode": null
    },
    {
        "eventType": "RepairTask",
        "relevantEventsType" : [
        ],
        "result": "raw.Action",
        "hasExitedCode": null
    },
];