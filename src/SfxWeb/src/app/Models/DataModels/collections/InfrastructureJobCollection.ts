import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { InfrastructureJob, StatusCSS } from '../infrastructureJob';
import { DataModelCollectionBase } from './CollectionBase';

export class InfrastructureJobCollection extends DataModelCollectionBase<InfrastructureJob> {
    static readonly minDurationApprovalbanner = 1000 * 60 * 15; // 15 minutes
    static readonly bannerApprovalId = 'repair-approval';

    repairTasks: InfrastructureJob[] = [];
    completedInfrastructureJobs: InfrastructureJob[] = [];

    public longRunningApprovalJob: InfrastructureJob;
    public longestExecutingJob: InfrastructureJob;

    public constructor(data: DataService) {
        super(data, parent);
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        const dateRef = new Date();
        return this.data.restClient.getInfrastructureJobs(messageHandler)
            .pipe(map(items => {
                return items.map(raw => new InfrastructureJob(this.data, raw, dateRef));
            }));
    }

    protected updateInternal(): Observable<any> {
        let longRunningApprovalInfrastructureJob: InfrastructureJob = null;
        let longRunningExecutingInfrastructureJob: InfrastructureJob = null;

        this.repairTasks = [];
        this.completedInfrastructureJobs = [];

        this.collection.forEach(task => {
            if (task.inProgress) {
                this.repairTasks.push(task);
                const executingPhase = task.getPhase('Executing');
                const approving = task.getPhase('Approved');

                // set the longest approving job if executing has no timestamp but approving does
                // showing that the current phase is in approving
                if (executingPhase.timestamp === '' &&
                    approving.timestamp !== InfrastructureJob.NonStartedTimeStamp &&
                    (!longRunningApprovalInfrastructureJob ||
                        approving.durationMilliseconds > longRunningApprovalInfrastructureJob.getPhase('Approved').durationMilliseconds)) {
                        longRunningApprovalInfrastructureJob = task;
                }

                if (task.raw.State === InfrastructureJob.ExecutingStatus &&
                   (!longRunningExecutingInfrastructureJob ||
                        executingPhase.durationMilliseconds > longRunningExecutingInfrastructureJob.getPhase('Executing').durationMilliseconds)) {
                            longRunningExecutingInfrastructureJob = task;
                }
            } else {
                this.completedInfrastructureJobs.push(task);
            }
        });

        this.longRunningApprovalJob = longRunningApprovalInfrastructureJob;
        this.longestExecutingJob = longRunningExecutingInfrastructureJob;

        if (longRunningApprovalInfrastructureJob && longRunningApprovalInfrastructureJob.getPhase('Approved').durationMilliseconds > InfrastructureJobCollection.minDurationApprovalbanner) {
            this.data.warnings.addOrUpdateNotification({
                message: `Action Required: There is a repair job (${longRunningApprovalInfrastructureJob.id}) waiting for approval for ${longRunningApprovalInfrastructureJob.displayDuration}. This can block updates to this cluster. Please see aka.ms/sflongapprovingjob for more information. `,
                level: StatusWarningLevel.Warning,
                priority: 4,
                id: InfrastructureJobCollection.bannerApprovalId,
            }, true);
        } else {
            this.data.warnings.removeNotificationById(InfrastructureJobCollection.bannerApprovalId);
        }

        return of(null);
    }
}
