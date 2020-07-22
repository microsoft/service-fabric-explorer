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

    public couldParseExecutorData: boolean = false;
    public inProgress: boolean = true;

    public duration: number;

    public executorData: any;

    constructor(public raw: IRawRepairTask) {
        if(this.raw.Impact) {
            this.impactedNodes = this.raw.Impact.NodeImpactList.map(node => node.NodeName);
        }
        this.raw.History.PreparingHealthCheckEndUtcTimestamp = "0001-01-01T00:00:00.000Z";
        this.createdAt = new Date(this.raw.History.CreatedUtcTimestamp).toLocaleString();
        this.inProgress = this.raw.State !== "Completed";
        
        const start = new Date(this.createdAt).getTime();
        if(this.inProgress) {
            this.duration = new Date().getTime(); - start; 
        }else{
            this.duration = new Date(this.raw.History.CompletedUtcTimestamp).getTime() - start;
        }

        try {
            this.executorData = JSON.parse(this.raw.ExecutorData);

            this.couldParseExecutorData = true;
        } catch(e) {
            console.log(e)
            this.couldParseExecutorData = false;
        }
    }

    /*
    WIll use created at timestamp instead of 
    */
    public get startTime(): Date {
        return new Date(this.raw.History.ExecutingUtcTimestamp === "0001-01-01T00:00:00.000Z" ? this.raw.History.CreatedUtcTimestamp : 
                                                                                          this.raw.History.ExecutingUtcTimestamp)
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