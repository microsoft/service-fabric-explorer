import { IConcurrentEventsConfig } from "src/app/modules/event-store/event-store/event-store.component";

const APE = [
  {
      eventType: "NodeDown",
      propertyMappings: [
          {
              sourceProperty: "raw.NodeName",
              targetProperty: "nodeName"
          },
          {
              sourceProperty: "raw.NodeInstance",
              targetProperty: "raw.NodeInstance"
          }
      ],
  },
  {
      eventType: "self",
      propertyMappings: [
          {
              sourceProperty: "raw.ExitCode",
              targetProperty: 7147
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
            type: 'trimBack',
            value: "ContainerName"
          }
      ]
  },
  {
      eventType: "self",
      propertyMappings: [
          {
              sourceProperty: "raw.ExitCode",
              targetProperty: 3221225786
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
              targetProperty: 7148
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
              sourceProperty: "raw.UnexpectedTermination",
              targetProperty: true
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
]

export let RelatedEventsConfigs : IConcurrentEventsConfig[] = [
    {
        "eventType": "ApplicationProcessExited",
        "relevantEventsType": APE,
        "result": "raw.ExitReason",
    },
    {
      "eventType": "ApplicationContainerInstanceExited",
      "relevantEventsType": APE,
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
