import { IConcurrentEventsConfig, IRelevantEventsConfig } from "./rcaEngine";

const APE: IRelevantEventsConfig[] = [
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
      },
      {
        sourceProperty: "raw.ExitReason",
        targetProperty: " Deactivating as part of request from Activator CodePackage. ",
        sourceTransform: [{
          type: "trimFront",
          value: ". "
        },
        {
          type: "trimBack",
          value: "For information"
        },
        {
          type: 'trimBack',
          value: " ContainerName"
        },
        ]
      }
    ],
    result: 'Expected Termination - Deactivating as part of request from Activator CodePackage.',
  },
  {
    eventType: "self",
    propertyMappings: [
      // {
      //   sourceProperty: "raw.ExitCode",
      //   targetProperty: 7147
      // },
      {
        sourceProperty: "raw.ExitReason",
        targetProperty: "Deactivating since no replica hosted.",
        sourceTransform: [{
          type: "trimFront",
          value: ". "
        },
        {
          type: "trimBack",
          value: "For information"
        },
        {
          type: 'trimBack',
          value: " ContainerName"
        },
        {
          type: 'trimWhiteSpace'
        }]
      }
    ],
    result: 'Expected Termination - Deactivating since no replica hosted.'
  },
  {
    eventType: "self",
    propertyMappings: [
      {
        sourceProperty: "raw.ExitCode",
        targetProperty: 7148
      },
      {
        sourceProperty: "raw.ExitReason",
        targetProperty: "Aborting since deactivation failed. Deactivating since no replica hosted.",
        sourceTransform: [{
          type: "trimFront",
          value: ". "
        },
        {
          type: "trimBack",
          value: "For information"
        },
        {
          type: 'trimBack',
          value: " ContainerName"
        },
        {
          type: 'trimWhiteSpace'
        }]
      }
    ],
    result: 'Expected Termination - Aborting since deactivation failed. Deactivating since no replica hosted.'
  },
  {
    eventType: "self",
    propertyMappings: [
      {
        sourceProperty: "raw.ExitCode",
        targetProperty: 7148
      },
      {
        sourceProperty: "raw.ExitReason",
        targetProperty: "Aborting since deactivation failed. Deactivating as part of request from Activator CodePackage.",
        sourceTransform: [{
          type: "trimFront",
          value: ". "
        },
        {
          type: "trimBack",
          value: "For information"
        },
        {
          type: 'trimBack',
          value: " ContainerName"
        },
        {
          type: 'trimWhiteSpace'
        }]
      }
    ],
    result: `Expected Termination - Aborting since deactivation failed. Deactivating as part of request from Activator CodePackage.
              Sometimes, this error code indicates that the process or container didn't respond in a
              timely manner after sending a Ctrl+C signal, and it had to be terminated.`
  },
  {
    eventType: "self",
    propertyMappings: [
      {
        sourceProperty: "raw.ExitCode",
        targetProperty: 7147
      },
      {
        sourceProperty: "raw.ExitReason",
        targetProperty: " Restarting the container because HEALTHCHECK for Docker container",
        sourceTransform: [{
          type: "trimFront",
          value: ". "
        },
        {
          type: "trimBack",
          value: "For information"
        },
        {
          type: 'trimBack',
          value: " ContainerName"
        },
        ]
      }
    ],
    result: 'Expected Termination - restart due to configured container healthcheck failure.',
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

export let RelatedEventsConfigs: IConcurrentEventsConfig[] = [
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
    "relevantEventsType": [
      {
        eventType: "RepairTask",
        propertyMappings: [
          {
            sourceProperty: "raw.BatchId",
            targetProperty: "raw.TaskId",
            sourceTransform: [
              {
                type: "trimFront",
                value: "/"
              }
            ]
          }
        ],
      }
    ],
    "result": ""
  },
  {
    "eventType": "RepairTask",
    "relevantEventsType": [
    ],
    "result": "raw.Action"
  },
];
