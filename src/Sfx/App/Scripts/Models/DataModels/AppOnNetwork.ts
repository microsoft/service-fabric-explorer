//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

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

}
