import { IConcurrentEventsConfig } from "src/app/modules/event-store/event-store/event-store.component";

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
                        targetProperty: "7147"
                    }
                ],
                selfTransform: [
                    {
                        type: "trimFront",
                        value: "."
                    },
                    {
                        type: "trimBack",
                        value: "For information"
                    }
                ]
            },
            {
                eventType: "self",
                propertyMappings: [
                    {
                        sourceProperty: "raw.ExitCode",
                        targetProperty: "3221225786"
                    }
                ],
                selfTransform: [
                    {
                        type: "trimFront",
                        value: "."
                    },
                    {
                        type: "trimBack",
                        value: "For information"
                    }
                ]
            },
            {
                eventType: "self",
                propertyMappings: [
                    {
                        sourceProperty: "raw.ExitCode",
                        targetProperty: "7148"
                    }
                ],
                selfTransform: [
                    {
                        type: "trimFront",
                        value: "."
                    },
                    {
                        type: "trimBack",
                        value: "For information"
                    }
                ]
            },
            {
                eventType: "self",
                propertyMappings: [
                    {
                        sourceProperty: "raw.ExitCode",
                        targetProperty: "0"
                    }
                ],
                selfTransform: [
                    {
                        type: "trimFront",
                        value: "."
                    },
                    {
                        type: "trimBack",
                        value: "For information"
                    },
                    {
                        type: "prefix",
                        value: "Unexpected Termination - "
                    }
                ]
            }
        ],
        "result": "raw.ExitReason",
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
                sourceTransform: [
                    {
                        type: "trimFront",
                        value: "/"
                    }
                ]
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