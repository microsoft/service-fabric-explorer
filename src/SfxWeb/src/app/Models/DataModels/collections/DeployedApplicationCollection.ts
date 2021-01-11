import { DeployedApplication } from '../DeployedApplication';
import { DataService } from 'src/app/services/data.service';
import { IClusterHealthChunk, IDeployedApplicationHealthStateChunk } from '../../HealthChunkRawDataTypes';
import { Observable, of } from 'rxjs';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { IRawDeployedApplication } from '../../RawDataTypes';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { Node } from '../Node';
import { map, mergeMap } from 'rxjs/operators';
import { DataModelCollectionBase } from './CollectionBase';

export class DeployedApplicationCollection extends DataModelCollectionBase<DeployedApplication> {
    public constructor(data: DataService, public parent: Node) {
        super(data, parent);
    }

    public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        const nodeHealthChunk = clusterHealthChunk.NodeHealthStateChunks.Items.find(chunk => chunk.NodeName === this.parent.name);
        if (nodeHealthChunk) {
            return this.updateCollectionFromHealthChunkList<IDeployedApplicationHealthStateChunk>(
                nodeHealthChunk.DeployedApplicationHealthStateChunks,
                item => IdGenerator.deployedApp(IdUtils.nameToId(item.ApplicationName)));
        }
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.restClient.getDeployedApplications(this.parent.name, messageHandler)
            .pipe(map((raw: IRawDeployedApplication[]) => {
                return raw.map(rawApp => new DeployedApplication(this.data, rawApp, this.parent));
            }));
    }

    protected updateInternal(): Observable<any> {
        // The deployed application does not include "HealthState" information by default.
        // Trigger a health chunk query to fill the health state information.
        if (this.length > 0) {
            const healthChunkQueryDescription = this.data.getInitialClusterHealthChunkQueryDescription();
            this.parent.addHealthStateFiltersForChildren(healthChunkQueryDescription);
            return this.data.getClusterHealthChunk(healthChunkQueryDescription).pipe(mergeMap(healthChunk => {
                return this.mergeClusterHealthStateChunk(healthChunk);
            }));
        }else{
            return of(true);
        }
    }
}
