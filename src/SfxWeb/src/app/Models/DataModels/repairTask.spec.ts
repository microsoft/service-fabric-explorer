import { RepairTask } from "./repairTask";
import { IRawRepairTask } from '../RawDataTypes';

    
describe('RepairTask', () => {


    let testData: IRawRepairTask;
  
    beforeEach((() => {
        testData =   {
            "TaskId": "Azure/PlatformUpdate/21996579-9f27-4fd9-bfab-2ace650d9997/2/4153",
            "Version": "132281309100816959",
            "Description": "",
            "State": "Completed",
            "Flags": 0,
            "Action": "System.Azure.Job.PlatformUpdate",
            "Target": {
                "Kind": "Node",
                "NodeNames": [
                    "_SFRole0_2"
                ]
            },
            "Executor": "fabric:/System/InfrastructureService/SFRole0",
            "ExecutorData": "{\r\n  \"JobId\": \"21996579-9f27-4fd9-bfab-2ace650d9997\",\r\n  \"UD\": 2,\r\n  \"StepId\": \"_SFRole0_2\"\r\n}",
            "Impact": {
                "Kind": "Node",
                "NodeImpactList": []
            },
            "ResultStatus": "Succeeded",
            "ResultCode": 0,
            "ResultDetails": "Job step completed with status Executed",
            "History": {
                "CreatedUtcTimestamp": "2020-03-08T08:48:30.081Z",
                "ClaimedUtcTimestamp": "2020-03-08T08:48:30.081Z",
                "PreparingUtcTimestamp": "2020-03-08T08:48:30.081Z",
                "ApprovedUtcTimestamp": "2020-03-08T08:48:30.253Z",
                "ExecutingUtcTimestamp": "2020-03-08T08:48:45.183Z",
                "RestoringUtcTimestamp": "2020-03-08T09:40:18.906Z",
                "CompletedUtcTimestamp": "2020-03-08T09:40:19.079Z",
                "PreparingHealthCheckStartUtcTimestamp": "2020-03-08T08:48:30.159Z",
                "PreparingHealthCheckEndUtcTimestamp": "2020-03-08T08:48:30.191Z",
                "RestoringHealthCheckStartUtcTimestamp": "2020-03-08T09:40:18.999Z",
                "RestoringHealthCheckEndUtcTimestamp": "2020-03-08T09:40:19.016Z"
            },
            "PreparingHealthCheckState": "Skipped",
            "RestoringHealthCheckState": "Skipped",
            "PerformPreparingHealthCheck": false,
            "PerformRestoringHealthCheck": false
          }
    }));

    fit('validate complete repairTask', () => {
      const task = new RepairTask(testData)

      expect(task.couldParseExecutorData).toBe(true);
      expect(task.impactedNodes.length).toBe(0);
      expect(task.inProgress).toBe(false);
    });

    fit('validate in progress repairTask', () => {
        testData.State = "Executing";
        testData.Impact.NodeImpactList = [
            {
                "NodeName": "_NodeType0_6",
                "ImpactLevel": 2
            }
        ]
        const task = new RepairTask(testData)
  
        expect(task.couldParseExecutorData).toBe(true);
        expect(task.impactedNodes).toEqual(["_NodeType0_6"]);
        expect(task.inProgress).toBe(true);
      });
  });

