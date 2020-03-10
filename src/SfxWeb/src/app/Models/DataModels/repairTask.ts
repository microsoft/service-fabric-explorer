import { IRawRepairTask } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

export enum RepairTaskStateFilter {
    Created = 1,
    Claimed = 2,
    Preparing = 4,
    Approved = 8,
    Executing = 16,
    Restoring = 32,
    Completed = 64
}

export class RepairTask {
    // Initially keep additional details collapsed.
    public isSecondRowCollapsed: boolean = true;
    public impactedNodes: string[] = [];
    public createdAt: string = "";
    //following 3 properties are set if possible from parsing ExecutorData
    public jobId: string = "";
    public UD: string = "";
    public stepId: string = "";

    public couldParseExecutorData: boolean = false;

    constructor(public raw: IRawRepairTask) {
        if(this.raw.Impact) {
            this.impactedNodes = this.raw.Impact.NodeImpactList.map(node => node.NodeName);
        }

        this.createdAt = TimeUtils.windowsFileTime(this.raw.History.CreatedUtcTimestamp)

        if(this.raw.Executor && this.raw.Executor.startsWith("fabric:/System/InfrastructureService")) {
            /*
            example Data
                "{
                "JobId": "e2ba8ad8-f216-4ef9-8890-7872a2362dc3",
                "UD": 4,
                "StepId": "_NodeType0_4"
                }"
            */
            try {
                const data = JSON.parse(this.raw.ExecutorData);
                this.jobId = data.JobId;
                this.UD = data.UD;
                this.stepId = data.StepId;
                this.couldParseExecutorData = true;
            } catch(e) {
                this.couldParseExecutorData = false;
            }
        }
    }

    public get state(): string {
        return RepairTaskStateFilter[this.raw.State];
    }

}


/*
state filter
1 - Created
2 - Claimed
4 - Preparing
8 - Approved
16 - Executing
32 - Restoring
64 - Completed
*/