import { IRawRepairTask } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

export interface IRepairTaskHistoryPhase {
    timestamp: string;
    status: string;
    phase: string;
    duration: string;
    cssClass: string;
    durationMilliseconds: number;
}

export interface IRepairTaskPhase {
    name: string;
    status: string;
    statusCss: string;
    duration: string;
    durationMilliseconds: number;
    phases: IRepairTaskHistoryPhase[];
    startCollapsed: number;
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

    public HistoryPhases: IRepairTaskPhase[];

    public executorData: any;

    constructor(public raw: IRawRepairTask, dateRef: Date = new Date()) {
        if(this.raw.Impact) {
            this.impactedNodes = this.raw.Impact.NodeImpactList.map(node => node.NodeName);
        }
        this.createdAt = new Date(this.raw.History.CreatedUtcTimestamp).toLocaleString();
        this.inProgress = this.raw.State !== "Completed";
        
        const start = new Date(this.createdAt).getTime();
        if(this.inProgress) {
            const now = dateRef.getTime();
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
            { timestamp: this.raw.History.RestoringUtcTimestamp, phase: "Restoring" },
            { timestamp: this.raw.History.RestoringHealthCheckStartUtcTimestamp, phase: "Restoring health check start" },
            { timestamp: this.raw.History.RestoringHealthCheckEndUtcTimestamp, phase: "Restoring Health check end" },
            { timestamp: this.raw.History.CompletedUtcTimestamp, phase: "Completed" },
        ]
        this.history = sortedHistory.map( (phase, index, arr) => {
            let duration = "";
            let status = "Not Started";
            let cssClass = "gray";
            let phaseDuration = 0;
            if(index < (arr.length-1 )) {
                const nextPhase = arr[index + 1];

                //if the next phase has a timestamp then this phase is finished
                //otherwise if this phase has a timestamp it would be the active one 
                if(nextPhase.timestamp !== RepairTask.NonStartedTimeStamp){
                    phaseDuration = new Date(nextPhase.timestamp).getTime() - new Date(phase.timestamp).getTime();
                    duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration);
                    cssClass = "green";
                    status = "Done";
                }else if(phase.timestamp !== RepairTask.NonStartedTimeStamp ){
                    phaseDuration = dateRef.getTime() - new Date(phase.timestamp).getTime();
                    duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration);
                    cssClass = "blue";
                    status = "In Progress"
                }

            }

            //handle completed phase which does not have a duration
            if(index === (arr.length - 1)) {
                duration = "";
            
                if(phase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    cssClass = "done";
                    status = "Done";
                }
            }

            
            

            return {
                ...phase,
                timestamp: phase.timestamp === RepairTask.NonStartedTimeStamp ? "" : phase.timestamp,
                duration,
                cssClass: 'repair-' + cssClass,
                durationMilliseconds: phaseDuration,
                status
            }
        });

        this.HistoryPhases = [
            this.GenerateHistoryPhase("Preparing", this.history.slice(0, 5)),
            this.GenerateHistoryPhase("Executing", [this.history[6]]),
            this.GenerateHistoryPhase("Restoring", this.history.slice(7))
        ]

    }

    /*
    WIll use created at timestamp instead of 
    */
    public get startTime(): Date {
        return new Date(this.raw.History.ExecutingUtcTimestamp === RepairTask.NonStartedTimeStamp ? this.raw.History.CreatedUtcTimestamp : 
                                                                                          this.raw.History.ExecutingUtcTimestamp)
    }


    private GenerateHistoryPhase(name: string, phases: IRepairTaskHistoryPhase[]): IRepairTaskPhase {

        let duration = 0;
        let status =  -1;

        phases.forEach( (phase, index) => {
            duration += phase.durationMilliseconds;

            if( phase.cssClass === "repair-blue") {
                status = 0;
            }

            if( (index + 1) === phases.length) {
                if(phase.cssClass === "repair-green") {
                    status = 1;
                } 
            }
        })

        let statusText;
        let statusCss;
        let startCollapsed;
        switch (status) {
            case 1:
                statusCss = "repair-green";
                statusText = "Done";
                startCollapsed = true;
                break;
            case 0:
                statusCss = "repair-blue";
                statusText = "In Progress";
                startCollapsed = false;
                break;
    
            default:
                statusCss = "repair-gray";
                statusText = "Not started";
                startCollapsed = true;
                break;
        }

        return {
            name,
            status: statusText,
            statusCss,
            duration : TimeUtils.formatDurationAsAspNetTimespan(duration),
            durationMilliseconds: duration,
            phases,
            startCollapsed
        }
    }

}
