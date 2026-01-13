import { RepairTask, Status } from './repairTask';
import { IRawNodeRepairImpactDescription, IRawRepairTask } from '../RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { of } from 'rxjs';
import { Node } from './Node';
import { ClusterHealth } from './Cluster';


describe('RepairTask', () => {

    const dataService = {} as DataService;
    let testData: IRawRepairTask;

    beforeEach((() => {
        testData = {
            TaskId: 'Azure/PlatformUpdate/21996579-9f27-4fd9-bfab-2ace650d9997/2/4153',
            Version: '132281309100816959',
            Description: '',
            State: 'Completed',
            Flags: 0,
            Action: 'System.Azure.Job.PlatformUpdate',
            Target: {
                Kind: 'Node',
                NodeNames: [
                    '_SFRole0_2'
                ]
            },
            Executor: 'fabric:/System/InfrastructureService/SFRole0',
            ExecutorData: '{\r\n  "JobId": "21996579-9f27-4fd9-bfab-2ace650d9997",\r\n  "UD": 2,\r\n  "StepId": "_SFRole0_2"\r\n}',
            Impact: {
                Kind: 'Node',
                NodeImpactList: []
            },
            ResultStatus: 'Succeeded',
            ResultCode: 0,
            ResultDetails: 'Job step completed with status Executed',
            History: {
                CreatedUtcTimestamp: '2020-03-08T08:48:30.081Z',
                ClaimedUtcTimestamp: '2020-03-08T08:48:30.081Z',
                PreparingUtcTimestamp: '2020-03-08T08:48:30.081Z',
                ApprovedUtcTimestamp: '2020-03-08T08:48:30.253Z',
                ExecutingUtcTimestamp: '2020-03-08T08:48:45.183Z',
                RestoringUtcTimestamp: '2020-03-08T09:40:18.906Z',
                CompletedUtcTimestamp: '2020-03-08T09:40:19.079Z',
                PreparingHealthCheckStartUtcTimestamp: '2020-03-08T08:48:30.159Z',
                PreparingHealthCheckEndUtcTimestamp: '2020-03-08T08:48:30.191Z',
                RestoringHealthCheckStartUtcTimestamp: '2020-03-08T09:40:18.999Z',
                RestoringHealthCheckEndUtcTimestamp: '2020-03-08T09:40:19.016Z'
            },
            PreparingHealthCheckState: 'Skipped',
            RestoringHealthCheckState: 'Skipped',
            PerformPreparingHealthCheck: false,
            PerformRestoringHealthCheck: false
        };
    }));

    fit('validate complete repairTask', () => {
        const task = new RepairTask(dataService, testData);

        expect(task.couldParseExecutorData).toBe(true);
        expect(task.impactedNodes.length).toBe(0);
        expect(task.inProgress).toBe(false);
        expect(task.historyPhases.length).toBe(3);

        expect(task.historyPhases[0].startCollapsed).toBeTruthy();
        expect(task.historyPhases[0].status).toBe('Done');

        expect(task.historyPhases[1].startCollapsed).toBeTruthy();
        expect(task.historyPhases[1].status).toBe('Done');

        expect(task.historyPhases[2].status).toBe('Done');
        expect(task.historyPhases[2].startCollapsed).toBeTruthy();
    });

    fit('validate in progress repairTask', () => {
        testData.State = 'Executing';
        (testData.Impact as IRawNodeRepairImpactDescription).NodeImpactList = [
            {
                NodeName: '_NodeType0_6',
                ImpactLevel: 2
            }
        ];
        const task = new RepairTask(dataService, testData);

        expect(task.couldParseExecutorData).toBe(true);
        expect(task.impactedNodes).toEqual(['_NodeType0_6']);
        expect(task.inProgress).toBe(true);
    });

    fit('validate external repair impact', () => {
        testData.State = 'Executing';
        testData.Impact = {
            Kind: 'External',
            ExternalImpactInfo: {
                ImpactLevel: 'High'
            }
        };
        const task = new RepairTask(dataService, testData);

        expect(task.couldParseExecutorData).toBe(true);
        expect(task.inProgress).toBe(true);
        expect(task.impactedNodes).toEqual([]);
    });

    fit('validate repairTask history in executing', () => {
        testData.State = 'Executing';
        testData.History = {
            CreatedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ClaimedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            PreparingUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ApprovedUtcTimestamp: '2020-07-17T03:17:33.530Z',
            ExecutingUtcTimestamp: '2020-07-17T03:17:48.437Z',
            RestoringUtcTimestamp: '0001-01-01T00:00:00.000Z',
            CompletedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            PreparingHealthCheckStartUtcTimestamp: '2020-07-17T03:17:33.420Z',
            PreparingHealthCheckEndUtcTimestamp: '2020-07-17T03:17:33.467Z',
            RestoringHealthCheckStartUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z'
        };
        const dateRef = new Date('2020-07-17T04:17:48.437Z');
        const task = new RepairTask(dataService, testData, dateRef);

        expect(task.inProgress).toBe(true);
        expect(task.history).toContain({
            name: 'Executing',
            timestamp: '2020-07-17T03:17:48.437Z',
            status: Status.inProgress,
            textRight: TimeUtils.formatDurationAsAspNetTimespan(60 * 60 * 1000),
            duration: TimeUtils.formatDurationAsAspNetTimespan(60 * 60 * 1000),
            durationMilliseconds: 60 * 60 * 1000,
        });

        expect(task.historyPhases[0].startCollapsed).toBeTruthy();
        expect(task.historyPhases[0].status).toBe('Done');

        expect(task.historyPhases[1].startCollapsed).toBeFalsy();
        expect(task.historyPhases[1].status).toBe('In Progress');


        expect(task.historyPhases[2].durationMilliseconds).toBe(0);
        expect(task.historyPhases[2].status).toBe('Not Started');
        expect(task.historyPhases[2].startCollapsed).toBeTruthy();
    });

    describe("stuck jobs", () => {
      fit("long executing", () => {
        testData.State = 'Executing';
        testData.History = {
            CreatedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ClaimedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            PreparingUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ApprovedUtcTimestamp: '2020-07-17T03:17:33.530Z',
            ExecutingUtcTimestamp: '2020-07-17T03:17:48.437Z',
            RestoringUtcTimestamp: '0001-01-01T00:00:00.000Z',
            CompletedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            PreparingHealthCheckStartUtcTimestamp: '2020-07-17T03:17:33.420Z',
            PreparingHealthCheckEndUtcTimestamp: '2020-07-17T03:17:33.467Z',
            RestoringHealthCheckStartUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z'
        };
        const task = new RepairTask(dataService, testData);
        expect(task.concerningJobInfo.type).toBe("longExecuting");
      })

      fit("seed node", () => {
        dataService.getNode = (name, refresh, messegage) => {
          return of({ raw: {
            NodeDeactivationInfo: {
              PendingSafetyChecks: [
                {
                  SafetyCheck: {
                    Kind: 'EnsureSeedNodeQuorum'
                  }
                }
              ]
            }
          } } as Node)
        }

        testData.State = 'Preparing';
        testData.History = {
            CreatedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ClaimedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            PreparingUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ApprovedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            ExecutingUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringUtcTimestamp: '0001-01-01T00:00:00.000Z',
            CompletedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            PreparingHealthCheckStartUtcTimestamp: '2020-07-17T03:17:33.420Z',
            PreparingHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckStartUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z'
        };
        (testData.Impact as IRawNodeRepairImpactDescription).NodeImpactList = [{
          NodeName: 'testnode'
        }]
        const task = new RepairTask(dataService, testData);
        expect(task.concerningJobInfo.type).toBe("seedNode");
      })

      fit("health check (not seed node)", () => {
        dataService.getNode = (name, refresh, messegage) => {
          return of({ raw: {
            NodeDeactivationInfo: {
              PendingSafetyChecks: [
                {
                  SafetyCheck: {
                    Kind: 'EnsureAvailability'
                  }
                }
              ]
            }
          } } as Node)
        }

        testData.State = 'Preparing';
        testData.History = {
            CreatedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ClaimedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            PreparingUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ApprovedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            ExecutingUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringUtcTimestamp: '0001-01-01T00:00:00.000Z',
            CompletedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            PreparingHealthCheckStartUtcTimestamp: '2020-07-17T03:17:33.420Z',
            PreparingHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckStartUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z'
        };
        (testData.Impact as IRawNodeRepairImpactDescription).NodeImpactList = [{
          NodeName: 'testnode'
        }]
        const task = new RepairTask(dataService, testData);
        expect(task.concerningJobInfo.type).toBe("safetychecks");
      })

      fit("stuck preparing", () => {
        dataService.getDefaultClusterHealth = () => {
          return of({
            raw: {
              AggregatedHealthState: 'Warning'
            }
          } as ClusterHealth)
        }

        testData.State = 'Preparing';
        testData.History = {
            CreatedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ClaimedUtcTimestamp: '2020-07-17T03:17:33.342Z',
            PreparingUtcTimestamp: '2020-07-17T03:17:33.342Z',
            ApprovedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            ExecutingUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringUtcTimestamp: '0001-01-01T00:00:00.000Z',
            CompletedUtcTimestamp: '0001-01-01T00:00:00.000Z',
            PreparingHealthCheckStartUtcTimestamp: '2020-07-17T03:17:33.420Z',
            PreparingHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckStartUtcTimestamp: '0001-01-01T00:00:00.000Z',
            RestoringHealthCheckEndUtcTimestamp: '0001-01-01T00:00:00.000Z'
        };

        const task = new RepairTask(dataService, testData);
        expect(task.concerningJobInfo.type).toBe("clusterhealthcheck");
      })

    })

    describe("repair task targeting and impact methods", () => {
      fit("isNodeTargeted returns true for Node target", () => {
        testData.Target = {
          Kind: 'Node',
          NodeNames: ['_nt_0', '_nt_1']
        };
        const task = new RepairTask(dataService, testData);
        expect(task.isNodeTargeted()).toBe(true);
      });

      fit("isNodeTargeted returns false for External target", () => {
        testData.Target = {
          Kind: 'External'
        };
        const task = new RepairTask(dataService, testData);
        expect(task.isNodeTargeted()).toBe(false);
      });

      fit("hasNodeImpact returns true for Node impact with NodeImpactList", () => {
        testData.Impact = {
          Kind: 'Node',
          NodeImpactList: [
            { NodeName: '_nt_0', ImpactLevel: 'Restart' }
          ]
        };
        const task = new RepairTask(dataService, testData);
        expect(task.hasNodeImpact()).toBe(true);
      });

      fit("hasNodeImpact returns false for External impact", () => {
        testData.Impact = {
          Kind: 'External',
          ExternalImpactInfo: {
            ImpactLevel: 'High'
          }
        };
        const task = new RepairTask(dataService, testData);
        expect(task.hasNodeImpact()).toBe(false);
      });

      fit("hasNodeImpact returns false for Node impact without NodeImpactList", () => {
        testData.Impact = {
          Kind: 'Node',
          NodeImpactList: null
        };
        const task = new RepairTask(dataService, testData);
        expect(task.hasNodeImpact()).toBe(false);
      });

      fit("getTargetNodeNames returns node names for Node target", () => {
        testData.Target = {
          Kind: 'Node',
          NodeNames: ['_nt_0', '_nt_1', '_nt_2']
        };
        const task = new RepairTask(dataService, testData);
        expect(task.getTargetNodeNames()).toEqual(['_nt_0', '_nt_1', '_nt_2']);
      });

      fit("getTargetNodeNames returns empty array for External target", () => {
        testData.Target = {
          Kind: 'External'
        };
        const task = new RepairTask(dataService, testData);
        expect(task.getTargetNodeNames()).toEqual([]);
      });

      fit("getTargetNodeNames returns empty array when NodeNames is undefined", () => {
        testData.Target = {
          Kind: 'Node',
          NodeNames: undefined
        };
        const task = new RepairTask(dataService, testData);
        expect(task.getTargetNodeNames()).toEqual([]);
      });

      fit("getNodeImpactList returns impact list for Node impact", () => {
        const impactList = [
          { NodeName: '_nt_0', ImpactLevel: 'Restart' },
          { NodeName: '_nt_1', ImpactLevel: 'RemoveNode' }
        ];
        testData.Impact = {
          Kind: 'Node',
          NodeImpactList: impactList
        };
        const task = new RepairTask(dataService, testData);
        expect(task.getNodeImpactList()).toEqual(impactList);
      });

      fit("getNodeImpactList returns empty array for External impact", () => {
        testData.Impact = {
          Kind: 'External',
          ExternalImpactInfo: {
            ImpactLevel: 'RestartNode'
          }
        };
        const task = new RepairTask(dataService, testData);
        expect(task.getNodeImpactList()).toEqual([]);
      });

      fit("affectsNode returns true when node is in target", () => {
        testData.Target = {
          Kind: 'Node',
          NodeNames: ['_nt_0', '_nt_1']
        };
        testData.Impact = {
          Kind: 'Node',
          NodeImpactList: []
        };
        const task = new RepairTask(dataService, testData);
        
        expect(task.affectsNode('_nt_0')).toBe(true);
        expect(task.affectsNode('_nt_1')).toBe(true);
      });

      fit("affectsNode returns true when node is in impacted nodes", () => {
        testData.Target = {
          Kind: 'Node',
          NodeNames: ['_nt_0']
        };
        testData.Impact = {
          Kind: 'Node',
          NodeImpactList: [
            { NodeName: '_nt_1', ImpactLevel: 3 }
          ]
        };
        const task = new RepairTask(dataService, testData);
        expect(task.affectsNode('_nt_1')).toBe(true);
      });

      fit("affectsNode returns false when node is not affected", () => {
        testData.Target = {
          Kind: 'Node',
          NodeNames: ['_nt_0']
        };
        testData.Impact = {
          Kind: 'Node',
          NodeImpactList: [
            { NodeName: '_nt_1', ImpactLevel: 3 }
          ]
        };
        const task = new RepairTask(dataService, testData);
        expect(task.affectsNode('_nt_2')).toBe(false);
      });

      fit("affectsNode returns false for External repair task", () => {
        testData.Target = {
          Kind: 'External'
        };
        testData.Impact = {
          Kind: 'External',
          ExternalImpactInfo: {
            ImpactLevel: 'RestartNode'
          }
        };
        const task = new RepairTask(dataService, testData);
        expect(task.affectsNode('_nt_0')).toBe(false);
      });
    });
});

