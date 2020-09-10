import { Service } from '../Service';
import { Application } from '../Application';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';
import { IClusterHealthChunk, IServiceHealthStateChunk } from '../../HealthChunkRawDataTypes';
import { Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { map } from 'rxjs/operators';
import { DataModelCollectionBase } from './CollectionBase';

export class ServiceCollection extends DataModelCollectionBase<Service> {
    public constructor(data: DataService, public parent: Application) {
        super(data, parent);
    }

    public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        let serviceHealthStateChunks = null;
        if (this.parent.name === Constants.SystemAppName) {
            serviceHealthStateChunks = clusterHealthChunk.SystemApplicationHealthStateChunk.ServiceHealthStateChunks;
        } else {
            const appHealthChunk = clusterHealthChunk.ApplicationHealthStateChunks.Items.find(item => item.ApplicationName === this.parent.name);
            if (appHealthChunk) {
                serviceHealthStateChunks = appHealthChunk.ServiceHealthStateChunks;
            }
        }
        if (serviceHealthStateChunks) {
            return this.updateCollectionFromHealthChunkList<IServiceHealthStateChunk>(serviceHealthStateChunks, item => IdGenerator.service(IdUtils.nameToId(item.ServiceName)));
        }
        return of(true);
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.restClient.getServices(this.parent.id, messageHandler).pipe(map(
            items => {
                return items.map(raw => new Service(this.data, raw, this.parent));
            }
        ));
    }
}
