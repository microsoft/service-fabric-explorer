import { DataModelBase } from './Base';
import { IRawNodeOnNetwork } from '../RawDataTypes';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Node } from './Node';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

export class NodeOnNetwork extends DataModelBase<IRawNodeOnNetwork> {
    nodeDetails: Node;

    public constructor(data: DataService, raw?: IRawNodeOnNetwork) {
        super(data, raw);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
        return this.data.restClient.getNode(this.raw.nodeName, messageHandler).then(items => {
            this.nodeDetails = new Node(this.data, items.data);
        });
    }

    public get viewPath(): string {
        return this.data.routes.getNodeViewPath(this.raw.nodeName);
    }
}
