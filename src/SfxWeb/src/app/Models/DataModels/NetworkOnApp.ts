import { IRawNetworkOnApp } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { Network } from './Network';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

export class NetworkOnApp extends DataModelBase<IRawNetworkOnApp> {
    public networkDetail: Network;

    public constructor(data: DataService, raw?: IRawNetworkOnApp) {
        super(data, raw);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
        return this.data.restClient.getNetwork(this.raw.networkName, messageHandler).then(items => {
            this.networkDetail = new Network(this.data, items.data);
        });
    }

    public get viewPath(): string {
        return this.data.routes.getNetworkViewPath(this.raw.networkName);
    }
}

