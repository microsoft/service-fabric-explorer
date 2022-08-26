import { IConcurrentEventsConfig, IRelevantEventsConfig } from "./rcaEngine";

const APEmap = {
  "Deactivating application as application contents have changed.": "Stopping code package as application manifest contents have changes due to an app upgrade.",
  "Deactivating since updating application version failed as part of upgrade.": "Stopping code package as upgrade failed.",
  "Deactivating as Restart-DeployedCodePackage API invoked.": "Restarting code package as Restart-DeployedCodePackage API was invoked.",
  "Deactivating becasue Fabric Node is closing.": "Stopping code package as SF node is shutting down.",
  "Deactivating since no replica hosted.": "Stopping code package as process is idle and no replica/instance is hosted inside.",
  "Deactivating since service package minor version change failed.": "Stopping code package as upgrade failed.",
  "Deactivating since either RG changed, or upgrade is force restart, or major version changed.": "Stopping code package as RG changed or force restart was specified during application upgrade.",
  "Deactivating as part of request from Activator CodePackage.": "Stopping code package on demand from activator code package.",
  "Deactivating as part of upgrade since code package changed.": "Stopping code package as the code package contents have changed due to an app upgrade.",
}

const forceKillPrefix = "Aborting since deactivation failed. ";

const generateConfig = (text: string, intendedDescription: string, expectedPrefix: string = ""): IRelevantEventsConfig => {
  return  {
    eventType: "self",
    propertyMappings: [
      {
        sourceProperty: "raw.ExitReason",
        targetProperty: text,
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
    result: `Expected Termination ${expectedPrefix}- ${intendedDescription}`,
  }
}

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

Object.keys(APEmap).forEach(key => {
  APE.push(generateConfig(key, APEmap[key]));
  APE.push(generateConfig(forceKillPrefix + key, APEmap[key], 'but not graceful shutdown'));
})


console.log(APE);

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
