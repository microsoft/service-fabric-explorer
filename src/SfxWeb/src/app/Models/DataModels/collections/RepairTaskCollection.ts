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

        this.collection.forEach(task => {
            if (task.inProgress && task.raw.Target && task.raw.Target !== undefined && task.raw.Target.Kind === 'Node') {
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
              if (task.raw.Target && task.raw.Target !== undefined && task.raw.Target.Kind === 'Node') {
                this.completedRepairTasks.push(task);
              }
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
              console.log(RepairTaskMessages.messageMap)
              const jobs = stuckJobTypeMap[messageType].map(job => job.raw.TaskId);
              const repairJobPrefix = `The repair job${jobs.length > 1 ? 's' : ''} ${jobs.join()} ${jobs.length > 1 ? 'are' : 'is'}
                                            potentially stuck. ${RepairTaskMessages.messageMap(messageType)}`;
              this.data.warnings.addOrUpdateNotification({
                message: repairJobPrefix,
                level: StatusWarningLevel.Warning,
                priority: 4,
                id: messageType,
              }, true);
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
      return this.collection.filter(task => {
        const targetNodeNames = (task.raw.Target && task.raw.Target !== undefined && task.raw.Target.Kind === 'Node' && (task.raw.Target as IRawNodeRepairTargetDescription).NodeNames) ? (task.raw.Target as IRawNodeRepairTargetDescription).NodeNames : [];
        return targetNodeNames.includes(nodeName) || task.impactedNodes.includes(nodeName);
      });
    }
}
