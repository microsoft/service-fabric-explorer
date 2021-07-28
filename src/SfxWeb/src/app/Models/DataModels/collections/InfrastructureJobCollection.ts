import { forkJoin, merge, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { IRawService } from '../../RawDataTypes';
import { InfrastructureJob } from '../infrastructureJob';
import { Service } from '../Service';
import { DataModelCollectionBase } from './CollectionBase';

export class InfrastructureJobCollection extends DataModelCollectionBase<InfrastructureJob>
{
    infraServicesList: IRawService[] = []
    infraSList : Service[]
    infraJobs: any;

    public constructor(data: DataService) {
        super(data, parent);
    }

    //  protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
    //     const dateRef = new Date();
        // this.data.restClient.getServices('System', messageHandler).
        //     pipe(map(systemServices => {
        //         this.infraServicesList = systemServices.filter(service => service.Id.startsWith('System/Infras'));
        //     }));

        // //this.infraSList = this.data.systemApp.services.collection.filter(x => x.id.startsWith('System/InfrastructureService'));
        // forkJoin(this.infraServicesList.map(service => this.data.restClient.getInfrastructureJobs(service.Id, messageHandler)
        // .pipe(map (items => { this.infraJobs.concat(
        //      items.map(raw => new InfrastructureJob(service.Id, this.data, raw, dateRef)))
        // }))));

        //return of(this.infraJobs);
        
        // return this.data.restClient.getInfrastructureJobs('System/InfrastructureService/secondary', messageHandler)
        //     .pipe(map(items => {
        //         return items.map(raw => new InfrastructureJob('InfrastructureService',this.data, raw, dateRef));
        //     }));

        //base observable

    //    return this.data.restClient.getServices('System', messageHandler)
    //     //pipe into a mergemap to chain observables
    //     .pipe(
    //         mergeMap(systemServices => {
        
    //             this.infraServicesList = systemServices.filter(service => service.Id.startsWith('System/InfrastructureService'));
        
    //             return forkJoin(this.infraServicesList.map(service => {
        
    //             this.data.restClient.getInfrastructureJobs(service.Id, messageHandler).
        
    //                 pipe(map(items => this.infraJobs.concat(items.map(raw => new InfrastructureJob(service.Id, this.data, raw, dateRef)))))
    //             }));
        
    //         })
    //     );
   // }

    public map2( mrJobs: InfrastructureJob[][]) : InfrastructureJob[]  {
        var ans: InfrastructureJob[]
        //flatten jobs into 1 list before returning
        ans = Array.prototype.concat.apply([], mrJobs)
        return ans;
    }
    protected updateInternal(): Observable<any> {
        return of(null);
    }
}