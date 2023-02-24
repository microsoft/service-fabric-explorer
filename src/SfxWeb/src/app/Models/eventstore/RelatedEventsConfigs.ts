import { IConcurrentEventsConfig, IRelevantEventsConfig } from "./rcaEngine";
import { IDiffAnalysis } from "./rcaEngineConfigurations";

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
        source: {
          property: "raw.ExitReason",
          transforms: [{
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
        },
        target: {
          staticValue: text
        },
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
        source: {
          property: "raw.NodeName"
        },
        target: {
          property: "nodeName"
        }
      },
      {
        source: {
          property: "raw.NodeInstance"
        },
        target: {
          property: "raw.NodeInstance"
        }
      }
    ],
  },
  {
    eventType: "self",
    propertyMappings: [
      {
        source: {
          property: "raw.ExitCode"
        },
        target: {
          staticValue: 7147
        }
      },

      {
        source: {
          property: "raw.ExitReason",
          transforms: [{
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
        },
        target: {
          staticValue: " Restarting the container because HEALTHCHECK for Docker container"
        }
      },
    ],
    result: 'Expected Termination - restart due to configured container healthcheck failure.',
  },
  {
    eventType: "self",
    propertyMappings: [
      {
        source: {
          property: "raw.ExitCode",
        },
        target: {
          staticValue: 7147
        }
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
        source: {
          property: "raw.ExitCode",
        },
        target: {
          staticValue: 3221225786
        }
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
        source: {
          property: "raw.ExitCode"
        },
        target: {
          staticValue: 7148
        }
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
        source: {
          property: "raw.UnexpectedTermination"
        },
        target: {
          staticValue: true
        }
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
            source: {
              property: "nodeName"
            },
            target: {
              property: "nodeName"
            }
          },
          {
            source: {
              property: "raw.NodeInstance"
            },
            target: {
              property: "raw.NodeInstance"
            }
          },
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
            source: {
              property: "raw.BatchId",
              transforms: [
                {
                  type: "trimFront",
                  value: "/"
                }
              ]
            },
            target: {
              property: "raw.TaskId"
            }
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
  {
    "eventType": "PartitionReconfigurationStarted",
    "relevantEventsType": [
      {
        eventType: "PartitionReconfigured",
        propertyMappings: [
          {
            source: {
              property: "eventProperties.ActivityId",
            },
            target: {
              property: "eventProperties.ActivityId"
            }
          }
        ],
      }
    ],
    "result": "eventProperties.NewPrimaryNodeName",
    "resultTransform": [
      {
        type: "prefix",
        value: "New Primary Node Name is "
      }
    ]
  },
  {
    "eventType": "PartitionReconfigured",
    "relevantEventsType": [
    ],
    "result": "eventProperties.ReconfigType"
  },
  {
    "eventType": "ClusterNewHealthReport",
    "relevantEventsType": [
      {
        eventType: "NodeClosed",
        propertyMappings: [
          {
            source: {
              property: "eventProperties.Description",
              transforms: [
                {
                  type: "trimFront",
                  value: ":"
                },
                {
                  type: "trimFront",
                  value: ":"
                },
                {
                  type: "trimBack",
                  value: "("
                },
                {
                  type: "trimWhiteSpace"
                },
              ]
            },
            target: {
              property: "nodeName",
            }
          },
          {
            source: {
              property: "eventProperties.Description",
              transforms: [
                {
                  type: "trimFront",
                  value: "("
                },
                {
                  type: "trimFront",
                  value: "("
                },
                {
                  type: "trimBack",
                  value: ")"
                },
                {
                  type: "trimWhiteSpace"
                },
              ]
            },
            target: {
              property: "raw.NodeId",
            }
          }
        ],
      },
    ],
    result: "eventProperties.Description",
    resultTransform: [
      {
        type: "trimFront",
        value: ":"
      },
      {
        type: "trimFront",
        value: ":"
      },
      {
        type: "trimBack",
        value: "("
      },
      {
        type: "trimWhiteSpace"
      },
    ]
  },
  {
    "eventType": "NodeClosed",
    "relevantEventsType": [
      {
        eventType: "NodeDown",
        propertyMappings: [
          {
            source: { property: "nodeName" },
            target: { property: "nodeName" },
          },
          {
            source: { property: "raw.NodeInstance" },
            target: { property: "raw.NodeInstance" },
          }
        ],
      },
    ],
    result: ""
  }
];


export const differConfigs: IDiffAnalysis[] = [
  {
    type: 'diff',
    name: 'replication',
    group: 'Replica placement',
    eventType: 'PartitionReconfigurationStarted',
    properties: [
      {
        delimiter: ' ',
        property: 'raw.NewPrimaryNodeName',
        name: 'primary',
        extendToEnd: true,
        displayTransforms: [
          {
            type: "prefix",
            value: "primary"
          },
        ],
        transforms: [
          {
            type: "trimWhiteSpace"
          },
        ]
      },
      {
        delimiter: ' ',
        property: 'raw.NewSecondaryNodeNames',
        name: 'secondary',
        extendToEnd: true,
        displayTransforms: [
          {
            type: "prefix",
            value: "secondary"
          },
        ],
        transforms: [
          {
            type: "trimWhiteSpace"
          },
          {
            type: "nullIfEmptyString"
          },
        ]
      },

      {
        delimiter: ' ',
        property: 'raw.OldPrimaryNodeName',
        name: 'primary',
        extendFromStart: true,
        firstOnlyEvent: true,
        displayTransforms: [
          {
            type: "prefix",
            value: "primary"
          },
        ],
        transforms: [
          {
            type: "trimWhiteSpace"
          },
        ]
      },
      {
        delimiter: ' ',
        property: 'raw.OldSecondaryNodeNames',
        name: 'secondary',
        extendFromStart: true,
        firstOnlyEvent: true,
        displayTransforms: [
          {
            type: "prefix",
            value: "secondary"
          },
        ],
        transforms: [
          {
            type: "trimWhiteSpace"
          },
          {
            type: "nullIfEmptyString"
          },
        ]
      }
    ],
    propertyMappings: []
  }
]
