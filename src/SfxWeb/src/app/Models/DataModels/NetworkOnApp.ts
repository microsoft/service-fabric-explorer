import { IRawNetworkOnApp } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { Network } from './Network';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

export class NetworkOnApp extends DataModelBase<IRawNetworkOnApp> {
    public networkDetail: Network;

    public constructor(data: DataService, raw?: IRawNetworkOnApp) {
        super(data, raw);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.restClient.getNetwork(this.raw.networkName, messageHandler).pipe(map(items => {
            this.networkDetail = new Network(this.data, items);
        }));
    }

    public get viewPath(): string {
        return this.data.routes.getNetworkViewPath(this.raw.networkName);
    }
}

