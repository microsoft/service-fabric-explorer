import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { RepairTask } from '../repairTask';
import { DataModelCollectionBase } from './CollectionBase';

export class RepairTaskCollection extends DataModelCollectionBase<RepairTask> {
    static readonly minDurationApprovalbanner = 1000 * 60 * 15; // 15 minutes
    static readonly bannerId = 'repair';
    static readonly bannerApprovalId = 'repair-approval';
    repairTasks: RepairTask[] = [];
    completedRepairTasks: RepairTask[] = [];

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
        let longRunningApprovalCount = 0;
        let longRunningApprovalRepairTask: RepairTask = null;
        this.repairTasks = [];
        this.completedRepairTasks = [];
        this.collection.forEach(task => {
            if (task.inProgress) {
                this.repairTasks.push(task);
                if (task.getPhase('Approved').durationMilliseconds > RepairTaskCollection.minDurationApprovalbanner) {
                    if (!longRunningApprovalRepairTask || longRunningApprovalRepairTask.duration < task.duration) {
                        longRunningApprovalRepairTask = task;
                    }
                    longRunningApprovalCount++;
                }
            } else {
                this.completedRepairTasks.push(task);
            }
        });

        if (longRunningApprovalCount > 0) {
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
