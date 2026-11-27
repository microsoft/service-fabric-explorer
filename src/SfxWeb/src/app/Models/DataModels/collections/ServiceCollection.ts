import { Service } from '../Service';
import { Application } from '../Application';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';
import { IClusterHealthChunk, IServiceHealthStateChunk } from '../../HealthChunkRawDataTypes';
import { Observable, of } from 'rxjs';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { SimpleCollectionWithParent } from './CollectionBase';
import { IRawService } from '../../RawDataTypes';

/**
 * ServiceCollection using generic SimpleCollectionWithParent pattern.
 * Extends with mergeClusterHealthStateChunk for health state management.
 */
export class ServiceCollection extends SimpleCollectionWithParent<Service, IRawService, Application> {
    constructor(data: DataService, parent: Application) {
        super(data, parent, Service,
            (dataService, parentApp, messageHandler) => dataService.restClient.getServices(parentApp.id, messageHandler));
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
}
