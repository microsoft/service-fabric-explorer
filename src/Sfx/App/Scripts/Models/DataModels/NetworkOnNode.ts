module Sfx {

    export class NetworkOnNode extends DataModelBase<IRawNetworkOnNode> {

        public networkDetail: Network;

        public constructor(data: DataService, raw?: IRawNetworkOnNode) {
            super(data, raw);
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.restClient.getNetwork(this.raw.NetworkName, messageHandler).then(items => {
                this.networkDetail = new Network(this.data, items.data);
            });
        }

        public get viewPath(): string {
            return this.data.routes.getNetworkViewPath(this.raw.NetworkName);
        }
    }

}
