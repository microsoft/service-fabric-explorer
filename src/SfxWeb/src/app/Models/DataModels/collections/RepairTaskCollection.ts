import { forkJoin, Observable, of } from 'rxjs';
import { defaultIfEmpty, map } from 'rxjs/operators';
import { RepairTaskMessages, StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { RepairTask, StatusCSS } from '../repairTask';
import { DataModelCollectionBase } from './CollectionBase';
import { IRawNodeRepairTargetDescription } from '../../RawDataTypes';

export class RepairTaskCollection extends DataModelCollectionBase<RepairTask> {
    static readonly minDurationApprovalbanner = 1000 * 60 * 15; // 15 minutes
    static readonly bannerApprovalId = 'repair-approval';

    repairTasks: RepairTask[] = [];
    completedRepairTasks: RepairTask[] = [];
    jobsOfInterest: RepairTask[] = [];

    public longRunningApprovalJob: RepairTask;
    public longestExecutingJob: RepairTask;

    public constructor(data: DataService) {
        super(data, parent);
    }

    private get nodeRepairTasks(): RepairTask[] {
        return this.collection.filter(task => task.isNodeTargeted());
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.restClient.getRepairTasks(messageHandler)
            .pipe(map(items => {
                return items.map(raw => new RepairTask(this.data, raw));
            }));
    }

    protected updateInternal(): Observable<any> {
        let longRunningApprovalRepairTask: RepairTask = null;
        let longRunningExecutingRepairTask: RepairTask = null;

        this.repairTasks = [];
        this.completedRepairTasks = [];

        this.nodeRepairTasks.forEach(task => {
            if (task.inProgress) {
                this.repairTasks.push(task);
                const executingPhase = task.getPhase('Executing');
                const approving = task.getPhase('Approved');

                // set the longest approving job if executing has no timestamp but approving does
                // showing that the current phase is in approving
                if (approving.timestamp === "" &&
                    (!longRunningApprovalRepairTask ||
                      task.getHistoryPhase('Preparing').durationMilliseconds > longRunningApprovalRepairTask.getHistoryPhase('Preparing').durationMilliseconds)) {
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

      return forkJoin(this.repairTasks.map(task => task.updateInternal())).pipe(defaultIfEmpty([]), map(() => {
        try {
          this.jobsOfInterest = this.repairTasks.filter(task => task.concerningJobInfo);

          const stuckJobTypeMap: Record<string, RepairTask[]> = {};
          this.jobsOfInterest.forEach(job => {
            const jobList = (stuckJobTypeMap[job.concerningJobInfo.type] || []);
            jobList.push(job);
            stuckJobTypeMap[job.concerningJobInfo.type] = jobList;
          })

          const messageTypes = [RepairTaskMessages.longExecutingId,
          RepairTaskMessages.seedNodeChecksId,
          RepairTaskMessages.safetyChecksId,
          RepairTaskMessages.clusterHealthCheckId];
          //loop over each type of stuck job to set or clear if there is a message
          messageTypes.forEach(messageType => {
            if (messageType in stuckJobTypeMap) {
              const jobs = stuckJobTypeMap[messageType].map(job => job.raw.TaskId);
              const firstJobId = jobs[0];
              const additionalCount = jobs.length - 1;
              const repairJobPrefix = jobs.length > 1
                ? `The repair job ${firstJobId} (and ${additionalCount} more) are potentially stuck. ${RepairTaskMessages.messageMap(messageType)}`
                : `The repair job ${firstJobId} is potentially stuck. ${RepairTaskMessages.messageMap(messageType)}`;
              this.data.warnings.addOrUpdateNotification({
                message: repairJobPrefix,
                level: StatusWarningLevel.Warning,
                priority: 4,
                id: messageType,
              }, false);
            } else {
              this.data.warnings.removeNotificationById(messageType);
            }
          })
        } catch (e) {
          console.error(e)
        }
      }));
    }

    public getRepairJobsForANode(nodeName: string) {
      return this.collection.filter(task => task.affectsNode(nodeName));
    }
}
