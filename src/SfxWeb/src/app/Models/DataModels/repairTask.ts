import { IRawRepairTask } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

export interface IRepairTaskHistoryPhase {
    timestamp: string; 
    phase: string;
    duration: string;
}
export class RepairTask {
    public static NonStartedTimeStamp = "0001-01-01T00:00:00.000Z";

    // Initially keep additional details collapsed.
    public isSecondRowCollapsed: boolean = true;
    public impactedNodes: string[] = [];
    public history: IRepairTaskHistoryPhase[] = [];
    public createdAt: string = "";

    public couldParseExecutorData: boolean = false;
    public inProgress: boolean = true;

    public duration: number;
    public displayDuration: string;

    public executorData: any;

    constructor(public raw: IRawRepairTask) {
        if(this.raw.Impact) {
            this.impactedNodes = this.raw.Impact.NodeImpactList.map(node => node.NodeName);
        }
        this.createdAt = new Date(this.raw.History.CreatedUtcTimestamp).toLocaleString();
        this.inProgress = this.raw.State !== "Completed";
        
        const start = new Date(this.createdAt).getTime();
        if(this.inProgress) {
            const now = new Date().getTime();
            this.duration = now - start; 
        }else{
            this.duration = new Date(this.raw.History.CompletedUtcTimestamp).getTime() - start;
        }
        this.displayDuration = TimeUtils.formatDurationAsAspNetTimespan(this.duration);

        try {
            this.executorData = JSON.parse(this.raw.ExecutorData);

            this.couldParseExecutorData = true;
        } catch(e) {
            console.log(e)
            this.couldParseExecutorData = false;
        }

        const sortedHistory = [
            { timestamp: this.raw.History.PreparingUtcTimestamp, phase: "Preparing" },
            { timestamp: this.raw.History.ClaimedUtcTimestamp, phase: "Claimed" },
            { timestamp: this.raw.History.CreatedUtcTimestamp, phase: "Created" },
            { timestamp: this.raw.History.PreparingHealthCheckStartUtcTimestamp, phase: "Preparing Health Check start" },
            { timestamp: this.raw.History.PreparingHealthCheckEndUtcTimestamp, phase: "Preparing Health check End" },
            { timestamp: this.raw.History.ApprovedUtcTimestamp, phase: "Approved" },
            { timestamp: this.raw.History.ExecutingUtcTimestamp, phase: "Executing" },
            { timestamp: this.raw.History.RestoringUtcTimestamp, phase: "Restoing" },
            { timestamp: this.raw.History.RestoringHealthCheckStartUtcTimestamp, phase: "Restoring health check start" },
            { timestamp: this.raw.History.RestoringHealthCheckEndUtcTimestamp, phase: "Restoring Health check end" },
            { timestamp: this.raw.History.CompletedUtcTimestamp, phase: "Completed" },
        ]
        this.history = sortedHistory.map( (phase, index, arr) => {
            let duration = "not started";
            if(index < (arr.length-1 ) && arr[index + 1].timestamp !== RepairTask.NonStartedTimeStamp) {
                const phaseDuration = new Date(arr[index + 1].timestamp).getTime() - new Date(phase.timestamp).getTime()
                duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration)
            }

            //handle completed phase which does not have a duration
            if(index === (arr.length - 1)) {
                duration = ""
            }

            return {
                ...phase,
                duration
            }
        })
    }

    /*
    WIll use created at timestamp instead of 
    */
    public get startTime(): Date {
        return new Date(this.raw.History.ExecutingUtcTimestamp === RepairTask.NonStartedTimeStamp ? this.raw.History.CreatedUtcTimestamp : 
                                                                                          this.raw.History.ExecutingUtcTimestamp)
    }

}
