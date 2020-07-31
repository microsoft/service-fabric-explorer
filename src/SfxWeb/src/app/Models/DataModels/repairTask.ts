import { IRawRepairTask } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
export interface IRepairTaskHistoryPhase {
    timestamp: string;
    phase: string;
    duration: string;
    durationMilliseconds: number;
    displayInfo: IDisplayStatus;
}

export interface IDisplayStatus {
    badgeIcon: string;
    status: String;
    statusCss: string;
}

export interface IRepairTaskPhase {
    name: string;
    duration: string;
    durationMilliseconds: number;
    phases: IRepairTaskHistoryPhase[];
    startCollapsed: number;
    status: string;
    statusCss: string;
}

export const FinishedStatus: IDisplayStatus = {
    badgeIcon: "mif-done",
    status: "This step is Finished",
    statusCss: "repair-green"
}


export const InProgressStatus: IDisplayStatus = {
    badgeIcon: "mif-spinner4",
    status: "This step is in progress",
    statusCss: "repair-blue"
}


export const NotStartedStatus: IDisplayStatus = {
    badgeIcon: "",
    status: "This step is not started",
    statusCss: "repair-gray"
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

    public historyPhases: IRepairTaskPhase[];

    public executorData: any;

    constructor(public raw: IRawRepairTask, private dateRef: Date = new Date()) {
        if (this.raw.Impact) {
            this.impactedNodes = this.raw.Impact.NodeImpactList.map(node => node.NodeName);
        }
        this.createdAt = new Date(this.raw.History.CreatedUtcTimestamp).toLocaleString();
        this.inProgress = this.raw.State !== "Completed";

        const start = new Date(this.createdAt).getTime();
        if (this.inProgress) {
            const now = dateRef.getTime();
            this.duration = now - start;
        } else {
            this.duration = new Date(this.raw.History.CompletedUtcTimestamp).getTime() - start;
        }
        this.displayDuration = TimeUtils.formatDurationAsAspNetTimespan(this.duration);

        try {
            this.executorData = JSON.parse(this.raw.ExecutorData);

            this.couldParseExecutorData = true;
        } catch (e) {
            console.log(e)
            this.couldParseExecutorData = false;
        }

        this.parseHistory();

        this.historyPhases = [
            this.generateHistoryPhase("Preparing", this.history.slice(0, 5)),
            this.generateHistoryPhase("Executing", [this.history[6]]),
            this.generateHistoryPhase("Restoring", this.history.slice(7))
        ]

    }

    /*
    WIll use created at timestamp instead of 
    */
    public get startTime(): Date {
        return new Date(this.raw.History.ExecutingUtcTimestamp === RepairTask.NonStartedTimeStamp ? this.raw.History.CreatedUtcTimestamp :
            this.raw.History.ExecutingUtcTimestamp)
    }

    private parseHistory() {
        const history = [
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
        ];

        this.history = history.map((phase, index) => {
            let duration = "";
            let displayInfo: IDisplayStatus = NotStartedStatus;
            let phaseDuration = 0;

            if (index < (history.length - 1)) {
                const nextPhase = history[index + 1];

                //if the next phase has a timestamp then this phase is finished
                //otherwise if this phase has a timestamp it would be the active one 
                if (nextPhase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    phaseDuration = new Date(nextPhase.timestamp).getTime() - new Date(phase.timestamp).getTime();
                    duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration);
                    displayInfo = FinishedStatus;
                } else if (phase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    phaseDuration = this.dateRef.getTime() - new Date(phase.timestamp).getTime();
                    duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration);
                    displayInfo = InProgressStatus
                }
            }

            //handle completed phase which does not have a duration
            if (index === (history.length - 1)) {
                console.log(phase, phase.timestamp !== RepairTask.NonStartedTimeStamp)
                if (phase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    displayInfo = FinishedStatus;
                }
            }

            return {
                ...phase,
                timestamp: phase.timestamp === RepairTask.NonStartedTimeStamp ? "" : phase.timestamp,
                duration,
                displayInfo,
                durationMilliseconds: phaseDuration,
            }
        });
    }


    private generateHistoryPhase(name: string, phases: IRepairTaskHistoryPhase[]): IRepairTaskPhase {

        let duration = 0;
        let status = -1;

        phases.forEach((phase, index) => {
            duration += phase.durationMilliseconds;

            if (phase.displayInfo === InProgressStatus) {
                status = 0;
            }

            if ((index + 1) === phases.length) {
                if (phase.displayInfo === FinishedStatus) {
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
            duration: TimeUtils.formatDurationAsAspNetTimespan(duration),
            durationMilliseconds: duration,
            phases,
            startCollapsed
        }
    }

}
