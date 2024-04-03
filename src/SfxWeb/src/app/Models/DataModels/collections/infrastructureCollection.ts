import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Constants, StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { Counter, Utils } from 'src/app/Utils/Utils';
import { DataModelBase } from '../Base';
import { InfrastructureJob } from '../infrastructureJob';
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
  throttledJobs: InfrastructureJob[] = [];

  constructor(public data: DataService, public raw: IInfrastructureCollectionItem) {
    super(data, raw);
    this.updateInternal();
  }

  updateInternal(): Observable<any> {
    this.isThrottled = this.raw.Jobs.some(job => job.raw.IsThrottled);
    this.executingMRJobs = this.raw.Jobs.filter(job => job.raw.JobStatus === 'Executing' && Boolean(job.raw.IsActive))
    this.allPendingMRJobs = this.raw.Jobs.filter(job => job.raw.JobStatus !== 'Completed' && !Boolean(job.raw.IsActive))
    this.completedMRJobs = this.raw.Jobs.filter(job => job.raw.JobStatus === 'Completed');
    this.throttledJobs = this.raw.Jobs.filter(job => job.raw.IsThrottled);
    return of(null)
  }
}

export class InfrastructureCollection extends DataModelCollectionBase<InfrastructureCollectionItem> {
  static readonly bannerThrottledJobs = 'throttled-banner';
  static readonly CoordinatedPrefix = "Coordinated_";
  public throttledJobs: InfrastructureJob[];

  public constructor(data: DataService) {
    super(data, parent);
  }

  public static stripPrefix(name: string) {
    return name.replace(`fabric:/System/InfrastructureService/`, '')
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
    this.throttledJobs = [];

    const throttledIS = this.collection.filter(infra => infra.isThrottled);
    if (throttledIS.length > 0) {
      throttledIS.forEach(is => this.throttledJobs = this.throttledJobs.concat(is.throttledJobs));

      this.data.warnings.addOrUpdateNotification({
        message: `Active updates count has exceeded the max allowed for safe rollout of updates for
                    ${throttledIS.map(is => is.name).join(",")}
                    Once the existing updates complete, the pending updates will start automatically.`,
        level: StatusWarningLevel.Warning,
        priority: 4,
        id: InfrastructureCollection.bannerThrottledJobs,
      });
    } else {
      this.data.warnings.removeNotificationById(InfrastructureCollection.bannerThrottledJobs);
    }
    return this.data.getNodes().pipe(map(collection => {
      const counter = new Counter();
      collection.collection.forEach(node => {
        counter.add(node.raw.Type);
      })

      //condense cross AZ infrastructure services
      const condensedIS = new Set<string>();
      this.collection.forEach(is => {
        condensedIS.add(InfrastructureCollection.stripPrefix(is.name).split("/")[0]);
      })

      const nodetypesWithoutEnoughNodes = Array.from(condensedIS).filter(is => {
        //if IS is Coordinated_{GUID}
        if(is.startsWith(InfrastructureCollection.CoordinatedPrefix)) {
          const potentialGUID = is.slice(InfrastructureCollection.CoordinatedPrefix.length);
          //ONLY if GUID skip check otherwise check incase name is Coordinated_notguid
          if(Utils.isGUID(potentialGUID)) {
            return false;
          }
        }

        return (counter.entries().find(count => count.key === is)?.value || 0) < 5;
      });

      if (nodetypesWithoutEnoughNodes.length > 0) {
        this.data.warnings.addOrUpdateNotification({
          message: `Nodetype${nodetypesWithoutEnoughNodes.length > 1 ? 's' : ''} ${nodetypesWithoutEnoughNodes.join()} ${nodetypesWithoutEnoughNodes.length > 1 ? 'are' : 'is'} deployed with less than 5 VMs. Atleast 5 VMs in the VMSS are required to be present for the platforms updates to work reliably.
                    Please fix this misconfiguration as updates to such VMSS will be blocked soon and deployments will start failing. For more details see https://aka.ms/sfdurability `,
          level: StatusWarningLevel.Warning,
          priority: 4,
          id: "isNotEnoughNodes",
          link: 'https://docs.microsoft.com/en-us/azure/service-fabric/service-fabric-cluster-capacity#durability-characteristics-of-the-cluster',
          linkText: 'Read here for more guidance.'
        });
      }else{
        this.data.warnings.removeNotificationById("isNotEnoughNodes");
      }
    }))
  }
}
