import { IRawNetwork, IRawNetworkProperties } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

export class Network extends DataModelBase<IRawNetwork> {

    public constructor(data: DataService, raw?: IRawNetwork) {
        super(data, raw);
        if (this.data.actionsEnabled()) {
            this.setUpActions();
        }
    }

    public get name(): string {
        return this.raw.name;
    }

    public get type(): string {
        return this.raw.properties.kind;
    }

    public get addressPrefix(): string {
        return this.raw.properties.networkAddressPrefix;
    }

    public get status(): string {
        return this.raw.properties.networkStatus;
    }

    public get viewPath(): string {
        return this.data.routes.getNetworkViewPath(this.name);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawNetwork> {
        return this.data.restClient.getNetwork(this.name, messageHandler).then(response => {
            return response.data;
        });

    }

    private setUpActions(): void {
        this.actions.add(new ActionWithConfirmationDialog(
            this.data.$uibModal,
            this.data.$q,
            "deleteNetwork",
            "Delete",
            "Deleting",
            () => this.delete(),
            () => this.raw.properties.networkStatus === "Ready",
            "Confirm Network Deletion",
            `Delete network '${this.name}' from cluster? `,
            this.name
        ));
    }

    private delete(): angular.IPromise<any> {
        return this.data.restClient.deleteNetwork(this.name);
    }
}

export class NetworkProperties extends DataModelBase<IRawNetworkProperties> {
    public constructor(data: DataService, raw: IRawNetworkProperties) {
        super(data, raw);

    }
}

