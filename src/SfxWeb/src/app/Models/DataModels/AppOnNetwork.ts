import { DataModelBase } from './Base';
import { IRawAppOnNetwork } from '../RawDataTypes';
import { Application } from './Application';
import { DataService } from 'src/app/services/data.service';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { IdUtils } from 'src/app/Utils/IdUtils';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

export class AppOnNetwork extends DataModelBase<IRawAppOnNetwork> {
    public appDetail: Application;

    public constructor(data: DataService, raw?: IRawAppOnNetwork) {
        super(data, raw);
    }

    protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
        return this.data.restClient.getApplication(IdUtils.nameToId(this.raw.ApplicationName), messageHandler).then(items => {
            this.appDetail = new Application(this.data, items.data);
            return this.appDetail.refresh().then(() => this.appDetail);
        });
    }

    public get viewPath(): string {
        return this.data.routes.getAppViewPath(this.appDetail.raw.TypeName, this.appDetail.raw.Id);
    }
}

