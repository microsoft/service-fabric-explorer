import { IRawRepairTask } from '../RawDataTypes';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';
import { Observable, of } from 'rxjs';
import { IRCAItem } from '../eventstore/rcaEngine';

export enum RepairJobType {
    TenantUpdate = 'TenantUpdate',
    PlatformUpdate = 'PlatformUpdate',
    TenantMaintenance = 'TenantMaintenance',
    PlatformMaintenance = 'PlatformMaintenance'
}

export enum Status {
  unstarted = -1,
  inProgress = 0,
  finsihed = 1
}

export interface IRepairTaskHistoryPhase {
    timestamp: string;
    name: string;
    duration: string;
    durationMilliseconds: number;
    textRight: string;
    status: Status;
  }

export interface IRepairTaskPhase {
    name: string;
    duration: string;
    durationMilliseconds: number;
    phases: IRepairTaskHistoryPhase[];
    startCollapsed: boolean;
    status: string;
    statusCss: string;
    currentPhase: number;
}

export enum StatusCSS {
    Finished = 'repair-green',
    InProgress = 'repair-blue',
    NotStarted = 'repair-gray'
}


export class RepairTask extends DataModelBase<IRawRepairTask> implements IRCAItem {
    public static readonly ExecutingStatus = 'Executing';
    public static readonly PreparingStatus = 'Preparing';
    public static NonStartedTimeStamp = '0001-01-01T00:00:00.000Z';

    public get id(): string {
        return this.raw.TaskId;
    }

    // Initially keep additional details collapsed.
    public isSecondRowCollapsed = true;
    public activeTab = 1;

    public kind = "RepairTask";

    public impactedNodes: string[] = [];
    public history: IRepairTaskHistoryPhase[] = [];
    private timeStampsCollapses: Record<string, boolean> = {};

    public timeStamp = '';

    public couldParseExecutorData = false;
    public inProgress = true;

    public duration: number;
    public displayDuration: string;

    public historyPhases: IRepairTaskPhase[];

    public executorData: any;

    public eventInstanceId: string;
    public eventProperties = {};
    constructor(public dataService: DataService, public raw: IRawRepairTask, private dateRef?: Date) {
        super(dataService, raw);
        this.updateInternal();
        this.eventInstanceId = this.raw.TaskId;
        this.eventProperties = this.raw;
    }

    /*
    WIll use created at timestamp instead of
    */
    public get startTime(): Date {
        return new Date(this.raw.History.ExecutingUtcTimestamp === RepairTask.NonStartedTimeStamp ? this.raw.History.CreatedUtcTimestamp :
            this.raw.History.ExecutingUtcTimestamp);
    }

    private getRefDate() {
      return this.dateRef || new Date();
    }

    private parseHistory() {
        let history = [
            { timestamp: this.raw.History.ClaimedUtcTimestamp, phase: 'Claimed' },
            { timestamp: this.raw.History.CreatedUtcTimestamp, phase: 'Created' },
            { timestamp: this.raw.History.PreparingUtcTimestamp, phase: 'Preparing' },
            { timestamp: this.raw.History.PreparingHealthCheckStartUtcTimestamp, phase: 'Preparing Health Check Start' },
            { timestamp: this.raw.History.PreparingHealthCheckEndUtcTimestamp, phase: 'Preparing Health Check End' },
            { timestamp: this.raw.History.ApprovedUtcTimestamp, phase: 'Approved' },
            { timestamp: this.raw.History.ExecutingUtcTimestamp, phase: 'Executing' },
            { timestamp: this.raw.History.RestoringUtcTimestamp, phase: 'Restoring' },
            { timestamp: this.raw.History.RestoringHealthCheckStartUtcTimestamp, phase: 'Restoring Health Check Start' },
            { timestamp: this.raw.History.RestoringHealthCheckEndUtcTimestamp, phase: 'Restoring Health Check End' },
            { timestamp: this.raw.History.CompletedUtcTimestamp, phase: 'Completed' },
        ];

        // if the job has been cancelled there shouldnt be Approved or executing phases anymore
        if (this.raw.ResultStatus === 'Cancelled') {
            history = history.filter(stamp => !['Approved', 'Executing'].includes(stamp.phase) );
        }

        this.history = history.map((phase, index) => {
            let duration = '';
            let status: Status = Status.unstarted;
            let phaseDuration = 0;

            if (index < (history.length - 1)) {
                const nextPhase = history[index + 1];

                // if the next phase has a timestamp then this phase is finished
                // otherwise if this phase has a timestamp it would be the active one
                if (nextPhase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    phaseDuration = new Date(nextPhase.timestamp).getTime() - new Date(phase.timestamp).getTime();
                    duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration);
                    status = Status.finsihed;
                } else if (phase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    phaseDuration = this.getRefDate().getTime() - new Date(phase.timestamp).getTime();
                    duration = TimeUtils.formatDurationAsAspNetTimespan(phaseDuration);
                    status = Status.inProgress;
                }
            }

            // handle completed phase which does not have a duration
            if (index === (history.length - 1)) {
                if (phase.timestamp !== RepairTask.NonStartedTimeStamp) {
                    status = Status.finsihed;
                }
            }

            return {
                // ...phase,
                name: phase.phase,
                timestamp: phase.timestamp === RepairTask.NonStartedTimeStamp ? '' : phase.timestamp,
                duration,
                textRight: duration,
                status,
                durationMilliseconds: phaseDuration,
            };
        });
    }


    private generateHistoryPhase(name: string, phases: IRepairTaskHistoryPhase[]): IRepairTaskPhase {

        let duration = 0;
        let status = -1;
        let currentPhase = 0;

        // check all of the phases and if any are in progress, default to not started
        // set the phase to at least 0 saying in progress
        // if last phase is finished, set overall to finished status.
        phases.forEach((phase, index) => {
            duration += phase.durationMilliseconds;

            if (phase.status === Status.inProgress) {
                status = 0;
                currentPhase = index + 1;
            }

            if ((index + 1) === phases.length) {
                if (phase.status === Status.finsihed) {
                    status = 1;
                    currentPhase = phases.length + 1;
                }
            }
        });

        let statusText: string;
        let statusCss: StatusCSS;
        let startCollapsed: boolean;
        switch (status) {
            case 1:
                statusCss = StatusCSS.Finished;
                statusText = 'Done';
                startCollapsed = true;
                break;
            case 0:
                statusCss = StatusCSS.InProgress;
                statusText = 'In Progress';
                startCollapsed = false;
                break;

            default:
                statusCss = StatusCSS.NotStarted;
                statusText = 'Not Started';
                startCollapsed = true;
                break;
        }

        if (this.timeStampsCollapses[name] === false) {
          startCollapsed = false;
        }else {
          this.timeStampsCollapses[name] = startCollapsed;
        }

        return {
            name,
            status: statusText,
            statusCss,
            duration: TimeUtils.formatDurationAsAspNetTimespan(duration), //same as textRight
            durationMilliseconds: duration,
            phases,
            startCollapsed,
            currentPhase
        };
    }

    updateInternal(): Observable<any> {
        if (this.raw.Impact) {
            this.impactedNodes = this.raw.Impact.NodeImpactList.map(node => node.NodeName);
        }
        this.timeStamp = new Date(this.raw.History.CreatedUtcTimestamp).toISOString();
        this.inProgress = this.raw.State !== 'Completed';

        const start = new Date(this.timeStamp).getTime();
        if (this.inProgress) {
            const now = this.getRefDate().getTime();
            this.duration = now - start;
        } else {
            this.duration = new Date(this.raw.History.CompletedUtcTimestamp).getTime() - start;
        }
        this.displayDuration = TimeUtils.formatDurationAsAspNetTimespan(this.duration);

        try {
            this.executorData = JSON.parse(this.raw.ExecutorData);

            this.couldParseExecutorData = true;
        } catch (e) {
            this.couldParseExecutorData = false;
        }

        this.parseHistory();

        this.historyPhases = [
            this.generateHistoryPhase('Preparing', this.history.slice(0, 5)),
        ];

        // cancelled jobs have no executing phase
        if (this.raw.ResultStatus === 'Cancelled') {
            this.historyPhases.push(this.generateHistoryPhase('Restoring', this.history.slice(6)));
        }else {
            this.historyPhases.push(this.generateHistoryPhase('Executing', [this.history[5], this.history[6]]),
                                    this.generateHistoryPhase('Restoring', this.history.slice(7)));
        }

        return of(null);
    }

    public getPhase(phase: string): IRepairTaskHistoryPhase {
        return this.history.find(historyPhase => historyPhase.name === phase);
    }

    public tooltipInfo() {
        const id = this.raw.TaskId;
        let tooltip = '';
        let type = '';
        if (id.includes(RepairJobType.TenantUpdate)) {
            type = RepairJobType.TenantUpdate;
            tooltip = 'This is either initiated by the user or on behalf of the user (auto-os upgrade for example)';
        }else if (id.includes(RepairJobType.PlatformUpdate)) {
            tooltip = 'An operation underneath the user';
            type = RepairJobType.PlatformUpdate;
        }else if (id.includes(RepairJobType.TenantMaintenance)) {
            tooltip = 'Intitiated by the user either via SF or portal';
            type = RepairJobType.TenantMaintenance;
        }else if (id.includes(RepairJobType.PlatformMaintenance)) {
            tooltip = 'Intitiated by the platform to heal something';
            type = RepairJobType.PlatformMaintenance;
        }

        return {tooltip, type};
    }

    public getHistoryPhase(phase: string): IRepairTaskPhase {
        return this.historyPhases.find(historyPhase => historyPhase.name === phase);
    }

    public changePhaseCollapse(phase: string, state: boolean) {
      this.getHistoryPhase(phase).startCollapsed = state;
      this.timeStampsCollapses[phase] = state;
    }
}
