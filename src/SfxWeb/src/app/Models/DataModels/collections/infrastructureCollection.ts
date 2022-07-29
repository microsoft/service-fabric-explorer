import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Constants, StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { DataModelBase } from '../Base';
import { InfrastructureJob } from '../infrastructureJob';
import { RepairTask } from '../repairTask';
import { DataModelCollectionBase } from './CollectionBase';

export interface IInfrastructureCollectionItem {
  Name: string;
  Jobs: InfrastructureJob[];
}

export class InfrastructureCollectionItem extends DataModelBase<IInfrastructureCollectionItem> {
  isThrottled: boolean = false;

  executingMRJobs: InfrastructureJob[] = [];
  allPendingMRJobs: InfrastructureJob[] = [];
  completedMRJobs: InfrastructureJob[] = [];

  constructor(public data: DataService, public raw: IInfrastructureCollectionItem) {
    super(data, raw);
    this.updateInternal();
  }

  updateInternal(): Observable<any> {
    this.isThrottled = this.raw.Jobs.some(job => job.raw.IsThrottled) || Math.random() > .5;
    this.executingMRJobs = this.raw.Jobs.filter(job => job.raw.JobStatus === 'Executing' && Boolean(job.raw.IsActive))
    this.allPendingMRJobs = this.raw.Jobs.filter(job => job.raw.JobStatus !== 'Completed' && !Boolean(job.raw.IsActive))
    this.completedMRJobs = this.raw.Jobs.filter(job => job.raw.JobStatus === 'Completed');
    return of(null);
  }
}

export class InfrastructureCollection extends DataModelCollectionBase<InfrastructureCollectionItem> {
  static readonly bannerThrottledJobs = 'throttled-banner';

  public longRunningApprovalJob: RepairTask;
  public longestExecutingJob: RepairTask;

  public constructor(data: DataService) {
    super(data, parent);
  }

  protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
    return this.data.getSystemServices(true, messageHandler).pipe(mergeMap(services => {
      const infrastructureServices = services.collection.filter(service => service.raw.TypeName === Constants.InfrastructureServiceType);
      return forkJoin(infrastructureServices.map(service => this.data.restClient.getInfrastructureJobs(service.id).pipe
        (map(items => {
          return new InfrastructureCollectionItem(this.data, {
            Name: service.name,
            Jobs: items.map(item => new InfrastructureJob(this.data, item))
          })
        }))))
    }))
  }

  protected updateInternal(): Observable<any> {
    const throttledIS = this.collection.filter(infra => infra.isThrottled);
    if (throttledIS.length) {
      this.data.warnings.addOrUpdateNotification({
          message: `Active updates count has exceeded the max allowed for safe rollout of updates for
                    ${throttledIS.map(is => is.name).join(",")}
                    Once the existing updates complete, the pending updates will start automatically `,
          level: StatusWarningLevel.Warning,
          priority: 4,
          id: InfrastructureCollection.bannerThrottledJobs,
      }, true);
  } else {
      this.data.warnings.removeNotificationById(InfrastructureCollection.bannerThrottledJobs);
  }
    return of(null);
  }
}
