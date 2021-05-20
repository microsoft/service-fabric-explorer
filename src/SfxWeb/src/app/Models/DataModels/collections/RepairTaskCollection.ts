import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { RepairTask, StatusCSS } from '../repairTask';
import { DataModelCollectionBase } from './CollectionBase';

export class RepairTaskCollection extends DataModelCollectionBase<RepairTask> {
    static readonly minDurationApprovalbanner = 1000 * 60 * 15; // 15 minutes
    static readonly bannerApprovalId = 'repair-approval';

    repairTasks: RepairTask[] = [];
    completedRepairTasks: RepairTask[] = [];

    public longRunningApprovalJob: RepairTask;
    public longestExecutingJob: RepairTask;

    public constructor(data: DataService) {
        super(data, parent);
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        const dateRef = new Date();
        return this.data.restClient.getRepairTasks(messageHandler)
            .pipe(map(items => {
                return items.map(raw => new RepairTask(this.data, raw, dateRef));
            }));
    }

    protected updateInternal(): Observable<any> {
        let longRunningApprovalRepairTask: RepairTask = null;
        let longRunningExecutingRepairTask: RepairTask = null;

        this.repairTasks = [];
        this.completedRepairTasks = [];

        this.collection.forEach(task => {
            if (task.inProgress) {
                this.repairTasks.push(task);
                const executingPhase = task.getPhase('Executing');
                const approving = task.getPhase('Approved');

                // set the longest approving job if executing has no timestamp but approving does
                // showing that the current phase is in approving
                if (executingPhase.timestamp === '' &&
                    approving.timestamp !== RepairTask.NonStartedTimeStamp &&
                    (!longRunningApprovalRepairTask ||
                        approving.durationMilliseconds > longRunningApprovalRepairTask.getPhase('Approved').durationMilliseconds)) {
                        longRunningApprovalRepairTask = task;
                }

                if (task.raw.State === RepairTask.ExecutingStatus &&
                   (!longRunningExecutingRepairTask ||
                        executingPhase.durationMilliseconds > longRunningExecutingRepairTask.getPhase('Executing').durationMilliseconds)) {
                            longRunningExecutingRepairTask = task;
                }
            } else {
                this.completedRepairTasks.push(task);
            }
        });

        this.longRunningApprovalJob = longRunningApprovalRepairTask;
        this.longestExecutingJob = longRunningExecutingRepairTask;

        if (longRunningApprovalRepairTask && longRunningApprovalRepairTask.getPhase('Approved').durationMilliseconds > RepairTaskCollection.minDurationApprovalbanner) {
            this.data.warnings.addOrUpdateNotification({
                message: `Action Required: There is a repair job (${longRunningApprovalRepairTask.id}) waiting for approval for ${longRunningApprovalRepairTask.displayDuration}. This can block updates to this cluster. Please see aka.ms/sflongapprovingjob for more information. `,
                level: StatusWarningLevel.Warning,
                priority: 4,
                id: RepairTaskCollection.bannerApprovalId,
            }, true);
        } else {
            this.data.warnings.removeNotificationById(RepairTaskCollection.bannerApprovalId);
        }

        return of(null);
    }
}
