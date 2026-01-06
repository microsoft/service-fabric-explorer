import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Constants } from 'src/app/Common/Constants';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { DataModelBase } from '../Base';
import { InfrastructureDoc } from '../InfrastructureDoc';
import { DataModelCollectionBase } from './CollectionBase';

export interface IInfrastructureDocumentCollectionItem {
    InfrastructureServiceName: string;
    Documents: InfrastructureDoc[];
}

export class InfrastructureDocumentCollectionItem extends DataModelBase<IInfrastructureDocumentCollectionItem> {
    InfrastructureServiceName: string;
    InfrastructureDocuments: InfrastructureDoc[] = [];

    constructor(public data: DataService, public raw: IInfrastructureDocumentCollectionItem) {
        super(data, raw);
        this.updateInternal();
    }

    updateInternal(): Observable<any> {
        this.InfrastructureDocuments.length = 0;
        for (const doc of this.raw.Documents) {
            this.InfrastructureDocuments.push(doc);
        }
        this.InfrastructureServiceName = this.raw.InfrastructureServiceName;
        return of(null);
    }
}

export class InfrastructureDocumentCollection extends DataModelCollectionBase<InfrastructureDocumentCollectionItem> {
    InfrastructureServiceList: string[] = [];
    InfrastructureServiceNameToDocumentsMap = new Map<string, InfrastructureDoc[]>();

    public constructor(data: DataService) {
        super(data);
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.getSystemServices(true, messageHandler).pipe(
            mergeMap(services => {
                const infrastructureServices = services.collection.filter(service => service.raw.TypeName === Constants.InfrastructureServiceType);
                this.InfrastructureServiceList = infrastructureServices.map(service => service.raw.Name);
                return forkJoin(
                    infrastructureServices.map(service =>
                        this.data.restClient.getInfrastructureDocs(service.id).pipe(
                            map(items => new InfrastructureDocumentCollectionItem(this.data, {
                                InfrastructureServiceName: service.name,
                                Documents: items.map(item => new InfrastructureDoc(this.data, item))
                            }))
                        )
                    )
                );
            }),
            map(items => {
                this.InfrastructureServiceNameToDocumentsMap.clear();
                for (const item of items) {
                    this.InfrastructureServiceNameToDocumentsMap.set(item.InfrastructureServiceName, item.InfrastructureDocuments);
                }
                return items;
            })
        );
    }
}
