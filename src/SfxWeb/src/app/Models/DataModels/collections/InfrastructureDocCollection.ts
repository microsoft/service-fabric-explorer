import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Constants, StatusWarningLevel } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { DataModelBase } from '../Base';
import { InfrastructureDoc } from '../InfrastructureDoc';
import { DataModelCollectionBase } from './CollectionBase';

export interface IInfrastructureDocCollectionItem {
    InfrastructureServiceName: string;
    Docs: InfrastructureDoc[];
}

export class InfrastructureDocCollectionItem extends DataModelBase<IInfrastructureDocCollectionItem> {
    InfrastructureServiceName: string;
    InfrastructureDocs: InfrastructureDoc[]=[];

    constructor(public data: DataService, public raw: IInfrastructureDocCollectionItem) {
        super(data, raw);
        this.updateInternal();
    }

    updateInternal(): Observable<any> {
        this.InfrastructureDocs.length = 0;
        for (const doc of this.raw.Docs) {
            this.InfrastructureDocs.push(doc);
        }
         this.InfrastructureServiceName = this.raw.InfrastructureServiceName;
        return of(null);
    }
}

export class InfrastructureDocCollection extends DataModelCollectionBase<InfrastructureDocCollectionItem> {
    InfrastructureServiceList: string[] = [];
    InfrastructureServiceNameToDocsMap = new Map<string, InfrastructureDoc[]>();

    public constructor(data: DataService) {
        super(data, parent);
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        this.retrieveInfraStructureServiceCollection().subscribe(service => {
            this.InfrastructureServiceList = service;
        });
        return this.data.getSystemServices(true, messageHandler).pipe(
            mergeMap(services => {
                const infrastructureServices = services.collection.filter(service => service.raw.TypeName === Constants.InfrastructureServiceType);
                return forkJoin(
                    infrastructureServices.map(service =>
                        this.data.restClient.getInfrastructureDocs(service.id).pipe(
                            map(items => new InfrastructureDocCollectionItem(this.data, {
                                InfrastructureServiceName: service.name,
                                Docs: items.map(item => new InfrastructureDoc(this.data, item))
                            }))
                        )
                    )
                );
            }),
            map(items => {
                this.InfrastructureServiceNameToDocsMap.clear();
                for (const item of items) {
                    this.InfrastructureServiceNameToDocsMap.set(item.InfrastructureServiceName, item.InfrastructureDocs);
                }
                return items;
            })
        );
    }

    public retrieveInfraStructureServiceCollection(messageHandler?: IResponseMessageHandler): Observable<string[]> {
        return this.data.getSystemServices(true, messageHandler).pipe(
            map(services => {
                const infrastructureServices = services.collection
                    .filter(service => service.raw.TypeName === Constants.InfrastructureServiceType)
                    .map(services => services.raw.Name
                    );
                this.InfrastructureServiceList = infrastructureServices;
                return infrastructureServices;
            })
        );
    }
}
